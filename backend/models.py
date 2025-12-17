from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    REVIEWING = "reviewing"
    CLEANED = "cleaned"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user")
    is_verified = Column(Boolean, default=False)
    phone_number = Column(String, nullable=True)
    
    # Relationships
    projects = relationship("Project", back_populates="owner")
    uploaded_files = relationship("UploadedFile", back_populates="user")
    email_tokens = relationship("EmailVerificationToken", back_populates="user")
    otp_logs = relationship("OTPLog", back_populates="user")

class Project(Base):
    """
    A project represents a workspace for data quality management.
    Each project can have multiple files, runs, and its own configuration.
    """
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Owner
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="projects")
    
    # Configuration (stored as JSON)
    config = Column(JSON, default={
        "confidence_threshold": 0.7,
        "auto_apply_high_confidence": True,
        "email_verification_api": False,
        "default_country_code": "IN"
    })
    
    # Custom rules and mappings (JSON)
    custom_rules = Column(JSON, default=[])
    field_mappings = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Relationships
    runs = relationship("Run", back_populates="project", order_by="desc(Run.created_at)")
    files = relationship("UploadedFile", back_populates="project")

class UploadedFile(Base):
    """
    Represents a CSV file uploaded by a user within a project.
    """
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    row_count = Column(Integer)
    
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default=ProcessingStatus.PENDING) # persisted as string
    
    # Relationships
    project = relationship("Project", back_populates="files")
    user = relationship("User", back_populates="uploaded_files")
    raw_records = relationship("RawRecord", back_populates="file", cascade="all, delete-orphan")
    suggestions = relationship("ReviewSuggestion", back_populates="file", cascade="all, delete-orphan")
    cleaned_records = relationship("CleanedRecord", back_populates="file", cascade="all, delete-orphan")

class RawRecord(Base):
    """
    Stores raw data from the uploaded CSV for visibility and comparison.
    """
    __tablename__ = "raw_records"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False) # Store the entire row as JSON

    file = relationship("UploadedFile", back_populates="raw_records")

class ReviewSuggestion(Base):
    """
    Stores AI-suggested fixes for Review Mode.
    """
    __tablename__ = "review_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    column_name = Column(String, nullable=False)
    
    original_value = Column(String, nullable=True)
    suggested_value = Column(String, nullable=True)
    confidence_score = Column(Float)
    
    issue_type = Column(String) # e.g., "invalid_email", "missing_value"
    status = Column(String, default="pending") # pending, accepted, rejected
    
    file = relationship("UploadedFile", back_populates="suggestions")

class CleanedRecord(Base):
    """
    Stores the final cleaned data after review/approval.
    """
    __tablename__ = "cleaned_records"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False) # Final cleaned row data

    file = relationship("UploadedFile", back_populates="cleaned_records")

class Run(Base):
    """
    A run represents a single data cleaning execution within a project.
    Stores complete history of what was cleaned, when, and how.
    """
    __tablename__ = "runs"
    
    id = Column(Integer, primary_key=True, index=True)
    run_number = Column(Integer, nullable=False)  # Sequential run number within project
    
    # Project relationship
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    project = relationship("Project", back_populates="runs")
    
    # File information
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    row_count = Column(Integer)
    column_count = Column(Integer)
    columns = Column(JSON)  # List of column names
    
    # Quality metrics
    quality_score_before = Column(Float, default=0.0)
    quality_score_after = Column(Float, default=0.0)
    
    # Issue counts
    total_issues = Column(Integer, default=0)
    total_fixes = Column(Integer, default=0)
    
    # Detailed issue breakdown (JSON)
    issue_breakdown = Column(JSON, default={
        "invalid_emails": 0,
        "invalid_phones": 0,
        "missing_fields": 0,
        "duplicates": 0,
        "company_fixes": 0,
        "domain_fixes": 0,
        "job_title_fixes": 0
    })
    
    # Changes tracking
    total_changes = Column(Integer, default=0)
    auto_accepted_count = Column(Integer, default=0)
    needs_review_count = Column(Integer, default=0)
    manual_overrides = Column(Integer, default=0)
    
    # Processing mode
    mode = Column(String(50), default="auto")  # "auto" or "review"
    
    # File paths
    original_file_path = Column(String(500))
    cleaned_file_path = Column(String(500))
    changelog_path = Column(String(500))
    
    # Status
    status = Column(String(50), default="completed")  # "processing", "completed", "failed", "pending_review"
    
    # Full report data (JSON) - for detailed analysis
    report_data = Column(JSON, default={})
    
    # Verification stats
    verification_stats = Column(JSON, default={
        "phone_verified": 0,
        "phone_invalid": 0,
        "email_verified": 0,
        "email_invalid": 0
    })
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Who ran it
    run_by = Column(String(255), nullable=True)
    
    # Notes/comments
    notes = Column(Text, nullable=True)

class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="email_tokens")

class OTPLog(Base):
    __tablename__ = "otp_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    phone_number = Column(String, nullable=False)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="otp_logs")

