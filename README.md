# 🔍 AI Code Reviewer — LUPA

> Bilingual GitHub App desk: review pull requests on open, post inline notes and score readability, performance and security, painted in the ividi.dev palette (black, burnt orange, amber).

[🐞 Report Bug](https://github.com/VidiPT89/AICodeReviewer/issues) · [✨ Request Feature](https://github.com/VidiPT89/AICodeReviewer/issues)

LUPA is a Next.js desk for pull request review. Install it as a GitHub App, or work on the sample PRs. When a pull request opens, the webhook reads the diff, scores the change and leaves inline notes with suggestions. The UI is European Portuguese / English, with language and dark / light theme toggles remembered in `localStorage`. Light mode keeps the same ividi.dev palette on cream paper.

Without GitHub App keys the sample PRs still run. Without a model key, review uses local tools so the desk works on a laptop. You can paste a unified diff and treat it as a local PR.

## ✨ Main Features

- 🧩 **GitHub App install** — review repos you attach to the App
- 🪝 **Webhook on PR open** — also on synchronize and reopen
- 📄 **Diff analysis** — added lines are scored and annotated
- 💬 **Inline notes** — path, line, axis, severity and a concrete suggestion
- 📊 **Quality score** — readability, performance and security, plus an overall mark
- ⚖️ **Verdict** — block, caution or ship
- 📋 **Paste a unified diff** — review a hunk without installing the App
- 📝 **Copy Markdown report** — scores, verdict and notes
- 🔎 **Filter by axis** — security, performance or readability
- 🌍 **PT / EN toggle** — remembered in `localStorage`
- 🌓 **Dark / light** — same burnt orange and amber, cream paper in light mode
- 🎬 **Motion** — ember glow, stacked sheet and a scan over the desk

## 🛠️ Technologies

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat&logo=tailwindcss&logoColor=white)
![Octokit](https://img.shields.io/badge/Octokit-GitHub-181717?style=flat&logo=github&logoColor=white)

| Category | Technology | Purpose |
|----------|-----------|---------|
| **App** | Next.js App Router | Pages and API routes |
| **GitHub** | Octokit App + webhooks | PR diffs and inline review comments |
| **Review** | Local tools, optional Groq / Gemini / OpenAI / Anthropic | Score the hunk and draft notes |
| **Motion** | Framer Motion | Landing and desk reveal |

## 🧱 Project Structure

```text
AICodeReviewer/
├── src/
│   ├── app/
│   ├── components/
│   ├── i18n/
│   └── lib/
├── tests/
├── LICENSE
└── README.md
```

## ▶️ How to Run

### Prerequisites

- **Node.js** 18+
- Optional: a GitHub App (App ID, private key, webhook secret)
- Optional: a free-tier model key (Groq or Gemini preferred)

### Installation

```bash
git clone https://github.com/VidiPT89/AICodeReviewer.git
cd AICodeReviewer
cp .env.example .env
npm install
npm test
npm run dev
```

Open [http://localhost:3006](http://localhost:3006).

To receive live pull requests, create a GitHub App with Pull requests read/write, set the webhook to `https://<your-host>/api/webhook`, and fill `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY` and `GITHUB_WEBHOOK_SECRET`.

## 📖 Usage

1. Toggle **PT** or **EN**, and **Dark** or **Light**, in the header.
2. Open the desk. Use the sample PRs, or wait for a webhook from the GitHub App.
3. Pick a pull request, then **Review diff**. Filter notes by axis if you want.
4. Click a note to highlight its line. Copy the Markdown report when you are ready.
5. Or paste a unified diff on the left and review it as a local PR.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | List sample or received PRs and stored reviews |
| POST | `/api/reviews` | Run a review on a PR id, or paste a unified `diff` |
| POST | `/api/webhook` | GitHub pull_request webhook |

## 🧪 Testing

```bash
npm test
```

`node:test` checks theme parsing, unified-diff line numbers, security blockers, SQL concat, performance notes, a clean typed hunk, verdicts and Markdown reports.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more information.

---

Developed by **David Arsénio Martins**  
🌐 [ividi.dev](https://ividi.dev/) · 💻 [github.com/VidiPT89](https://github.com/VidiPT89/)
