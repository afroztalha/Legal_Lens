from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from analyzer import analyze_contract
from database import init_db, get_db, User, Analysis
from auth import hash_password, verify_password, create_token, decode_token
from pypdf import PdfReader
import io, json

app = FastAPI()
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ---------- Auth Models ----------
class RegisterBody(BaseModel):
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

class ContractText(BaseModel):
    text: str

# ---------- Auth Helpers ----------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ---------- Auth Endpoints ----------
@app.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Account created successfully"}

@app.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token({"sub": user.email})
    return {"access_token": token, "email": user.email}

# ---------- Analysis Endpoints ----------
@app.post("/analyze/text")
def analyze_text(
    body: ContractText,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Empty contract text")
    result = analyze_contract(body.text)
    
    # Handle irrelevant document error
    if result.get("error"):
        return {
            "error": True,
            "status_code": 422,
            "message": result["message"],
            "details": result.get("details", ""),
            "suggestion": result.get("suggestion", ""),
        }
    
    # Save successful analysis
    analysis = Analysis(
        user_id=user.id,
        contract_text=body.text,
        result=json.dumps(result)
    )
    db.add(analysis)
    db.commit()
    return result

@app.post("/analyze/pdf")
def analyze_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    contents = file.file.read()
    reader = PdfReader(io.BytesIO(contents))
    text = "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    result = analyze_contract(text)
    
    # Handle irrelevant document error
    if result.get("error"):
        return {
            "error": True,
            "status_code": 422,
            "message": result["message"],
            "details": result.get("details", ""),
            "suggestion": result.get("suggestion", ""),
        }
    
    # Save successful analysis
    analysis = Analysis(
        user_id=user.id,
        contract_text=text,
        result=json.dumps(result)
    )
    db.add(analysis)
    db.commit()
    return result

# ---------- History Endpoint ----------
@app.get("/history")
def get_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    analyses = db.query(Analysis).filter(
        Analysis.user_id == user.id
    ).order_by(Analysis.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "contract_preview": a.contract_text[:100] + "...",
            "result": json.loads(a.result),
            "created_at": a.created_at.strftime("%d %b %Y, %I:%M %p")
        }
        for a in analyses
    ]
class ChatMessage(BaseModel):
    message: str
    contract_analysis: dict

@app.post("/chat")
def chat(
    body: ChatMessage,
    user: User = Depends(get_current_user)
):
    from langchain_groq import ChatGroq
    import os
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0
    )
    context = f"""
            You are a Pakistani labour law expert. A user analyzed their employment contract.
            Analysis: {body.contract_analysis}

            Rules for your response:
            - Be concise, maximum 5 bullet points
            - Each bullet point max 1 sentence
            - Always cite the specific Pakistani law
            - Never write long paragraphs
            - Format: bullet points only
            """
    from langchain_core.messages import SystemMessage, HumanMessage
    response = llm.invoke([
        SystemMessage(content=context),
        HumanMessage(content=body.message)
    ])
    return {"reply": response.content}

@app.get("/")
def root():
    return {"status": "LegalLens API running"}