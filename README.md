# Legal Lens

## Project Title & Overview

**Legal Lens** is an AI-powered web application designed for automated analysis of employment contracts. The system uses natural language processing (NLP) and machine learning to extract clauses from uploaded contracts, assess risks against Pakistani labor laws, and provide interactive visualizations and AI-driven recommendations. Its primary purpose is to democratize legal contract review, enabling non-experts to identify potential issues, understand compliance, and receive actionable insights without requiring specialized legal knowledge. In real-world use cases, Legal Lens serves employees, HR professionals, and small businesses by streamlining contract evaluation, reducing review time from hours to minutes, and minimizing legal risks through intelligent risk detection and alternative clause suggestions.

## Problem Statement

Legal contract analysis, particularly for employment agreements, is a complex and time-consuming process that traditionally requires deep expertise in labor laws. Users without legal backgrounds often struggle to identify hidden risks, ambiguous clauses, or non-compliant terms that could lead to disputes, financial losses, or legal liabilities. Manual review involves reading through dense legal text, cross-referencing with relevant laws, and interpreting jargon, which is inefficient and prone to human error. Small businesses and individuals lack access to affordable legal counsel, resulting in overlooked issues like unfair termination clauses, inadequate benefits, or discriminatory provisions. This gap creates significant barriers, as improper contract understanding can lead to costly litigation or unfavorable employment terms. Legal Lens addresses these challenges by automating the analysis process, making it accessible, fast, and reliable for everyday users.

## Solution Overview

Legal Lens solves the contract analysis problem through a comprehensive AI-driven approach. The system employs NLP techniques to automatically extract and parse clauses from employment contracts. Each clause is then analyzed for risks by comparing it against a knowledge base of Pakistani labor laws using retrieval-augmented generation (RAG). Risks are classified into categories (FAIR, RISKY, ILLEGAL), with explanations and law references provided. For problematic clauses, the system generates safer alternatives. Results are presented through an interactive visualization system that displays contracts as node-based graphs, allowing users to explore risks intuitively. Additionally, an integrated AI chatbot offers real-time assistance, answering questions about the analysis or legal concepts. This combination of automation, visualization, and AI support transforms complex legal review into an accessible, user-friendly process.

## System Architecture

Legal Lens follows a modular client-server architecture, separating concerns for scalability and maintainability.

### Frontend (UI/Dashboard/Visualization/Chatbot)
The frontend is a React-based single-page application built with Next.js, providing a responsive web interface. It includes:
- **Dashboard**: User authentication, file upload, and navigation.
- **Visualization Module**: Interactive graph display using React Flow for contract risk mapping.
- **Chatbot Interface**: Embedded chat for AI-assisted queries.
- **Theme System**: Dark/light mode support with centralized styling.

### Backend (API/Server Logic)
The backend is implemented in Python using FastAPI, offering RESTful APIs for all operations. Key components include:
- **Authentication Module**: JWT-based user management with SQLAlchemy ORM and SQLite database.
- **Analysis Engine**: Core logic for processing contracts and generating results.
- **History Management**: Storage and retrieval of past analyses.

### NLP Pipeline
The NLP pipeline is the core of the analysis:
1. **Text Extraction**: Uses PyPDF to extract text from uploaded PDF contracts.
2. **Clause Extraction**: Leverages a large language model (LLM) to segment the contract into individual clauses.
3. **Relevance Validation**: Applies keyword filtering to ensure content pertains to employment law.
4. **Risk Classification**: For each clause, retrieves relevant legal context from a vector database and analyzes risks using the LLM.
5. **Scoring and Recommendations**: Calculates an overall risk score and generates alternative clauses for risky items.

### PDF Processing Flow
1. User uploads PDF via frontend.
2. Backend receives file and extracts text using PyPDF.
3. Text is passed to NLP pipeline for clause extraction.
4. Clauses are validated for relevance.
5. Valid clauses undergo risk analysis against legal database.
6. Results (risk levels, explanations, alternatives) are stored and returned to frontend.

### AI/LLM Integration
The system integrates Groq's Llama 3.1 model for NLP tasks, including clause parsing, risk assessment, and chatbot responses. A ChromaDB vector store holds embeddings of Pakistani labor law documents, enabling semantic search for context retrieval.

### Data Flow
- **Input**: PDF or text contract.
- **Processing**: Text extraction → Clause parsing → Relevance check → Risk analysis → Storage.
- **Output**: JSON response with risk score, clauses, and details.
- **Display**: Frontend renders results in visualization and provides chatbot access.

## Workflow

The user workflow in Legal Lens is designed to be intuitive and step-by-step:

1. **User Registration/Login**: New users create an account or log in using email and password. Authentication is handled via JWT tokens for secure sessions.
2. **Contract Upload**: Users navigate to the upload page and select a PDF employment contract or paste text directly.
3. **Preprocessing**: The system extracts text from the PDF and validates if the document is employment-related (relevance check).
4. **NLP Clause Extraction**: The LLM parses the contract into individual clauses, ensuring structured analysis.
5. **Risk Analysis**: Each clause is evaluated against Pakistani labor laws retrieved from the vector store. Risks are classified as FAIR (green), RISKY (yellow), or ILLEGAL (red), with explanations and law citations.
6. **AI Recommendations**: For RISKY or ILLEGAL clauses, the system generates alternative, safer wording suggestions.
7. **Visualization Display**: Results are shown on the visualizer page as an interactive node graph, with the contract as the central node and clauses as connected nodes colored by risk.
8. **Exploration**: Users can click nodes to expand details, zoom/pan the graph, and view explanations.
9. **Chatbot Assistance**: Users can ask the AI chatbot questions about the analysis, legal terms, or specific clauses for further clarification.
10. **History Access**: Past analyses are saved and accessible via the history page for comparison or review.

