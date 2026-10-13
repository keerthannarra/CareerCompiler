# Architecture Document

> Status: Updated for Phase 5 (Full Pipeline Active)

## System Architecture

CareerCompiler is an evidence-grounded resume engineering and ATS evaluation monorepo platform.

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
│Canonical Profile │     │ Tailoring Plans  │     │   HTML-to-PDF)   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## Layers

| Layer | Package / Directory | Status | Notes |
|---|---|---|---|
| Presentation | `apps/web` | ✅ Active (Phase 5) | Next.js 15 App Router, step-by-step tailoring dashboard |
| API Gateway | `apps/api` | ✅ Active (Phase 1-5) | FastAPI, Async SQLAlchemy, Pydantic schemas, Auth bypass |
| Resume Intelligence | `services/resume-parser` | ✅ Active (Phase 1) | PDF/Text extraction, Groq LLaMA 3.3 canonical profile structuring |
| Job Intelligence | `services/job-intelligence` | ✅ Active (Phase 2) | Role extraction, hard/soft skill extraction, requirements analysis |
| Matching Engine | `services/matching-engine` | ✅ Active (Phase 3) | Evidence mapping, conservative tailoring plan generation |
| Document Engineering | `services/document-engineering` | ✅ Active (Phase 4) | High-fidelity HTML templates, headless PDF compilation, validation |
| ATS Evaluation | `services/ats-evaluation` | ✅ Active (Phase 5) | ATS parsing rules, keyword alignment, factual grounding scores |

## Asynchronous Message Flow & Queues

All intensive tasks run asynchronously through Celery and Redis broker:

| Task Name | Queue | Worker Role |
|---|---|---|
| `src.tasks.parse_resume` | `parsing` | Extracts raw PDF and builds structured Canonical Profile JSON |
| `src.tasks.analyze_job` | `parsing` | Parses job description text into structured requirements |
| `src.tasks.generate_tailoring_plan` | `matching` | Maps candidate evidence to JD and proposes bullet modifications |
| `src.tasks.compile_latex` | `compilation` | Injects tailoring changes and compiles high-fidelity PDF |
| `src.tasks.evaluate_resume` | `evaluation` | Runs ATS compatibility checks and grounding scores |

Workers run with:
```bash
celery -A src.celery_app worker --pool=solo --loglevel=info
```
Default queues consumed: `[celery, parsing, matching, compilation, evaluation]`.
