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
* **OpenAI API** — 이력서 Career Profile 분석, 공고 상세 분석
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

```env id="90vd63"
OPENAI_API_KEY=your_openai_api_key_here
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
OpenAI API
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
Ranking
      ↓
OpenAI API
      ↓
Job Detail Analysis
```

### OpenAI API

두 가지 용도로 사용합니다.

**Resume Analysis**

```text id="vwzfc2"
Resume
→ OpenAI
→ Career Profile
```

직무, 경력, Skill, Tool, 산업 경험, 프로젝트 경험 등을 구조화합니다.

**Job Detail Analysis**

```text id="75hvrt"
Career Profile + Selected Job
→ OpenAI
→ Match Detail / Gap / 지원 준비 포인트
```

모든 공고를 처음부터 AI로 분석하지 않고, 사용자가 상세 분석을 요청한 공고만 분석합니다.

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

```env id="6q77gb"
OPENAI_API_KEY=your_openai_api_key_here
```

## 2. Build & Run

```bash id="gy84b9"
docker compose up --build
```

---

# Environment Variables

### `OPENAI_API_KEY`

OpenAI API 호출에 사용합니다.

```env id="iwql29"
OPENAI_API_KEY=your_openai_api_key_here
```

필수 값입니다.

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

```text id="c7m1qo"
POST /api/resume/analyze_text
```

Resume Text를 OpenAI에 전달하여 Career Profile을 생성합니다.

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

### OpenAI 호출 실패

`.env.local` 또는 Docker 환경의 `.env`에 `OPENAI_API_KEY`가 설정되어 있는지 확인합니다.

API Credit / Usage Limit도 확인합니다.

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
