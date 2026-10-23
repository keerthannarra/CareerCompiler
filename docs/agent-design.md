# AI Agent Design
 
> Status: Updated for Phase 5
 
## Agent Pipeline (BRD §12)
 
| Agent / Component | Package | Primary Task | Model / Engine |
|---|---|---|---|
| Resume Parser Agent | `services/resume-parser` | PDF Text extraction & Canonical JSON Structuring | LLaMA 3.3 70B via Groq |
| Job Intelligence Analyzer | `services/job-intelligence` | Job description parsing, skill & level extraction | LLaMA 3.3 70B via Groq |
| Matching & Tailoring Agent | `services/matching-engine` | Maps profile evidence to requirements & creates bullet plans | LLaMA 3.3 70B + semantic matcher |
| Document Rendering Agent | `services/document-engineering` | Jinja2 HTML layout rendering & headless PDF compilation | Playwright / Headless Browser |
| ATS Analyzer Agent | `services/ats-evaluation` | Computes ATS readability, keyword match, and factual grounding | Deterministic rule engine + embeddings |
 
## Framework
 
- LangChain + Groq API (`packages/llm-client`) with `llama-3.3-70b-versatile`.
- Strict Pydantic JSON schema output parsing on all LLM calls.
- Exponential backoff retry policies via `tenacity`.
 
## Guardrails
 
- **Zero Hallucination Tolerance**: Experience, companies, dates, and core metrics must map to the master canonical profile.
- **Evidence-Grounded Tailoring**: Rephrasing is constrained to highlighting verified relevant achievements and aligning terminology with the target job posting.
- **Audit Logging**: Every upload, parse, tailoring generation, and document export is persisted with full metadata in PostgreSQL.
