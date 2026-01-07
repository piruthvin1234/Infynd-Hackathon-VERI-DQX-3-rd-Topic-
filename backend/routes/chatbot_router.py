from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import json
import uuid
from datetime import datetime, timedelta
import re

router = APIRouter()

LOCAL_URL = "http://localhost:9000/chat/completions"
LOCAL_MODEL = "phi-3-mini"

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "mistral:latest"

# Enhanced session storage with expiration
conversation_sessions = {}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[dict] = None
    page_context: Optional[str] = None  # Current page user is on

class ChatResponse(BaseModel):
    response: str
    session_id: str
    suggestions: Optional[List[str]] = None
    follow_up_questions: Optional[List[str]] = None

class SessionInfo(BaseModel):
    session_id: str
    created_at: datetime
    last_active: datetime
    message_count: int

# Clean up old sessions (older than 24 hours)
def cleanup_old_sessions():
    current_time = datetime.now()
    expired_sessions = []
    
    for session_id, session_data in list(conversation_sessions.items()):
        if isinstance(session_data, dict) and 'timestamp' in session_data:
            session_time = datetime.fromisoformat(session_data['timestamp'])
            if current_time - session_time > timedelta(hours=24):
                expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del conversation_sessions[session_id]

# Comprehensive system prompt covering all features
SYSTEM_PROMPT = """You are DataGuardian AI Assistant, the intelligent chatbot for the VETRI-DQX Data Quality Platform. 
You are an expert in data quality management, data cleaning, validation, and analysis.

## PLATFORM OVERVIEW
You are integrated into ALL pages of the application:

1. **Dashboard/Home Page**: Overview of data quality metrics, recent projects, quick actions
2. **Data Analysis/Upload Page**: File upload, initial data analysis, validation checks
3. **Job Analysis Page**: Job title normalization, categorization, fuzzy matching insights
4. **Review & Clean Page**: Human-in-the-loop validation, suggestion review, change management
5. **Project Management**: Multiple projects organization, run history, timeline tracking
6. **Differential Analysis**: Dataset comparison, change tracking, quality metrics
7. **Visual Analytics**: Charts, graphs, metrics visualization (HeptagonChart)
8. **Settings/Configuration**: User preferences, API settings, theme management

## CORE FEATURES YOU SUPPORT:

### DATA VALIDATION
- Email validation (format, domain, deliverability)
- Phone validation (country codes, formatting)
- Duplicate detection (exact and fuzzy matching)
- Missing value identification
- Data type validation

### JOB TITLE NORMALIZATION
- Categorizing job titles into standardized functions (Management, Sales, Engineering, etc.)
- Handling variations, typos, abbreviations using RapidFuzz AI
- Providing insights on job distribution and categorization

### REVIEW WORKFLOW
- Three-stage process (Analyze → Review → Clean)
- Suggestion management (Accept/Reject/Override)
- Change logging and audit trails

### VISUAL ANALYTICS
- 7-metric HeptagonChart (duplicates, reviews, suggestions, mappings, confidence, progress, issues)
- Statistical analysis and reporting
- Trend analysis over time

### PROJECT MANAGEMENT
- Multi-project organization
- Run history and comparisons
- Performance tracking

## YOUR CAPABILITIES:
1. Answer questions about ANY page or feature
2. Provide step-by-step guidance for using features
3. Explain data quality concepts and best practices
4. Interpret analysis results and metrics
5. Offer troubleshooting assistance
6. Suggest data cleaning strategies
7. Explain AI/ML concepts used in the platform
8. Provide code examples or explanations when relevant
9. Help with data interpretation and decision making
10. Assist with report generation and insights

## RESPONSE GUIDELINES:
1. Be concise but thorough when needed
2. Use markdown formatting for better readability
3. Provide actionable advice
4. Reference specific features when relevant
5. Ask clarifying questions if needed
6. When data context is available, use it to provide specific insights
7. Suggest next steps or related features the user might find helpful
8. Maintain professional yet approachable tone

## EXAMPLE QUESTIONS YOU CAN HANDLE:
- "How do I upload a CSV file?"
- "Explain the job title normalization process"
- "What do these validation results mean?"
- "How can I clean duplicate records?"
- "Show me how to use the review workflow"
- "Explain the HeptagonChart metrics"
- "How does the AI detect similar job titles?"
- "What's the difference between exact and fuzzy matching?"
- "How do I compare two datasets?"
- "Help me interpret these statistics"
- "What are best practices for data validation?"
- "How do I create a new project?"
- "Explain the three-stage review process"

Remember: You are the user's guide to the entire DataGuardian AI platform. Help them navigate features, understand results, and make data-driven decisions."""

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Enhanced chat endpoint that provides comprehensive assistance for all platform features.
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Clean up old sessions periodically
        background_tasks.add_task(cleanup_old_sessions)
        
        # Initialize or get conversation history
        if session_id not in conversation_sessions:
            conversation_sessions[session_id] = {
                'history': [],
                'timestamp': datetime.now().isoformat(),
                'page_context': request.page_context
            }
        
        session_data = conversation_sessions[session_id]
        conversation_history = session_data['history']
        
        # Update page context if provided
        if request.page_context:
            session_data['page_context'] = request.page_context
        session_data['timestamp'] = datetime.now().isoformat()
        
        # Build enhanced system prompt with page-specific context
        enhanced_system_prompt = SYSTEM_PROMPT
        
        # Add page-specific context if available
        if session_data.get('page_context'):
            page_context = session_data['page_context']
            enhanced_system_prompt += f"\n\n## CURRENT PAGE CONTEXT\nUser is currently on: **{page_context}**\n- Tailor your response to be most relevant to this page if appropriate"
        
        # Add data context to system prompt if available
        if request.context:
            context_info = "\n\n## DATA ANALYSIS CONTEXT (From Current Session)\n"
            
            # General stats
            if "total_rows" in request.context:
                context_info += f"- **Total Rows Analyzed**: {request.context['total_rows']}\n"
            
            # Summary statistics
            if "summary_stats" in request.context:
                stats = request.context["summary_stats"]
                context_info += "\n### Validation Results:\n"
                
                if "email_validation" in stats:
                    email_stats = stats['email_validation']
                    context_info += f"- **Email Validation**: {email_stats.get('valid', 0)} valid, {email_stats.get('invalid', 0)} invalid, {email_stats.get('missing', 0)} missing\n"
                
                if "phone_validation" in stats:
                    phone_stats = stats['phone_validation']
                    context_info += f"- **Phone Validation**: {phone_stats.get('valid', 0)} valid, {phone_stats.get('invalid', 0)} invalid, {phone_stats.get('missing', 0)} missing\n"
                
                if "duplicates" in stats:
                    dup_stats = stats['duplicates']
                    context_info += f"- **Duplicates Found**: {dup_stats.get('count', 0)} duplicate sets affecting {dup_stats.get('affected_rows', 0)} rows\n"
                
                if "consistency_check" in stats:
                    consistency = stats['consistency_check']
                    context_info += f"- **Job Title Inconsistencies**: {consistency.get('inconsistent', 0)} inconsistent titles found\n"
            
            # Job analysis
            if "job_analysis" in request.context:
                job_data = request.context["job_analysis"]
                context_info += f"\n### Job Analysis:\n- **Categories Identified**: {len(job_data)}\n"
                
                if job_data:
                    top_functions = sorted(job_data, key=lambda x: x.get('count', 0), reverse=True)[:5]
                    context_info += "- **Top Categories**:\n"
                    for func in top_functions:
                        context_info += f"  • {func.get('job_function', 'Unknown')}: {func.get('count', 0)} titles\n"
            
            # Data quality scores
            if "quality_scores" in request.context:
                scores = request.context["quality_scores"]
                context_info += "\n### Data Quality Scores:\n"
                for metric, score in scores.items():
                    if isinstance(score, (int, float)):
                        context_info += f"- **{metric.replace('_', ' ').title()}**: {score:.1%}\n"
            
            # Specific Deviations/Invalid Data Samples
            if "deviations" in request.context:
                deviations = request.context["deviations"]
                context_info += f"\n### SAMPLE DEVIATIONS (First {len(deviations)} items):\n"
                for i, dev in enumerate(deviations, 1):
                    row = dev.get('row_index', i)
                    col = dev.get('column', 'Unknown')
                    orig = dev.get('original_value', 'NULL')
                    clean = dev.get('cleaned_value', 'NULL')
                    reason = dev.get('fix_type', 'Validation Error')
                    context_info += f"{i}. **Row {row} - Column {col}**: '{orig}' → '{clean}' (Logic: {reason})\n"

            enhanced_system_prompt += context_info
        
        # Build messages for API
        messages = [
            {"role": "system", "content": enhanced_system_prompt}
        ]
        
        # Add conversation history (keep last 15 messages for context)
        messages.extend(conversation_history[-15:])
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})
        
        # Try local AirLLM first, then Ollama, finally Groq
        try:
            local_headers = {
                "Content-Type": "application/json"
            }
            
            local_payload = {
                "model": LOCAL_MODEL,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1500,
                "stream": False
            }
            
            response = requests.post(LOCAL_URL, headers=local_headers, json=local_payload, timeout=300)
            response.raise_for_status()
            
            result = response.json()
            assistant_message = result['choices'][0]['message']['content']
            
        except (requests.exceptions.RequestException, requests.exceptions.Timeout):
            # Try Ollama
            try:
                ollama_payload = {
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False
                }
                
                response = requests.post(OLLAMA_URL, json=ollama_payload, timeout=30)
                response.raise_for_status()
                
                result = response.json()
                assistant_message = result['message']['content']
                
            except (requests.exceptions.RequestException, requests.exceptions.Timeout):
                # Fallback to Groq API
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1500,
                    "stream": False
                }
                
                response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
                response.raise_for_status()
                
                result = response.json()
                assistant_message = result['choices'][0]['message']['content']
        
        # Extract follow-up questions and suggestions
        follow_up_questions = extract_follow_up_questions(assistant_message)
        suggestions = extract_suggestions(assistant_message)
        
        # Clean the response for display
        clean_response = clean_response_text(assistant_message)
        
        # Update conversation history
        conversation_history.append({"role": "user", "content": request.message})
        conversation_history.append({"role": "assistant", "content": clean_response})
        
        # Keep only last 25 messages to prevent memory issues
        if len(conversation_history) > 25:
            conversation_history = conversation_history[-25:]
        
        session_data['history'] = conversation_history
        conversation_sessions[session_id] = session_data
        
        return ChatResponse(
            response=clean_response,
            session_id=session_id,
            suggestions=suggestions[:3] if suggestions else None,
            follow_up_questions=follow_up_questions[:3] if follow_up_questions else None
        )
        
    except requests.exceptions.RequestException as e:
        print(f"Groq API Error: {e}")
        # Enhanced fallback response
        fallback_response = """I'm currently experiencing connection issues with my AI service. 

Here are some immediate steps you can take:
1. **Check your internet connection**
2. **Refresh the page** and try again
3. **Use the platform's built-in features**:
   - Upload your CSV for automatic analysis
   - Check the Review page for pending suggestions
   - View your project history
   - Generate reports from the Analytics page

For immediate assistance, please:
- Check our [Documentation] for step-by-step guides
- Review the tooltips on each feature
- Try the platform's automated workflows

I'll be back online shortly!"""
        
        return ChatResponse(
            response=fallback_response,
            session_id=session_id or "fallback_session"
        )
    except Exception as e:
        print(f"Chat Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/chat/session/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear conversation history for a session."""
    if session_id in conversation_sessions:
        del conversation_sessions[session_id]
    return {"message": "Session cleared", "session_id": session_id}

@router.get("/chat/sessions", response_model=List[SessionInfo])
async def list_active_sessions():
    """List all active chat sessions."""
    sessions = []
    current_time = datetime.now()
    
    for session_id, session_data in conversation_sessions.items():
        if isinstance(session_data, dict) and 'timestamp' in session_data:
            try:
                session_time = datetime.fromisoformat(session_data['timestamp'])
                # Only include sessions active in last 24 hours
                if current_time - session_time <= timedelta(hours=24):
                    sessions.append(SessionInfo(
                        session_id=session_id,
                        created_at=session_time,
                        last_active=session_time,
                        message_count=len(session_data.get('history', []))
                    ))
            except:
                continue
    
    return sessions

@router.get("/chat/context/{session_id}")
async def get_session_context(session_id: str):
    """Get the current context of a session."""
    if session_id not in conversation_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = conversation_sessions[session_id]
    return {
        "session_id": session_id,
        "page_context": session_data.get('page_context'),
        "message_count": len(session_data.get('history', [])),
        "last_active": session_data.get('timestamp')
    }

def extract_follow_up_questions(response: str) -> List[str]:
    """Extract potential follow-up questions from the AI response."""
    questions = []
    
    # Look for question marks in the response
    sentences = re.split(r'[.!?]+', response)
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence and ('?' in sentence or sentence.lower().startswith(('what', 'how', 'why', 'where', 'when', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does'))):
            # Clean up the sentence
            clean_q = re.sub(r'[*\-•#]', '', sentence).strip()
            if len(clean_q) > 10 and len(clean_q) < 150:
                questions.append(clean_q)
    
    return questions[:5]  # Return max 5 questions

def extract_suggestions(response: str) -> List[str]:
    """Extract actionable suggestions from the AI response."""
    suggestions = []
    
    # Look for bullet points or numbered lists
    lines = response.split('\n')
    for line in lines:
        line = line.strip()
        # Check for bullet points
        if line.startswith(('- ', '* ', '• ', '✓ ', '▶ ', '→ ')):
            suggestion = line[2:].strip()
            if suggestion and len(suggestion) > 5:
                suggestions.append(suggestion)
        # Check for numbered items
        elif re.match(r'^\d+[\.\)] ', line):
            suggestion = line[line.find(' ') + 1:].strip()
            if suggestion and len(suggestion) > 5:
                suggestions.append(suggestion)
    
    return suggestions[:5]  # Return max 5 suggestions

def clean_response_text(response: str) -> str:
    """Clean and format the response text."""
    # Remove any system prompt remnants
    lines = response.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Skip lines that look like system prompt instructions
        if line.startswith(('## PLATFORM OVERVIEW', '## CORE FEATURES', '## YOUR CAPABILITIES', 
                           '## RESPONSE GUIDELINES', '## EXAMPLE QUESTIONS')):
            continue
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()

@router.post("/chat/analyze-query")
async def analyze_user_query(request: ChatRequest):
    """
    Analyze user query to determine intent and suggest features.
    This can be used for quick tips or feature discovery.
    """
    query = request.message.lower()
    
    # Intent detection
    intents = {
        "upload": any(word in query for word in ["upload", "import", "csv", "file", "data"]),
        "validation": any(word in query for word in ["validate", "email", "phone", "valid", "invalid"]),
        "duplicates": any(word in query for word in ["duplicate", "copy", "repeat", "same"]),
        "jobs": any(word in query for word in ["job", "title", "position", "role", "categor"]),
        "clean": any(word in query for word in ["clean", "fix", "repair", "correct"]),
        "review": any(word in query for word in ["review", "check", "verify", "approve"]),
        "analyze": any(word in query for word in ["analyze", "stat", "metric", "report", "graph"]),
        "project": any(word in query for word in ["project", "manage", "organize", "history"]),
        "compare": any(word in query for word in ["compare", "difference", "versus", "vs"]),
        "help": any(word in query for word in ["help", "how to", "guide", "tutorial"]),
    }
    
    detected_intents = [intent for intent, detected in intents.items() if detected]
    
    return {
        "intents": detected_intents,
        "suggested_features": get_feature_suggestions(detected_intents),
        "quick_tips": get_quick_tips(detected_intents)
    }

def get_feature_suggestions(intents: List[str]) -> List[str]:
    """Get relevant feature suggestions based on detected intents."""
    feature_map = {
        "upload": ["Data Upload Page", "CSV Import", "File Analysis"],
        "validation": ["Email Validation", "Phone Validation", "Data Quality Checks"],
        "duplicates": ["Duplicate Detection", "Fuzzy Matching", "Merge Records"],
        "jobs": ["Job Analysis Page", "Title Normalization", "Category Mapping"],
        "clean": ["Review & Clean Page", "Bulk Actions", "Automated Cleaning"],
        "review": ["Three-Stage Workflow", "Suggestion Management", "Audit Log"],
        "analyze": ["Visual Analytics", "HeptagonChart", "Statistical Reports"],
        "project": ["Project Management", "Run History", "Timeline View"],
        "compare": ["Differential Analysis", "Dataset Comparison", "Change Tracking"],
        "help": ["Documentation", "Tooltips", "Step-by-Step Guides"]
    }
    
    suggestions = []
    for intent in intents:
        if intent in feature_map:
            suggestions.extend(feature_map[intent])
    
    return list(set(suggestions))[:5]  # Remove duplicates, return max 5

def get_quick_tips(intents: List[str]) -> List[str]:
    """Get quick tips based on detected intents."""
    tips = []
    
    if "upload" in intents:
        tips.append("CSV files up to 100MB are supported. Include headers for better analysis.")
    
    if "validation" in intents:
        tips.append("Email validation checks format, domain, and common typos.")
    
    if "duplicates" in intents:
        tips.append("Use fuzzy matching for names with slight variations.")
    
    if "jobs" in intents:
        tips.append("Job titles are categorized into 17 standard functions automatically.")
    
    if "clean" in intents or "review" in intents:
        tips.append("Review suggestions before applying changes to maintain data integrity.")
    
    return tips[:3]
