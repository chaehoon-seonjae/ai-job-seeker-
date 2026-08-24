# AI Job Seeker

이력서를 기반으로 **잡코리아·사람인 공개 채용공고를 검색하고, 이력서와의 적합도 및 지원 포인트를 분석해주는 개인용 AI 채용공고 매칭 서비스**입니다.

## 주요 Flow

```text id="sc6jml"
이력서 업로드
→ AI Career Profile 분석
→ 희망 조건 입력
→ 채용공고 검색
→ Resume ↔ Job Matching
→ 추천 공고 Ranking
→ 공고 상세 분석
→ 지원 준비 포인트
```

## Tech Stack

* **Next.js + TypeScript** — Web / API
* **Vercel AI SDK** — 이력서 Career Profile 분석, 공고 상세 분석 (OpenAI / Anthropic / Google / Ollama 중 env로 선택, zod 스키마 기반 구조화 출력)
* **NomaDamas k-skill (`job-posting-match`)** — 잡코리아·사람인 공개 공고 검색 및 Matching
* **Docker / docker-compose** — 공유 및 실행 환경

---

# Local Setup

## 1. Install

```bash id="g1ycrs"
npm install
```

## 2. Environment Variables

`.env.example`을 `.env.local`로 복사합니다.

```bash id="s3k5br"
cp .env.example .env.local
```

Windows에서는 직접 `.env.example`을 복사해 `.env.local`로 생성해도 됩니다.

`.env.local`:

```env
# LLM 제공자 선택: openai | anthropic | google | ollama (기본: openai)
AI_PROVIDER=openai
# 모델 지정 (비우면 제공자별 기본값, ollama는 필수)
#AI_MODEL=

# 선택한 제공자의 키만 설정하면 됩니다. 키가 없으면 mock 분석 결과를 반환합니다.
OPENAI_API_KEY=your_openai_api_key_here
#ANTHROPIC_API_KEY=
#GOOGLE_GENERATIVE_AI_API_KEY=
#OLLAMA_BASE_URL=http://localhost:11434/v1
```

> `.env`, `.env.local` 등 실제 API Key가 포함된 파일은 Git에 commit하지 않습니다.

## 3. Run

```bash id="kzdw9u"
npm run dev
```

접속:

```text id="dgptkv"
http://localhost:3000
```

---

# How It Works

전체 구조는 다음과 같습니다.

```text id="quxj7s"
Resume Upload
      ↓
Resume Text Extraction
      ↓
LLM (AI_PROVIDER)
      ↓
Career Profile
      ↓
Job Preferences
      ↓
k-skill / job-posting-match
      ↓
JobKorea / Saramin
      ↓
Matched Jobs
      ↓
Ranking (매칭점수)
      ↓
LLM (AI_PROVIDER)
      ↓
Job Detail Analysis
```

### LLM (Vercel AI SDK)

LLM 호출은 `lib/ai.ts`에 모여 있고, `AI_PROVIDER` env로 제공자(OpenAI / Anthropic / Google / Ollama)를 전환합니다. 응답은 zod 스키마 기반 구조화 출력으로 강제되어 JSON 파싱 실패가 없습니다. 두 가지 용도로 사용합니다.

**Resume Analysis**

```text
Resume
→ LLM
→ Career Profile
```

직무, 경력, Skill, Tool, 산업 경험, 프로젝트 경험 등을 구조화합니다.

**Job Detail Analysis**

```text
Career Profile + Selected Job
→ LLM
→ Match Detail / Gap / 지원 준비 포인트
```

모든 공고를 처음부터 AI로 분석하지 않고, 사용자가 상세 분석을 요청한 공고만 분석합니다.

### 매칭점수

공고 목록의 매칭점수(0~100)는 LLM이 아니라 k-skill의 규칙 기반 키워드 매칭 점수입니다. 기본 35점에서 직무·스킬·산업 키워드 일치, 희망 지역, 경력 조건에 따라 가감되며, 계산 방식은 화면의 ⓘ 툴팁에서 확인할 수 있습니다.

### k-skill

채용공고 검색에는 NomaDamas의 `job-posting-match`를 사용합니다.

주요 역할:

```text id="k79akl"
Resume / Career Profile
+
희망 직무
+
지역
+
제외 조건

↓

k-skill

↓

잡코리아 / 사람인 공개 공고 검색

↓

Matching Result
```

실제 실행은 `npx @nomadamas/k-skill`을 통해 이루어집니다.

---

# Docker

다른 환경에서 실행하거나 프로젝트를 공유할 경우 Docker를 사용할 수 있습니다.

## 1. Environment

`.env.example`을 `.env`로 복사합니다.

```bash id="8cctby"
cp .env.example .env
```

`.env`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

제공자 선택과 인증 값은 위 Local Setup의 `.env.local`과 동일합니다.

## 2. Build & Run

```bash id="gy84b9"
docker compose up --build
```

---

# Environment Variables

### `AI_PROVIDER`

