import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm.attributes import flag_modified

from ..database import get_db
from ..models import CompiledResume, TailoringPlan, User, MasterResume, JobDescription, CanonicalProfile
from ..routers.auth import get_current_user
from ..celery_app import task_compile_latex
from ..services.ats_evaluator import evaluate_ats

router = APIRouter(prefix="/documents", tags=["documents"])

from pydantic import BaseModel

class CompileRequest(BaseModel):
    tailoring_plan_id: uuid.UUID

@router.get("", summary="List all compiled resume variants for current user")
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    stmt = (
        select(CompiledResume)
        .where(CompiledResume.user_id == str(user.id))
        .order_by(CompiledResume.created_at.desc())
    )
    result = await db.execute(stmt)
    docs = result.scalars().all()
    
    items = []
    for d in docs:
        plan = await db.get(TailoringPlan, d.tailoring_plan_id)
        master_title = "Master Resume"
        job_title = "Tailored Job"
        master_id = None
        job_id = None
        if plan:
            master_id = str(plan.master_resume_id)
            job_id = str(plan.job_id)
            master = await db.get(MasterResume, plan.master_resume_id)
            if master and master.display_name:
                master_title = master.display_name
            job = await db.get(JobDescription, plan.job_id)
            if job and job.display_name:
                job_title = job.display_name
                
        ats = (d.validation_results or {}).get("ats_evaluation")
        overall_score = ats.get("scores", {}).get("overall", {}).get("score") if ats else None
        
        items.append({
            "id": str(d.id),
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "master_resume_id": master_id,
            "master_resume_title": master_title,
            "job_id": job_id,
            "job_title": job_title,
            "ats_score": overall_score,
            "has_pdf": bool(d.pdf_file_path and d.status == "complete")
        })
    return items

@router.post("/compile", status_code=202)
async def compile_document(
    req: CompileRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    FR-014, FR-015: Triggers a sandboxed compilation task for a given tailoring plan.
    """
    plan = await db.get(TailoringPlan, req.tailoring_plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="TailoringPlan not found")
        
    doc = CompiledResume(
        tailoring_plan_id=req.tailoring_plan_id,
        user_id=str(user.id),
        latex_content="", # populated by task
        status="pending"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    # Trigger background task
    task_compile_latex.delay(str(doc.id))
    
    return {"id": str(doc.id), "status": doc.status}

@router.get("/{document_id}")
async def get_document_status(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Poll compilation status and validation results.
    """
    doc = await db.get(CompiledResume, document_id)
    if not doc or doc.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {
        "id": str(doc.id),
        "status": doc.status,
        "validation_results": doc.validation_results
    }

@router.get("/{document_id}/evaluation", summary="Get or calculate ATS evaluation for document")
async def get_document_evaluation(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    doc = await db.get(CompiledResume, document_id)
    if not doc or doc.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Document not found")
        
    ats = (doc.validation_results or {}).get("ats_evaluation")
    if ats:
        return ats
        
    # Calculate on-the-fly if not cached
    plan = await db.get(TailoringPlan, doc.tailoring_plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Tailoring plan not found")
        
    job = await db.get(JobDescription, plan.job_id)
    master = await db.get(MasterResume, plan.master_resume_id)
    
    prof_res = await db.execute(select(CanonicalProfile).where(CanonicalProfile.master_resume_id == master.id))
    profile = prof_res.scalar_one_or_none()
    
    evaluation = evaluate_ats(
        canonical_profile=profile.profile_json if profile else {},
        job_data=job.extracted_data or {"raw_text": job.raw_text} if job else {},
        tailoring_items=plan.items or []
    )
    
    if not doc.validation_results:
        doc.validation_results = {}
    doc.validation_results["ats_evaluation"] = evaluation
    flag_modified(doc, "validation_results")
    await db.commit()
    
    return evaluation

@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Download the compiled PDF file.
    """
    doc = await db.get(CompiledResume, document_id)
    if not doc or doc.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.status != "complete" or not doc.pdf_file_path:
        raise HTTPException(status_code=400, detail="Document is not complete")
        
    return FileResponse(
        path=doc.pdf_file_path,
        media_type="application/pdf",
        filename="tailored_resume.pdf"
    )

@router.delete("/{document_id}", status_code=204, summary="Delete a compiled document")
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    doc = await db.get(CompiledResume, document_id)
    if not doc or doc.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Document not found")
        
    await db.delete(doc)
    await db.commit()
    return None