This workflow ensures a seamless experience from upload to insights.

## Features

- **PDF Contract Analysis**: Supports PDF uploads and text input for employment contract review.
- **Clause Detection**: Automatically identifies and extracts individual clauses from contracts.
- **Risk Classification**: Color-coded risk levels (Green/Yellow/Red) for quick identification of issues.
- **Legal Mapping**: Maps clauses to specific Pakistani employment laws with citations.
- **AI-Generated Alternatives**: Provides safer clause suggestions for risky or illegal terms.
- **Interactive Visualization**: Coggle-style node graph for exploring contract risks.
- **AI Chatbot Assistant**: Real-time chat for legal questions and analysis explanations.
- **Authentication System**: Secure user accounts with JWT-based login and registration.
- **Dark/Light Mode Support**: Theme switching for user preference.
- **Onboarding Walkthrough**: Guided tours to help new users navigate features.

## Visualization System

The visualization system uses a Coggle-inspired node-based graph to represent contract analysis results:
- **Root Node**: Central "Employment Contract" node representing the entire document.
- **Clause Nodes**: Child nodes connected to the root, each representing a clause, colored by risk (green for FAIR, yellow for RISKY, red for ILLEGAL).
- **Expandable Details**: Clicking a clause node reveals sub-nodes with explanations, law references, and alternative suggestions.
- **Interactivity**: Users can zoom, pan, and expand/collapse nodes. Undo/redo functionality maintains exploration history.
- **Color-Coded Risk System**: Immediate visual feedback on contract health.

This graph-based approach makes complex legal data intuitive and engaging.

## Tech Stack & Libraries

### Frontend
- **Next.js**: Full-stack React framework for server-side rendering, routing, and API integration.
- **React**: Component-based UI library for building dynamic interfaces.
- **React Flow**: Library for creating interactive node-based graphs and visualizations.
- **Tailwind CSS**: Utility-first CSS framework for responsive, theme-aware styling.
- **Dagre**: Graph layout algorithm for automatic node positioning in visualizations.

### Backend
- **FastAPI**: High-performance Python web framework for building REST APIs with automatic documentation.
- **SQLAlchemy**: ORM for database interactions, used with SQLite for user and analysis data.
- **Pydantic**: Data validation and serialization for API models.
- **Uvicorn**: ASGI server for running FastAPI applications.

### NLP / AI
- **Python**: Core language for NLP and AI processing.
- **LangChain**: Framework for building LLM-powered applications, used for RAG and prompt management.
- **Groq API (Llama 3.1)**: LLM for clause extraction, risk analysis, and chatbot responses.
- **HuggingFace Embeddings**: Pre-trained embeddings (all-MiniLM-L6-v2) for semantic search.
- **ChromaDB**: Vector database for storing and retrieving legal document embeddings.

### Others
- **PyPDF**: Library for extracting text from PDF files.
- **python-dotenv**: For loading environment variables.
- **JWT**: For secure token-based authentication.

Each technology was chosen for its reliability, performance, and fit for the specific task (e.g., React Flow for graphs, FastAPI for APIs).

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Git

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install fastapi uvicorn sqlalchemy pydantic python-multipart pypdf langchain langchain-groq chromadb sentence-transformers python-dotenv`
5. Create a `.env` file with:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   SECRET_KEY=your_secret_key_here
   ```
6. Build the vector store (if not present): `python rag.py`

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`

## How to Run Project

1. **Start Backend**:
   - Ensure virtual environment is activated.
   - Run: `uvicorn main:app --reload`
   - Backend will be available at `http://localhost:8000`

2. **Start Frontend**:
   - In a new terminal, navigate to `frontend`: `cd frontend`
   - Run: `npm run dev`
   - Frontend will be available at `http://localhost:3000`

3. **Access Application**:
   - Open `http://localhost:3000` in your browser.
   - Register/login, upload a PDF, and explore features.

### Troubleshooting
- If backend fails, check `.env` variables and API key validity.
- Ensure ports 8000 and 3000 are free.
- For PDF issues, verify PyPDF installation.

## UI/UX Design Overview

Legal Lens adopts a modern AI SaaS design philosophy, prioritizing clarity and usability. The interface features a clean dashboard with sidebar navigation, supporting dark/light modes for accessibility. Visualization takes center stage with the graph-based UI, making data exploration engaging. Interactive onboarding walkthroughs guide users through features. The chatbot is seamlessly integrated for contextual help. Professional layouts with consistent typography and responsive design ensure a polished experience across devices.

## Future Improvements

- **Enhanced Legal Datasets**: Expand to multi-country laws and update with latest regulations.
- **Improved LLM Integration**: Fine-tune models for better accuracy and add support for multiple LLMs.
- **Real-Time Collaboration**: Enable shared analysis sessions for teams.
- **Document Comparison**: Feature to compare multiple contracts side-by-side.
- **Advanced Analytics**: Add reporting and trend analysis for user insights.
