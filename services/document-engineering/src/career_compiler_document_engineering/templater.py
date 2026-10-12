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
    """
    modified_profile = copy.deepcopy(profile_data)
    
    # Very basic mutation logic for MVP
    # In reality, this would search the JSON tree matching `requirement_id` or `original_text`
    # and update the respective node.
    
    # Find the experience section
    sections = modified_profile.get("sections", [])
    if isinstance(sections, list):
        for sec in sections:
            if sec.get("normalized_name") == "experience":
                experiences_entries = sec.get("entries", [])
                break
    
    for item in plan_items:
        new_text = item.get("user_edited_text") or item.get("proposed_text", "")
        change_type = item.get("change_type")
        original_text = item.get("original_text", "")
        
        if not new_text or not experiences_entries:
            continue

        if change_type in ("reword_bullet", "reorder_bullet", "edit_bullet"):
            # Try to find and replace matching bullet
            replaced = False
            for entry in experiences_entries:
                bullets = entry.get("bullets", [])
                for idx, b in enumerate(bullets):
                    b_text = b.get("text") if isinstance(b, dict) else str(b)
                    if original_text and (original_text in b_text or b_text in original_text):
                        if isinstance(b, dict):
                            b["text"] = new_text
                        else:
                            bullets[idx] = new_text
                        replaced = True
                        break
                if replaced:
                    break
        elif change_type == "add_bullet" and experiences_entries:
            if "bullets" not in experiences_entries[0]:
                experiences_entries[0]["bullets"] = []
            experiences_entries[0]["bullets"].append({"text": new_text, "source_ref": {}})
            
    return modified_profile

def render_html(profile_data: dict) -> str:
    """
    Renders the JSON profile using a Jinja2 template.
    """
    templates_dir = Path(__file__).parent / "templates"
    env = Environment(loader=FileSystemLoader(str(templates_dir)))
    template = env.get_template("default_resume.html")
    
    return template.render(profile=profile_data)
