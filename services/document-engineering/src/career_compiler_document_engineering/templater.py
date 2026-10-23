"""
Templater for Document Engineering
Applies TailoringPlan changes to a CanonicalProfile JSON and renders HTML via Jinja2.
"""
from jinja2 import Environment, FileSystemLoader
import copy
from pathlib import Path

def apply_tailoring_plan(profile_data: dict, plan_items: list[dict]) -> dict:
    """
    Mutates a copy of the canonical profile JSON with approved TailoringPlan changes.
    Enforces strict section boundaries, zero-hallucination rules, and never appends
    fabricated bullets into Work Experience.
    """
    modified_profile = copy.deepcopy(profile_data)
    sections = modified_profile.get("sections", [])
    skills = modified_profile.get("skills", [])
    
    for item in plan_items:
        new_text = (item.get("user_edited_text") or item.get("proposed_text") or "").strip()
        change_type = item.get("change_type")
        original_text = (item.get("original_text") or "").strip()
        target_sec = (item.get("section_name") or "").strip().lower()
        target_entry = (item.get("entry_title") or "").strip().lower()
        
        if not new_text:
            continue

        # 1. Reword / Edit Bullet (In-place update of an existing bullet)
        if change_type in ("reword_bullet", "reorder_bullet", "edit_bullet"):
            if not original_text:
                continue

            replaced = False
            # Search all sections and entries
            for sec in sections:
                sec_norm = (sec.get("name") or sec.get("normalized_name") or "").lower()
                for entry in sec.get("entries", []):
                    ent_title = (entry.get("title") or entry.get("organization") or "").lower()
                    
                    # If target_entry specified and doesn't match this entry, skip for now
                    if target_entry and target_entry not in ent_title and ent_title not in target_entry:
                        continue
                    
                    bullets = entry.get("bullets", [])
                    for idx, b in enumerate(bullets):
                        b_text = b.get("text", "") if isinstance(b, dict) else str(b)
                        if original_text in b_text or b_text in original_text:
                            if isinstance(b, dict):
                                b["text"] = new_text
                            else:
                                bullets[idx] = new_text
                            replaced = True
                            break
                    if replaced:
                        break
                if replaced:
                    break

            # Fallback search across all entries if target_entry didn't match directly
            if not replaced:
                for sec in sections:
                    for entry in sec.get("entries", []):
                        bullets = entry.get("bullets", [])
                        for idx, b in enumerate(bullets):
                            b_text = b.get("text", "") if isinstance(b, dict) else str(b)
                            if original_text in b_text or b_text in original_text:
                                if isinstance(b, dict):
                                    b["text"] = new_text
                                else:
                                    bullets[idx] = new_text
                                replaced = True
                                break
                        if replaced:
                            break
                    if replaced:
                        break

        # 2. Add / Update Keyword in Technical Skills
        elif change_type == "add_keyword" and skills:
            for grp in skills:
                cat = (grp.get("category") or "").strip()
                cat_lower = cat.lower()
                
                # Check if this skill group matches the target
                matches_cat = (
                    cat_lower in original_text.lower() or
                    cat_lower in target_sec or
                    cat_lower in target_entry or
                    (not target_sec and not target_entry and cat_lower in new_text.lower())
                )
                
                if matches_cat:
                    # If proposed_text is formatted like "Backend: A, B, C, Java"
                    if ":" in new_text and cat_lower in new_text.lower().split(":")[0]:
                        items_str = new_text.split(":", 1)[1]
                        parsed_items = [s.strip() for s in items_str.split(",") if s.strip()]
                        existing_names = {
                            (it.get("name") if isinstance(it, dict) else str(it)).lower()
                            for it in grp.get("items", [])
                        }
                        for kw in parsed_items:
                            if kw.lower() not in existing_names:
                                grp.setdefault("items", []).append({
                                    "name": kw,
                                    "normalized": kw.lower(),
                                    "source_ref": {}
                                })
                    else:
                        existing_names = {
                            (it.get("name") if isinstance(it, dict) else str(it)).lower()
                            for it in grp.get("items", [])
                        }
                        if new_text.lower() not in existing_names:
                            grp.setdefault("items", []).append({
                                "name": new_text,
                                "normalized": new_text.lower(),
                                "source_ref": {}
                            })
                    break

        # 3. Add Bullet (STRICTLY PROHIBITED from modifying Work Experience)
        elif change_type == "add_bullet":
            # Guardrail: Never inject into Work Experience under any circumstances
            if "exp" in target_sec or "work" in target_sec:
                continue
            
            # If target_entry is specified in a non-work section (e.g. Projects)
            if target_entry:
                for sec in sections:
                    sec_norm = (sec.get("normalized_name") or sec.get("name") or "").lower()
                    if "exp" in sec_norm or "work" in sec_norm:
                        continue  # Work experience is immutable
                    
                    for entry in sec.get("entries", []):
                        ent_title = (entry.get("title") or entry.get("organization") or "").lower()
                        if target_entry in ent_title:
                            entry.setdefault("bullets", []).append({"text": new_text, "source_ref": {}})
                            break

    return modified_profile

def render_html(profile_data: dict) -> str:
    """
    Renders the JSON profile using a Jinja2 template.
    """
    templates_dir = Path(__file__).parent / "templates"
    env = Environment(loader=FileSystemLoader(str(templates_dir)))
    template = env.get_template("default_resume.html")
    
    return template.render(profile=profile_data)
