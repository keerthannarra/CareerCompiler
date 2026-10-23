# CareerCompiler

**AI-Powered, Evidence-Grounded Resume Engineering and ATS Evaluation Platform**

CareerCompiler helps professionals maintain an authoritative master resume as a single source of truth, then generate job-specific variants that stay strictly grounded in verified experience, maximize compatibility with recruiter and ATS workflows, and eliminate hallucinated credentials.

---

## 🎯 Core Philosophy

- **Immutable Ground Truth**: Your master resume serves as the sole authoritative repository of verified experience, bullet points, skills, and metrics.
- **Evidence-Grounded Tailoring**: Every modification, highlighted skill, or tailored accomplishment links directly back to verified claims from your profile.
- **Zero Hallucination Tolerance**: LLMs propose contextual rephrasing and relevance rankings, but cannot invent jobs, dates, technologies, or achievements.
- **Auditability & Control**: Users can review and adjust tailoring plans before compiling pixel-perfect, ATS-parseable PDF documents.

---

## 🏗️ Architecture & Pipeline Flow

CareerCompiler operates as an asynchronous, microservice-inspired monorepo:

```
┌─────────────────┐       ┌─────────────────┐
│ Next.js Web App │ <---> │  FastAPI Backend│
│   (apps/web)    │       │   (apps/api)    │
└─────────────────┘       └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
     │  PostgreSQL 16  │  │  Redis + Celery │  │   Groq LLMs     │
     │   (+pgvector)   │  │ (Async Workers) │  │  (LangChain)    │
     └─────────────────┘  └────────┬────────┘  └─────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Resume Parser   │     │ Job Intelligence │     │ Document Engine  │
│(PyPDF / TexSoup) │     │  & Match Engine  │     │  (Playwright /   │
│Canonical Profile │     │ Tailoring Plans  │     │    Headless)     │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### End-to-End Workflow:
1. **Resume Ingestion (`services/resume-parser`)**: Extract raw text and structure it via LLM into a strongly-typed **Canonical Profile** (`packages/schemas/canonical_profile.schema.json`) with UUID-tracked bullet points and source references.
2. **Job Description Intelligence (`services/job-intelligence`)**: Deconstruct target job postings into required hard skills, soft skills, seniority indicators, and core responsibilities.
3. **Semantic Matching & Tailoring (`services/matching-engine`)**: Map job requirements against candidate evidence. Generate itemized tailoring recommendations (conservative re-weighting, targeted keyword alignment, and impact bullet re-ordering).
4. **Document Engineering & Compilation (`services/document-engineering`)**: Inject approved changes into high-fidelity resume templates and compile them into clean PDFs using sandboxed headless browser rendering.
5. **Interactive Dashboard (`apps/web`)**: A modern Next.js interface providing step-by-step progress tracking, tailoring approvals, and instant PDF preview/download.

---

## 📂 Repository Structure

```
CareerCompiler/
├── apps/
│   ├── api/                     # FastAPI backend application
│   │   ├── src/
│   │   │   ├── routers/         # REST API routes (resumes, jobs, tailoring, docs)
│   │   │   ├── models/          # SQLAlchemy async database models
│   │   │   ├── celery_app.py    # Background worker task definitions
│   │   │   └── config.py        # Pydantic settings & env management
│   │   ├── alembic/             # Database migrations
│   │   └── test_e2e.py          # End-to-end integration test suite
│   └── web/                     # Next.js 15 client dashboard (React 18, TypeScript)
├── services/
│   ├── resume-parser/           # PDF text extraction & Canonical Profile builder
│   ├── job-intelligence/        # Job description analysis & skill extraction
│   ├── matching-engine/         # Requirement matching & tailoring plan generator
│   └── document-engineering/    # HTML/LaTeX templating & PDF compilation
├── packages/
│   ├── llm-client/              # Unified Groq / LangChain client wrapper
│   └── schemas/                 # Shared JSON schemas (canonical profiles, plans, JDs)
├── benchmarks/                  # ATS evaluation datasets & scoring benchmarks
├── infra/                       # Database initialization scripts
├── scripts/
│   ├── run_local_stack.sh       # Shell script to boot Docker & run migrations
│   └── seed_dev_data.sh         # Seeds default development user & headers
├── docker-compose.yml           # PostgreSQL 16 (pgvector) + Redis 7 services
└── context.md                   # Living technical context and phase roadmap
```

---

## 🧰 Tech Stack

- **Backend & APIs**: Python 3.12+, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy 2.0 (Async)](https://docs.sqlalchemy.org/), [Alembic](https://alembic.sqlalchemy.org/)
- **Distributed Tasks**: [Celery](https://docs.celeryq.dev/) with [Redis](https://redis.io/) broker & backend
- **Databases**: [PostgreSQL 16](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector)
- **AI & NLP**: [Groq](https://groq.com/) (LLaMA 3.3 70B & 3.1 8B), [LangChain](https://www.langchain.com/), [PyPDF2](https://pypdf2.readthedocs.io/)
- **Document Generation**: Sandboxed [Playwright](https://playwright.dev/) / Docker HTML-to-PDF compilation & Tectonic
- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), React 18, TypeScript, Vanilla CSS design tokens
- **Package Management**: [pnpm](https://pnpm.io/) for web monorepo workspaces, `pip` editable installs for Python services

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Docker & Docker Compose](https://www.docker.com/)
- [Python 3.12+](https://www.python.org/)
- [Node.js 20+](https://nodejs.org/) & [pnpm 9+](https://pnpm.io/)
- A [Groq API Key](https://console.groq.com/) for LLM analysis

---

### 1. Environment Configuration

Create a `.env` file in the root directory (or in `apps/api/`):

```bash
# Environment & Server
ENVIRONMENT=development
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8000
DEV_AUTH_BYPASS=true
DEV_USER_ID=11111111-1111-1111-1111-111111111111

