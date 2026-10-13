# ATS Evaluation Methodology

> Status: Active (Phase 5)

## Score Composition

| Metric | Calculation & Weight | Method |
|---|---|---|
| **Parsing Compatibility (35%)** | Structural checks (0-100) | Validates section hierarchy, date formats, contact field detection, clean typography |
| **Job Match Relevance (40%)** | Keyword alignment & semantic similarity (0-100) | Checks hard skills, soft skills, seniority indicators, and required technology matches |
| **Factual Grounding (25%)** | `grounded_claims / total_claims` (0-100) | Zero-hallucination metric ensuring every tailored bullet maps to canonical master profile |
| **Composite Score** | `0.35 * Parsing + 0.40 * JobMatch + 0.25 * Grounding` | Overall estimated ATS readiness index displayed to candidate |

## Evaluated Dimensions

1. **Text Extraction & Readability**: Clean single-column layout, standard unicode characters, absence of multi-column clipping.
2. **Section Normalization**: Recognition of `Experience`, `Education`, `Positions of Responsibility`, `Achievements`, `Skills`.
3. **Entity Extraction**: Precise parsing of company, job title, start/end dates, location, and quantitative metrics.
4. **Keyword Density**: Natural frequency of role-critical terms extracted from the job description.
5. **Factual Integrity Gate**: Any bullet point failing grounding verification is flagged for user revision before PDF generation.

## Disclaimer

All scores are labeled as *estimated CareerCompiler evaluations*. They represent algorithmic compliance guidelines and do not claim to mirror proprietary internal algorithms of specific corporate ATS vendors.
