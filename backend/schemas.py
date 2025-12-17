from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class QAReport(BaseModel):
    issues_found: int
    fixes_applied: int
    quality_score: float


# ============== PROJECT SCHEMAS ==============

class ProjectConfig(BaseModel):
    confidence_threshold: float = 0.7
    auto_apply_high_confidence: bool = True
    email_verification_api: bool = False
    default_country_code: str = "IN"


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    user_id: int  # User ID from request body
    config: Optional[ProjectConfig] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[ProjectConfig] = None
    custom_rules: Optional[List[Dict[str, Any]]] = None
    field_mappings: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    config: Dict[str, Any]
    custom_rules: List[Dict[str, Any]]
    field_mappings: Dict[str, str]
    created_at: datetime
    updated_at: datetime
    is_active: bool
    run_count: Optional[int] = 0
    latest_quality_score: Optional[float] = None
    
    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int


# ============== RUN SCHEMAS ==============

class IssueBreakdown(BaseModel):
    invalid_emails: int = 0
    invalid_phones: int = 0
    missing_fields: int = 0
    duplicates: int = 0
    company_fixes: int = 0
    domain_fixes: int = 0
    job_title_fixes: int = 0


class VerificationStats(BaseModel):
    phone_verified: int = 0
    phone_invalid: int = 0
    email_verified: int = 0
    email_invalid: int = 0


class RunCreate(BaseModel):
    project_id: int
    mode: str = "auto"  # "auto" or "review"


class RunResponse(BaseModel):
    id: int
    run_number: int
    project_id: int
    file_name: str
    file_size: Optional[int]
    row_count: Optional[int]
    column_count: Optional[int]
    columns: Optional[List[str]]
    quality_score_before: float
    quality_score_after: float
    total_issues: int
    total_fixes: int
    issue_breakdown: Dict[str, int]
    total_changes: int
    auto_accepted_count: int
    needs_review_count: int
    manual_overrides: int
    mode: str
    status: str
    verification_stats: Dict[str, int]
    created_at: datetime
    completed_at: Optional[datetime]
    run_by: Optional[str]
    notes: Optional[str]
    report_data: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class RunListResponse(BaseModel):
    runs: List[RunResponse]
    total: int
    project_name: Optional[str] = None


class RunUpdateNotes(BaseModel):
    notes: str


# ============== RUN COMPARISON SCHEMAS ==============

class RunComparisonRequest(BaseModel):
    run_id_1: int
    run_id_2: int


class RunComparisonMetric(BaseModel):
    metric_name: str
    run_1_value: Any
    run_2_value: Any
    difference: Any
    improvement: bool


class RunComparisonResponse(BaseModel):
    run_1: RunResponse
    run_2: RunResponse
    metrics: List[RunComparisonMetric]
    summary: str


# ============== TIMELINE SCHEMAS ==============

class TimelineDataPoint(BaseModel):
    run_number: int
    run_id: int
    created_at: datetime
    quality_score: float
    issues_found: int
    fixes_applied: int


class ProjectTimelineResponse(BaseModel):
    project_id: int
    project_name: str
    data_points: List[TimelineDataPoint]
    average_quality_score: float
    quality_trend: str  # "improving", "declining", "stable"


# ============== VERIFICATION SCHEMAS ==============

class EmailVerificationRequest(BaseModel):
    email: str

class EmailVerificationConfirm(BaseModel):
    token: str

class OTPRequest(BaseModel):
    phone_number: str

class OTPConfirm(BaseModel):
    phone_number: str
    otp_code: str

# ============== FILE & REVIEW SCHEMAS ==============

class UploadedFileResponse(BaseModel):
    id: int
    filename: str
    upload_timestamp: datetime
    status: str
    row_count: Optional[int] = 0
    file_size: Optional[int] = 0
    project_id: Optional[int]

    class Config:
        from_attributes = True

class ReviewSuggestionResponse(BaseModel):
    id: int
    row_index: int
    column_name: str
    original_value: Optional[str]
    suggested_value: Optional[str]
    confidence_score: float
    issue_type: str
    status: str

    class Config:
        from_attributes = True

class ReviewDecision(BaseModel):
    suggestion_id: int
    action: str  # "accept", "reject"

class BulkReviewRequest(BaseModel):
    decisions: List[ReviewDecision]

class CleanedRecordResponse(BaseModel):
    row_index: int
    data: Dict[str, Any]

class RawRecordResponse(BaseModel):
    row_index: int
    data: Dict[str, Any]

class PaginatedRecords(BaseModel):
    total: int
    data: List[Dict[str, Any]]
    page: int
    page_size: int


