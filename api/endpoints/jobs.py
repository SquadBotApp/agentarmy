from fastapi import APIRouter
router = APIRouter()

@router.get("/jobs")
def get_jobs():
    return []
