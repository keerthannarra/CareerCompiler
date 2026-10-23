import io
import uuid
import logging
from typing import Dict, Any

from PyPDF2 import PdfReader

from groq_client import get_llm_client
from .schemas import ParsedProfile

logger = logging.getLogger(__name__)

class PdfParser:
    def __init__(self):
        self.llm_client = get_llm_client()
    
    async def parse(self, pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Parses a PDF file bytes, extracts text, and uses LLM to structure into Canonical Profile JSON.
        Injects UUIDs and source_refs into the LLM output.
        """
        raw_text = self._extract_text(pdf_bytes)
        
        system_prompt = (
            "You are an expert ATS parser. Your job is to extract the applicant's profile from "
            "the provided resume text and structure it precisely into the provided schema. "
            "Be incredibly accurate with dates, bullets, and section classification."
        )
        
        prompt = f"Please parse this resume text:\n\n{raw_text}"
        
        # Structure the text using Groq
        parsed_profile: ParsedProfile = await self.llm_client.astructured_chat(
            prompt=prompt,
            schema=ParsedProfile,
            system_prompt=system_prompt
        )
        
        return self._hydrate_with_ids(parsed_profile, filename)
    
    def _extract_text(self, pdf_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
            extracted = "\n".join(text).strip()
            if not extracted:
                raise ValueError("No extractable text found in PDF. The document may be scanned images without text layer or empty.")
            # Bound input size to avoid LLM context exhaustion on massive PDFs
            return extracted[:25000]
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise Exception(f"Failed to extract text from PDF: {e}")
    
    def _hydrate_with_ids(self, profile: ParsedProfile, filename: str) -> Dict[str, Any]:
        """Convert ParsedProfile to CanonicalProfile JSON with UUIDs and source refs."""
        data = profile.model_dump()
        
        def _dummy_ref():
            return {"file": filename, "line_start": 0, "line_end": 0}
            
        def _sourced(value):
            if value is None:
                return None
            return {"value": str(value), "source_ref": _dummy_ref()}

        sections_data = data.get("sections") or []
        skills_data = data.get("skills") or []

        hydrated = {
            "contact": {},
            "sections": [],
            "skills": [],
            "template": {
                "document_class": "article",
                "packages": [],
                "detected_format": "pdf_upload"
            },
            "metadata": {
                "parsed_at": "now",
                "source_file": filename,
                "total_sections": len(sections_data),
                "total_bullets": sum(len(e.get("bullets") or []) for s in sections_data for e in (s.get("entries") or [])),
                "total_skills": sum(len(g.get("items") or []) for g in skills_data),
                "parse_errors": []
            }
        }
        
        # Hydrate Contact
        contact = data.get("contact") or {}
        for k, v in contact.items():
            if v:
                hydrated["contact"][k] = _sourced(v)
            
        # Hydrate Sections
        for sec in sections_data:
            hydrated_sec = {
                "id": str(uuid.uuid4()),
                "name": sec.get("name") or "Experience",
                "normalized_name": sec.get("normalized_name") or "experience",
                "source_ref": _dummy_ref(),
                "entries": []
            }
            
            for ent in (sec.get("entries") or []):
                dates_dict = ent.get("dates") or {}
                if isinstance(dates_dict, dict):
                    dates_val = {
                        "start": dates_dict.get("start") or "",
                        "end": dates_dict.get("end") or "",
                        "raw": dates_dict.get("raw") or ""
                    }
                else:
                    dates_val = {"start": "", "end": "", "raw": str(dates_dict)}

                hydrated_ent = {
                    "id": str(uuid.uuid4()),
                    "title": ent.get("title") or "",
                    "organization": ent.get("organization") or "",
                    "location": ent.get("location") or "",
                    "subtitle": ent.get("subtitle") or "",
                    "gpa": ent.get("gpa") or "",
                    "dates": dates_val,
                    "source_ref": _dummy_ref(),
                    "bullets": []
                }
                
                for b in (ent.get("bullets") or []):
                    btext = b.get("text") if isinstance(b, dict) else str(b)
                    if btext:
                        hydrated_ent["bullets"].append({
                            "id": str(uuid.uuid4()),
                            "text": btext,
                            "source_ref": _dummy_ref()
                        })
                
                hydrated_sec["entries"].append(hydrated_ent)
                
            hydrated["sections"].append(hydrated_sec)
            
        # Hydrate Skills
        for grp in skills_data:
            hydrated_grp = {
                "id": str(uuid.uuid4()),
                "category": grp.get("category") or "Technical Skills",
                "source_ref": _dummy_ref(),
                "items": []
            }
            
            for item in (grp.get("items") or []):
                if isinstance(item, dict):
                    iname = item.get("name") or ""
                    inorm = item.get("normalized") or iname.lower()
                else:
                    iname = str(item)
                    inorm = iname.lower()

                if iname:
                    hydrated_grp["items"].append({
                        "name": iname,
                        "normalized": inorm,
                        "source_ref": _dummy_ref()
                    })
                
            hydrated["skills"].append(hydrated_grp)
            
        return hydrated
