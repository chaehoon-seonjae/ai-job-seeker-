# ai-job-seeker

Minimal personal AI job matching MVP.

Quick start

1. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.
2. Install dependencies:

```bash
npm install
```

3. Run locally:

```bash
npm run dev
```

Docker (recommended for sharing with others)

1. Copy `.env.example` to `.env` and set your `OPENAI_API_KEY` and optionally `JOBMATCH_PREPEND_PATH` or `NPX_PATH`.
2. Build and run with docker-compose:

```bash
docker compose build
docker compose up
```

Configuration
- `.env.example`: example env vars (copy to `.env`).
- `OPENAI_API_KEY`: required for real OpenAI analysis.
- `JOBMATCH_PREPEND_PATH`: (optional) semicolon-separated paths to prepend to PATH inside the spawned k-skill process (Windows style). Useful when `node` or `python` aren't on PATH inside the runtime.
- `NPX_PATH`: (optional) absolute path to `npx` executable to use instead of relying on PATH.

Notes:
- `k-skill job-posting-match` must be available via `npx @nomadamas/k-skill` for real job search. If not available, the app will show helpful errors and supports a mock path for development.
- Uploaded resumes are not stored persistently.
# ai-job-seeker-

Git + docker-compose (shareable workflow)

1. Push the repository to a Git host (GitHub/GitLab):

```bash
# from project root
git init
git add .
git commit -m "initial"
git branch -M main
git remote add origin git@github.com:YOUR_USER/ai-job-seeker.git
git push -u origin main
```

2. Instruct other users to run these steps after cloning:

```bash
git clone git@github.com:YOUR_USER/ai-job-seeker.git
cd ai-job-seeker
cp .env.example .env
# Edit .env and set OPENAI_API_KEY (and optionally JOBMATCH_PREPEND_PATH / NPX_PATH)
docker compose up --build
```

3. Example minimal `.env` (copy from `.env.example`):

```
OPENAI_API_KEY=your_openai_api_key_here
# Optional:
#JOBMATCH_PREPEND_PATH=C:\\Users\\CNXK\\AppData\\Local\\Programs\\Python\\Python311;C:\\Program Files\\nodejs;
#NPX_PATH=C:\\Program Files\\nodejs\\npx.cmd
```

4. Verify the service is running by calling the APIs:

```bash
curl -H "Content-Type: application/json" -d @test_payloads/profile.json http://localhost:3000/api/jobs/match
curl -H "Content-Type: application/json" -d @test_payloads/sample_resume.json http://localhost:3000/api/resume/analyze_text
```

Troubleshooting notes
- If `k-skill` fails inside the container, ensure `JOBMATCH_PREPEND_PATH` or `NPX_PATH` are set so the spawned process finds `node` and `python`.
- If OpenAI calls fail, set `OPENAI_API_KEY` in `.env`.