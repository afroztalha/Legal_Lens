from langchain_groq import ChatGroq
from rag import load_vectorstore
from dotenv import load_dotenv
import os
import json

load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

vectorstore = load_vectorstore()

def extract_clauses(contract_text: str) -> list:
    prompt = f"""
You are a legal document parser. Extract individual clauses from the following employment contract.
Return ONLY a JSON array of strings, each string being one clause.
No explanation, no markdown, just raw JSON array.

Contract:
{contract_text}
"""
    response = llm.invoke(prompt)
    text = response.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


def analyze_clause(clause: str) -> dict:
    # Retrieve relevant law context
    docs = vectorstore.similarity_search(clause, k=3)
    law_context = "\n".join([d.page_content for d in docs])

    prompt = f"""
You are a Pakistani labour law expert. Analyze this employment contract clause.

Relevant Pakistani Law:
{law_context}

Clause:
{clause}

Respond ONLY with a JSON object in this exact format:
{{
  "clause": "<original clause>",
  "risk_level": "FAIR" or "RISKY" or "ILLEGAL",
  "explanation": "<simple plain English explanation>",
  "law_reference": "<relevant law cited or 'None'>"
}}
No markdown, no extra text, just raw JSON.
"""
    response = llm.invoke(prompt)
    text = response.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


def check_relevance(clauses: list) -> dict:
    """
    Validate that extracted clauses are actually related to employment law.
    Returns: {
        "is_relevant": bool,
        "relevant_count": int,
        "total_count": int,
        "details": str
    }
    """
    if not clauses:
        return {
            "is_relevant": False,
            "relevant_count": 0,
            "total_count": 0,
            "details": "No clauses could be extracted from the document."
        }
    
    relevant_count = 0
    employment_keywords = [
        "salary", "wage", "payment", "compensation", "bonus", "leave", "vacation",
        "sick leave", "termination", "dismissal", "notice period", "probation",
        "hours", "work hours", "overtime", "benefits", "insurance", "pension",
        "employee", "employer", "contract", "employment", "agreement",
        "workplace", "discrimination", "harassment", "safety", "confidentiality",
        "non-compete", "intellectual property", "severance", "redundancy",
        "disciplinary", "grievance", "performance", "appraisal", "training",
        "promotion", "job", "position", "role", "duty", "responsibility",
        "maternity", "paternity", "parental leave", "annual leave", "statutory",
        "labour law", "employment law", "workplace law", "pakistani employment"
    ]
    
    for clause in clauses:
        clause_lower = clause.lower()
        # Check if clause contains relevant keywords
        if any(keyword in clause_lower for keyword in employment_keywords):
            relevant_count += 1
    
    # Require at least 30% of clauses to be employment-related
    relevance_threshold = 0.3
    is_relevant = (relevant_count / len(clauses)) >= relevance_threshold
    
    return {
        "is_relevant": is_relevant,
        "relevant_count": relevant_count,
        "total_count": len(clauses),
        "details": f"Found {relevant_count} out of {len(clauses)} employment-related clauses."
    }


def calculate_risk_score(analyzed_clauses: list) -> int:
    total = len(analyzed_clauses)
    if total == 0:
        return 0
    risky = sum(1 for c in analyzed_clauses if c["risk_level"] == "RISKY")
    illegal = sum(1 for c in analyzed_clauses if c["risk_level"] == "ILLEGAL")
    score = 100 - int(((risky * 1 + illegal * 2) / (total * 2)) * 100)
    return max(0, score)


def analyze_contract(contract_text: str) -> dict:
    clauses = extract_clauses(contract_text)
    
    # Check relevance first
    relevance = check_relevance(clauses)
    if not relevance["is_relevant"]:
        return {
            "error": True,
            "message": "This document does not appear to be an employment contract or is not related to employment law.",
            "details": relevance["details"],
            "suggestion": "Please upload a valid employment contract in PDF or text format. Examples include: employment agreements, offer letters, termination letters, or workplace policies.",
            "risk_score": None,
            "clauses": []
        }
    
    # Proceed with analysis only if relevant
    analyzed = [analyze_clause(c) for c in clauses]
    score = calculate_risk_score(analyzed)
    return {
        "error": False,
        "risk_score": score,
        "clauses": analyzed
    }