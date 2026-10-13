import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from groq_client import get_llm_client

logger = logging.getLogger(__name__)

class ProposedChange(BaseModel):
    requirement_id: str = Field(description="ID of the job requirement this change addresses")
    evidence_id: str = Field(description="ID of the resume evidence supporting this change")
    section_name: Optional[str] = Field(default="", description="Name of the section where this change applies, e.g. 'Work Experience', 'Projects', or 'Skills'")
    entry_title: Optional[str] = Field(default="", description="Title/company of the entry being modified, e.g. 'Deutsche Boerse Group'")
    change_type: str = Field(description="Type of change: strictly 'reword_bullet' or 'add_keyword'")
    original_text: str = Field(description="EXACT verbatim original resume text being changed. Must NOT be empty for reword_bullet.")
    proposed_text: str = Field(description="The tailored proposed text")
    rationale: str = Field(description="Human-readable explanation of why this change is proposed based on evidence")
    evidence_text: str = Field(description="The actual evidence text from the resume used to ground this change")

class TailoringPlanOutput(BaseModel):
    items: List[ProposedChange] = Field(description="List of proposed changes to the resume")

class MatchingEngine:
    """
    Core business logic for Phase 3:
    1. Matches Job Requirements to Canonical Profile Evidence.
    2. Generates a Tailoring Plan based on matches.
    """
    
    def __init__(self):
        self.llm = get_llm_client()

def _compact_job_description(jd: Any) -> str:
    if not jd:
        return "No job description provided."
    if isinstance(jd, dict) and "extracted_data" in jd and jd["extracted_data"]:
        jd = jd["extracted_data"]
    if isinstance(jd, dict):
        parts = []
        if jd.get("title"):
            parts.append(f"Title: {jd['title']}")
        if jd.get("company"):
            parts.append(f"Company: {jd['company']}")
        if jd.get("requirements"):
            reqs = jd["requirements"]
            if isinstance(reqs, list):
                parts.append("Requirements:\n" + "\n".join(f"- {r}" for r in reqs[:15]))
            else:
                parts.append(f"Requirements: {reqs}")
        if jd.get("skills"):
            skills = jd["skills"]
            if isinstance(skills, list):
                parts.append("Required Skills: " + ", ".join(str(s) for s in skills[:20]))
            else:
                parts.append(f"Required Skills: {skills}")
        if jd.get("responsibilities"):
            resps = jd["responsibilities"]
            if isinstance(resps, list):
                parts.append("Responsibilities:\n" + "\n".join(f"- {r}" for r in resps[:10]))
        if parts:
            return "\n".join(parts)
        if jd.get("raw_text"):
            return str(jd["raw_text"])[:2000]
    return str(jd)[:2000]


def _compact_canonical_profile(profile: Any) -> str:
    if not profile or not isinstance(profile, dict):
        return str(profile)[:4000]

    parts = []
    contact = profile.get("contact") or {}
    name_obj = contact.get("name")
    if isinstance(name_obj, dict):
        parts.append(f"Candidate: {name_obj.get('value', '')}")
    elif name_obj:
        parts.append(f"Candidate: {name_obj}")

    # Skills: in canonical profile, skills is a list of skill groups with category and items
    skill_groups = profile.get("skills") or []
    if skill_groups and isinstance(skill_groups, list):
        skill_lines = []
        for grp in skill_groups:
            cat = grp.get("category", "General")
            items = [item.get("name") if isinstance(item, dict) else str(item) for item in grp.get("items", [])]
            if items:
                skill_lines.append(f"{cat}: {', '.join(items)}")
        if skill_lines:
            parts.append("Skills:\n" + "\n".join(f"- {s}" for s in skill_lines))

    # Sections: in canonical profile, sections have 'name', 'normalized_name', and 'entries'
    sections = profile.get("sections") or []
    for sec in sections:
        title = sec.get("name") or sec.get("title") or "Section"
        entries = sec.get("entries") or sec.get("items") or []
        sec_lines = [f"\n### {title}"]
        for ent in entries[:8]:
            if isinstance(ent, str):
                sec_lines.append(f"- {ent}")
            elif isinstance(ent, dict):
                heading = ent.get("title") or ent.get("role") or ""
                sub = ent.get("organization") or ent.get("company") or ""
                dates = ent.get("dates", {})
                date_str = dates.get("raw") or f"{dates.get('start', '')} - {dates.get('end', '')}".strip(" -")
                loc = ent.get("location", "")
                
                header_parts = [p for p in [heading, sub, date_str, loc] if p]
                if header_parts:
                    sec_lines.append(f"**{' | '.join(header_parts)}**")
                
                bullets = ent.get("bullets") or ent.get("description") or []
                if isinstance(bullets, list):
                    for b in bullets[:8]:
                        text = b.get("text") if isinstance(b, dict) else str(b)
                        if text:
                            sec_lines.append(f"  - {text}")
                elif isinstance(bullets, str):
                    sec_lines.append(f"  - {bullets}")
        parts.append("\n".join(sec_lines))

    return "\n".join(parts) if parts else str(profile)[:4000]


