import os
import requests # type: ignore
from openai import OpenAI # type: ignore

# ---------- 配置 ----------
MAX_TOKENS = 3000
DEBUG = True
AI_MARKER = "## 🤖 AI Code Review"
# ------------------------

def main():
    repo = os.environ.get("REPO")
    pr_number = os.environ.get("PR_NUMBER")
    token = os.environ.get("GITHUB_TOKEN")
    api_key = os.environ.get("LLM_API_KEY")

    client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
    headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}

    # 1. 清理该 PR 之前的旧 AI 评论 (保持页面整洁)
    # 这样当你有新 Commit 时，旧的 Review 建议会被删掉，换成针对最新代码的建议
    comments_url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    old_comments = requests.get(comments_url, headers=headers).json()
    for comment in old_comments:
        if AI_MARKER in comment.get("body", ""):
            requests.delete(comment["url"], headers=headers)
            if DEBUG: print(f"[INFO] Deleted old AI comment: {comment['id']}")

    # 2. 获取 PR 的整体 Diff (Base vs Head)
    # 注意：这里获取的是整个 PR 累计的变动，不是单个 commit 的变动
    diff_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    diff_headers = headers.copy()
    diff_headers["Accept"] = "application/vnd.github.v3.diff"
    
    diff_res = requests.get(diff_url, headers=diff_headers)
    full_diff = diff_res.text

    # 3. 构建更聪明的 Prompt
    # 告诉 AI 忽略中间过程，只看最终结果
    prompt = f"""
作为高级工程师，请审查此拉取请求的最终汇总更改。
忽略后续提交中修正的任何中间错误。
重点关注：
- 最终状态下的逻辑缺陷和边缘情况。
- 性能和安全性。
- 代码风格和可维护性。
先给出一个概要性的总结，然后给出基于文件的具体建议。
PR 详情说明：
{full_diff[:15000]} 
"""
    # 注：15000字符约为 4k-5k tokens，Gemini 2.0 Flash 足够处理
    try:
            response = client.chat.completions.create(
                # 选项 A: OpenRouter 目前最通用的 2.0 Flash 路径
                model="google/gemini-2.0-flash-exp:free", 
                
                # 或者选项 B (如果上面的不行):
                # model="google/gemini-flash-1.5", 
                
                messages=[
                    {"role": "system", "content": "你是一位务实且专业的代码审查员。你只关心这个 PR 的最终结果。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            ai_suggestion = response.choices[0].message.content
    except Exception as e:
        ai_suggestion = f"❌ AI Review failed during processing: {str(e)}"

    # 4. 发布全新的 Review 评论
    full_body = f"{AI_MARKER}\n\n> 💡 *This review is based on the latest commit in this PR.*\n\n{ai_suggestion}"
    requests.post(comments_url, headers=headers, json={"body": full_body})
    print("[INFO] New AI review posted.")

if __name__ == "__main__":
    main()