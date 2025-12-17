from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict
import uuid
import datetime
import random

import models
import schemas
from dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["verification"],
    responses={404: {"description": "Not found"}},
)

@router.post("/email/request")
def request_email_verification(
    request: schemas.EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Don't reveal user existence
        return {"message": "If the email exists, a verification link has been sent."}
    
    # Generate token
    token = str(uuid.uuid4())
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    
    db_token = models.EmailVerificationToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    
    # Simulate sending email
    print(f"==========================================")
    print(f"VERIFICATION LINK: http://localhost:5173/verify-email?token={token}")
    print(f"==========================================")
    
    return {"message": "Verification email sent"}

@router.post("/email/verify")
def verify_email(
    confirm: schemas.EmailVerificationConfirm,
    db: Session = Depends(get_db)
):
    token_record = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token == confirm.token
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    if token_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")
        
    user = db.query(models.User).filter(models.User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_verified = True
    db.delete(token_record) # One-time use
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/phone/otp")
def request_otp(
    request: schemas.OTPRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate 6 digit OTP
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    # Invalidate old OTPs
    db.query(models.OTPLog).filter(
        models.OTPLog.user_id == current_user.id,
        models.OTPLog.is_used == False
    ).update({"is_used": True})
    
    log = models.OTPLog(
        user_id=current_user.id,
        phone_number=request.phone_number,
        otp_code=otp,
        expires_at=expires_at
    )
    db.add(log)
    db.commit()
    
    # Simulate SMS
    print(f"==========================================")
    print(f"OTP for {request.phone_number}: {otp}")
    print(f"==========================================")
    
    return {"message": "OTP sent successfully"}

@router.post("/phone/verify")
def verify_otp(
    confirm: schemas.OTPConfirm,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log = db.query(models.OTPLog).filter(
        models.OTPLog.user_id == current_user.id,
        models.OTPLog.phone_number == confirm.phone_number,
        models.OTPLog.otp_code == confirm.otp_code,
        models.OTPLog.is_used == False
    ).first()
    
    if not log:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if log.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    # Mark as used
    log.is_used = True
    
    # Update user
    current_user.phone_number = confirm.phone_number
    # optionally set is_phone_verified if we added that field, but phone_number presence implies it for now
    
    db.commit()
    
    return {"message": "Phone number verified"}
