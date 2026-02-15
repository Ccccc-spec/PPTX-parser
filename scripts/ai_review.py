import os
import requests  # type: ignore
from openai import OpenAI  # type: ignore

# ---------- 配置 ----------
MAX_TOKENS = 2000
CHUNK_SIZE = 5000
DEBUG = True
# ------------------------

def main():
    repo = os.environ.get("REPO")
    pr_number = os.environ.get("PR_NUMBER")
    token = os.environ.get("GITHUB_TOKEN")
    api_key = os.environ.get("LLM_API_KEY")

    if not all([repo, pr_number, token, api_key]):
        print("[ERROR] Missing environment variables.")
        return

    # 初始化 OpenRouter 客户端
    client = OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )

    # 获取 PR diff
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3.diff"
    }

    r = requests.get(url, headers=headers)
    r.raise_for_status()
    full_diff = r.text

    if DEBUG:
        print(f"[INFO] Total diff length: {len(full_diff)} chars")

    # 拆分 diff 为文件块
    files = full_diff.split("diff --git")
    chunks = []
    for f in files[1:]:
        for i in range(0, len(f), CHUNK_SIZE):
            chunks.append(f[i:i+CHUNK_SIZE])

    # 防止重复评论
    existing_comments = requests.get(
        f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments",
        headers={"Authorization": f"token {token}"}
    ).json()

    ai_comment_marker = "## 🤖 AI Code Review"
    if any(ai_comment_marker in c.get("body","") for c in existing_comments):
        print("[INFO] AI review already exists. Skipping.")
        return

    # 调用 LLM
    reviews = []
    for idx, chunk in enumerate(chunks, start=1):
        prompt = f"Analyze this code diff chunk for bugs and performance:\n\n{chunk}"
        try:
            response = client.chat.completions.create(
                model="google/gemini-2.5-flash",
                messages=[
                    {"role": "system", "content": "You are an expert code reviewer."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=MAX_TOKENS,
            )
            review_text = response.choices[0].message.content
            reviews.append(f"### Chunk {idx}\n{review_text}")
        except Exception as e:
            reviews.append(f"### Chunk {idx}\n❌ AI Review failed: {str(e)}")

    # 合并并发布
    full_review = ai_comment_marker + "\n\n" + "\n\n".join(reviews)
    res = requests.post(
        f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments",
        headers={"Authorization": f"token {token}"},
        json={"body": full_review},
    )
    
    if res.status_code == 201:
        print("[INFO] AI review posted successfully.")

if __name__ == "__main__":
    main()