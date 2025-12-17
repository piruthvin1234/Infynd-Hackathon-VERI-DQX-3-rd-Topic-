from fastapi import APIRouter, UploadFile, File
from services.data_quality import process_csv

router = APIRouter()

from utils import sanitize_for_json

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    data = await file.read()
    result = process_csv(data)
    return sanitize_for_json({"results": result})