# Databases
DATABASE_URL=postgresql+asyncpg://ccuser:ccpassword@localhost:5432/careercompiler
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# LLM Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL_PRIMARY=llama-3.3-70b-versatile
GROQ_MODEL_FAST=llama-3.1-8b-instant

# Storage
UPLOAD_DIR=./uploads
```

---

### 2. Start Infrastructure Services

Spin up PostgreSQL (with pgvector) and Redis using Docker:

```bash
docker compose up -d postgres redis
```

Or run the automated bootstrap script (on macOS/Linux/WSL):
```bash
bash scripts/run_local_stack.sh
```

---

### 3. Backend Setup & Migrations

From `apps/api`:

**On Windows (PowerShell):**
```powershell
cd apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
pip install -e ..\..\services\resume-parser
pip install -e ..\..\services\job-intelligence
pip install -e ..\..\services\matching-engine
pip install -e ..\..\services\document-engineering
pip install -e ..\..\packages\llm-client

alembic upgrade head
```

**On Linux / macOS:**
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
pip install -e ../../services/resume-parser
pip install -e ../../services/job-intelligence
pip install -e ../../services/matching-engine
pip install -e ../../services/document-engineering
pip install -e ../../packages/llm-client

alembic upgrade head
```

#### Seed Dev User:
```bash
# Optional: Seed the default dev user in PostgreSQL
bash scripts/seed_dev_data.sh
```

---

### 4. Running the Services

You need both the **FastAPI app** and the **Celery worker** running:

**Terminal 1 — FastAPI Server:**
```bash
cd apps/api
uvicorn src.main:app --reload --port 8000
```
- API is accessible at: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

**Terminal 2 — Celery Worker:**
```bash
cd apps/api
# On Linux/macOS:
celery -A src.celery_app worker --loglevel=info
# On Windows (use gevent or solo pool):
celery -A src.celery_app worker --pool=solo --loglevel=info
```

**Terminal 3 — Next.js Web Application:**
```bash
# From repository root
pnpm install
pnpm dev:web
```
- Web interface is accessible at: `http://localhost:3000`

---

## 🔌 API Reference Highlights

All endpoints reside under `/api/v1`. When `DEV_AUTH_BYPASS=true`, include `X-Dev-User-Id: 11111111-1111-1111-1111-111111111111`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/health` | `GET` | Health check probe |
| `/api/v1/master-resumes` | `POST` | Upload master resume (PDF / multipart) |
| `/api/v1/master-resumes/{id}` | `GET` | Retrieve resume record and canonical profile JSON |
| `/api/v1/job-descriptions` | `POST` | Ingest and trigger analysis on a target job description |
| `/api/v1/job-descriptions/{id}`| `GET` | Fetch parsed job description requirements and skills |
| `/api/v1/tailoring-plans` | `POST` | Generate evidence-grounded tailoring plan for a resume + job pair |
| `/api/v1/tailoring-plans/{id}` | `GET` | View tailoring plan proposals and status |
| `/api/v1/tailoring-plans/{id}/items` | `PUT` | Approve, reject, or edit proposed modifications |
| `/api/v1/documents/compile` | `POST` | Trigger sandboxed PDF compilation |
| `/api/v1/documents/{id}` | `GET` | Poll document compilation status and validation checks |
| `/api/v1/documents/{id}/download` | `GET` | Download generated tailored resume PDF |

---

## 🧪 Testing

Run automated tests from `apps/api`:

```bash
cd apps/api

# Run unit and integration tests with pytest
pytest

# Run the end-to-end pipeline verification test
python test_e2e.py
```

---

## 📖 Additional Documentation

- [context.md](file:///c:/Users/Dell/OneDrive/Documents/Github/CareerCompiler/context.md) — Living technical context, architecture decisions (ADRs), and phase status.
- [CareerCompiler_BRD_v2.md](file:///c:/Users/Dell/OneDrive/Documents/Github/CareerCompiler/CareerCompiler_BRD_v2.md) — Business requirements, functional specifications, and ATS evaluation rubric.
- [docs/architecture.md](file:///c:/Users/Dell/OneDrive/Documents/Github/CareerCompiler/docs/architecture.md) — Architectural layers and asynchronous messaging patterns.

---

## 📄 License

Internal / Proprietary. See repository terms.
