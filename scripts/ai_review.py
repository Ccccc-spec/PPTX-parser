import os
import requests  # type: ignore
from openai import OpenAI  # type: ignore

# ---------- 配置 ----------
MAX_TOKENS = 3000
DEBUG = True
AI_MARKER = "## 🤖 AI Code Review"

# 严谨的模型候选列表 (基于 2026 OpenRouter 最新文档)
# 优先级：2.0 Flash 正式版 > 2.0 Flash 思考版 > 1.5 Flash 稳定版
MODEL_CANDIDATES = [
    "google/gemini-2.0-flash-001",
    "google/gemini-2.0-flash-thinking-exp:free",
    "google/gemini-flash-1.5",
]
# ------------------------

def main():
    # 从环境变量获取参数
    repo = os.environ.get("REPO")
    pr_number = os.environ.get("PR_NUMBER")
    token = os.environ.get("GITHUB_TOKEN")
    api_key = os.environ.get("LLM_API_KEY")

    if not all([repo, pr_number, token, api_key]):
        print("[ERROR] 缺少必要的环境变量 (REPO, PR_NUMBER, GITHUB_TOKEN, LLM_API_KEY)")
        return

    # 初始化 OpenRouter 客户端
    client = OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "https://github.com/ai-review-action", # OpenRouter 要求的标识
            "X-Title": "AI PR Reviewer",
        }
    )
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }

    # 1. 清理该 PR 之前的旧 AI 评论
    comments_url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    try:
        old_comments = requests.get(comments_url, headers=headers).json()
        for comment in old_comments:
            if AI_MARKER in comment.get("body", ""):
                requests.delete(comment["url"], headers=headers)
                if DEBUG: print(f"[INFO] 已清理旧的 AI 评论: {comment['id']}")
    except Exception as e:
        print(f"[WARN] 清理旧评论失败: {e}")

    # 2. 获取 PR 的整体累计 Diff (Base vs Head)
    # 这确保了 AI 看到的是“最终合并态”，忽略中间 Commit 的反复修改
    diff_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    diff_headers = headers.copy()
    diff_headers["Accept"] = "application/vnd.github.v3.diff"
    
    try:
        diff_res = requests.get(diff_url, headers=diff_headers)
        diff_res.raise_for_status()
        full_diff = diff_res.text
    except Exception as e:
        print(f"[ERROR] 获取 Diff 失败: {e}")
        return

    # 3. 构建 Prompt
    prompt = f"""
作为一名资深的软件工程师，请你对这份拉取请求（PR）的【最终汇总改动】进行代码审查。
请忽略中间提交中已经修复的错误，只针对当前的最终代码状态提出建议。

审查要求：
1. 逻辑缺陷：是否存在边界条件处理不当、潜在的内存泄漏或死锁？
2. 性能优化：是否有更高效的算法或不必要的计算？
3. 安全性：是否存在 SQL 注入、敏感信息泄露或鉴权漏洞？
4. 可维护性：变量命名是否清晰？代码是否过于复杂？符合 clean code 原则吗？

请先给出一个【总体评价】，然后按文件列出具体的【改进建议】。

代码 Diff 内容：
{full_diff[:18000]} 
"""

    # 4. 尝试调用 LLM (多模型容错逻辑)
    ai_suggestion = None
    last_error = ""

    for model_id in MODEL_CANDIDATES:
        try:
            if DEBUG: print(f"[INFO] 正在尝试调用模型: {model_id}")
            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": "你是一位务实、犀利且专业的代码审查专家。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1, # 保持输出的确定性和专业性
            )
            ai_suggestion = response.choices[0].message.content
            if DEBUG: print(f"[INFO] 模型 {model_id} 调用成功")
            break 
        except Exception as e:
            last_error = str(e)
            print(f"[WARN] 模型 {model_id} 失败: {last_error}")
            continue

    if not ai_suggestion:
        ai_suggestion = f"❌ AI 审查调用失败。尝试了所有模型，最后的错误信息为: {last_error}"

    # 5. 发布全新的 Review 评论
    full_body = f"{AI_MARKER}\n\n> 💡 *此审查基于该 PR 的最新代码状态（汇总了所有 Commit 的改动）。*\n\n{ai_suggestion}"
    
    post_res = requests.post(comments_url, headers=headers, json={"body": full_body})
    if post_res.status_code == 201:
        print("[INFO] 新的 AI 审查建议已成功发布。")
    else:
        print(f"[ERROR] 发布评论失败: {post_res.status_code} {post_res.text}")

if __name__ == "__main__":
    main()