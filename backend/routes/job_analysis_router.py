from fastapi import APIRouter, HTTPException
from yoge_logics.semantic_llm import unify_job_title
from collections import defaultdict

router = APIRouter()

# Simple in-memory cache for job analysis results
job_analysis_cache = {}

@router.get("/job-analysis/{project_id}")
async def get_job_analysis(project_id: str):
    """
    Analyzes job titles from a project's CSV data using RapidFuzz.
    Returns categorized job fields with their associated job titles.
    """
    try:
        # Check cache first
        if project_id in job_analysis_cache:
            return job_analysis_cache[project_id]
        
        return {
            "status": "pending",
            "message": "Please upload data first to analyze job titles"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/job-analysis/analyze")
async def analyze_job_titles(data: dict):
    """
    Analyzes a list of job titles using RapidFuzz semantic matching.
    Expects: { "job_titles": ["Software Engineer", "Manager", ...], "project_id": "optional" }
    Returns: { "job_analysis": [...] }
    """
    try:
        job_titles = data.get("job_titles", [])
        project_id = data.get("project_id", "default")
        
        if not job_titles:
            raise HTTPException(status_code=400, detail="No job titles provided")
        
        # Use RapidFuzz-based semantic matching from semantic_llm.py
        # Group titles by their unified category
        categorized = defaultdict(list)
        
        for title in job_titles:
            if not title or not str(title).strip():
                continue
                
            # Get the unified category for this title
            unified = unify_job_title(str(title))
            categorized[unified].append(title)
        
        # Format response to match expected structure
        analysis_result = []
        for job_function, titles in categorized.items():
            analysis_result.append({
                "job_function": job_function,
                "job_titles": titles,
                "count": len(titles)
            })
        
        # Sort by count (descending) for better UX
        analysis_result.sort(key=lambda x: x["count"], reverse=True)
        
        formatted_result = {
            "job_analysis": analysis_result,
            "total_titles": len(job_titles),
            "total_fields": len(analysis_result)
        }
        
        # Cache the result
        job_analysis_cache[project_id] = formatted_result
        
        return formatted_result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