사용할 LLM 제공자입니다. `openai`(기본) | `anthropic` | `google` | `ollama`

### `AI_MODEL`

Optional. 모델 ID를 지정합니다. 비우면 제공자별 기본값(`gpt-4o-mini` / `claude-opus-5` / `gemini-2.5-flash`)을 사용하고, `ollama`는 반드시 지정해야 합니다.

### 제공자별 인증

선택한 제공자의 값만 설정하면 됩니다. 값이 없으면 LLM 호출 없이 mock 분석 결과를 반환합니다 (개발용).

```env
OPENAI_API_KEY=...                # AI_PROVIDER=openai
ANTHROPIC_API_KEY=...             # AI_PROVIDER=anthropic
GOOGLE_GENERATIVE_AI_API_KEY=...  # AI_PROVIDER=google
OLLAMA_BASE_URL=http://localhost:11434/v1  # AI_PROVIDER=ollama
```

### `JOBMATCH_PREPEND_PATH`

Optional.

`k-skill` 프로세스 실행 시 PATH 앞에 추가할 경로입니다.

Windows 환경 등에서 spawned process가 `node` 또는 `python`을 찾지 못할 때 사용합니다.

```env id="bcgw7z"
JOBMATCH_PREPEND_PATH=C:\\path\\to\\python;C:\\path\\to\\node;
```

### `NPX_PATH`

Optional.

PATH 대신 사용할 `npx` 실행 파일의 절대경로입니다.

```env id="u7f1ra"
NPX_PATH=C:\\Program Files\\nodejs\\npx.cmd
```

일반적인 환경에서 `npx`가 정상적으로 인식된다면 설정할 필요가 없습니다.

---

# API

현재 주요 API는 다음과 같습니다.

### Resume Analysis

```text
POST /api/resume/analyze        # 파일 업로드 (PDF/DOCX, multipart form의 file 필드)
POST /api/resume/analyze_text   # 텍스트 직접 전달
```

이력서에서 텍스트를 추출해 LLM으로 Career Profile을 생성합니다.

### Job Detail Analysis

```text
POST /api/jobs/analyze
```

Career Profile과 선택한 공고를 LLM으로 비교 분석해 강점·gap·지원 준비 포인트를 반환합니다.

### Job Matching

```text id="cqfqqi"
POST /api/jobs/match
```

Career Profile과 희망조건을 `job-posting-match`에 전달하여 추천 공고를 반환합니다.

테스트:

```bash id="d3vhjc"
curl -H "Content-Type: application/json" \
-d @test_payloads/profile.json \
http://localhost:3000/api/jobs/match
```

Resume API 테스트:

```bash id="mylw0f"
curl -H "Content-Type: application/json" \
-d @test_payloads/sample_resume.json \
http://localhost:3000/api/resume/analyze_text
```

---

# Troubleshooting

### 분석 결과가 비어 있음 (mock 동작)

선택한 `AI_PROVIDER`의 API Key(또는 `OLLAMA_BASE_URL`)가 없으면 LLM을 호출하지 않고 빈 mock 결과를 반환합니다. `.env.local` 또는 Docker 환경의 `.env` 설정을 확인합니다.

API Credit / Usage Limit도 확인합니다.

### Ollama에서 출력 품질이 낮음

소형 모델(예: llama3.2 3B)은 분석 프롬프트를 제대로 소화하지 못할 수 있습니다. `llama3.1:8b` 이상 모델을 권장합니다.

### k-skill 실행 실패

`k-skill job-posting-match`가 `npx`를 통해 실행 가능한지 확인합니다.

```bash id="6x3mmr"
npx @nomadamas/k-skill
```

Container 또는 Windows 환경에서 `node`, `python`, `npx`를 찾지 못하는 경우:

```env id="n9qzxl"
JOBMATCH_PREPEND_PATH=...
NPX_PATH=...
```

를 설정합니다.

---

# Privacy

업로드된 Resume은 영구 저장하지 않습니다.

* Resume DB 저장 없음
* Resume 파일 영구 보관 없음
* 자동 입사지원 없음
* 채용사이트에 개인정보 자동 입력 없음

Resume 데이터는 Career Profile 분석 및 채용공고 Matching 과정에서만 사용합니다.

---

# Current Scope

현재는 개인 사용을 위한 MVP입니다.

**지원 기능**

* Resume Upload
* AI Career Profile 분석
* Career Profile 수정
* 희망 조건 입력
* 잡코리아 / 사람인 공개 공고 검색
* Resume ↔ Job Matching
* 추천 공고 Ranking
* Job 상세 분석
* 지원 준비 포인트

**현재 제외**

* Login / Account
* Database
* 공고 저장
* 지원 현황 관리
* 자동 지원
* 자기소개서 생성
* 채용공고 알림

현재 목표는 기능 확장보다 아래 핵심 Flow가 안정적으로 동작하는 것입니다.

```text id="w3ajx7"
Resume
→ AI Analysis
→ Job Search
→ Matching
→ Ranking
→ Detail Analysis
```