class MatchingEngine:
    """
    Core business logic for Phase 3:
    1. Matches Job Requirements to Canonical Profile Evidence.
    2. Generates a Tailoring Plan based on matches.
    """

    def __init__(self):
        self.llm = get_llm_client()

    async def generate_tailoring_plan(self, canonical_profile: dict, job_description: dict) -> TailoringPlanOutput:
        """
        Generate a set of proposed resume changes by matching job requirements against the canonical profile.
        """
        jd_text = _compact_job_description(job_description)
        profile_text = _compact_canonical_profile(canonical_profile)

        prompt = f"""
        You are an expert technical resume writer adhering strictly to ZERO HALLUCINATION standards.
        Your task is to analyze a candidate's resume (Canonical Profile) and a Job Description.
        Generate a concise list of proposed improvements to the resume to better match the target role.

        CRITICAL ZERO-HALLUCINATION & IMMUTABILITY CONSTRAINTS:
        1. WORK EXPERIENCE IS AN IMMUTABLE RECORD:
           - NEVER synthesize, invent, or add new accomplishments or bullet points under Work Experience.
           - NEVER transplant or move bullets, projects, or tasks from Projects, Coursework, or Extracurriculars into Work Experience.
           - NEVER synthesize work experience from skill keywords (e.g., if 'PostgreSQL' is listed under skills, DO NOT create a fake bullet claiming they implemented PostgreSQL databases at their employer).
           - Under Work Experience, you may ONLY propose 'reword_bullet' on an existing bullet point.
        2. ONLY REWORD EXISTING BULLET POINTS IN-PLACE (change_type='reword_bullet'):
           - 'original_text' MUST be the exact verbatim text of an existing bullet in that specific entry.
           - 'section_name' and 'entry_title' MUST identify the exact entry containing that bullet.
           - You may only polish wording, highlight relevant aspects (like CI/CD, APIs, design patterns) if already substantiated in that bullet, or strengthen action verbs.
        3. RELEVANCE TO TARGET ROLE:
           - Only propose changes that genuinely align with the target job description.
           - DO NOT propose changes for unrelated projects or technologies that do not fit the job description.
        4. TECHNICAL SKILLS (change_type='add_keyword'):
           - You may propose 'add_keyword' to a skill category ONLY if the candidate has explicitly demonstrated or listed that skill elsewhere in their profile (e.g., highlighting 'Java' in Backend if it is in Languages).

        ## Job Description
        {jd_text}

        ## Candidate Resume (Canonical Profile)
        {profile_text}
        """

        system_prompt = "You are an AI resume tailoring assistant. You only output valid JSON strictly conforming to the requested schema. You never hallucinate or invent new work experience."

        result = await self.llm.astructured_chat(
            prompt=prompt,
            schema=TailoringPlanOutput,
            system_prompt=system_prompt
        )

        return result

