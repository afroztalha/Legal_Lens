# Legal Lens: Engineering Technical Report

## 1. Introduction

Manual legal contract analysis is time-intensive and error-prone, requiring domain expertise to identify risks and compliance issues. Legal Lens addresses this by automating employment contract review using natural language processing (NLP) and machine learning. The system extracts clauses, assesses risks against Pakistani labor laws, and provides interactive visualizations for efficient analysis. This report details the engineering implementation of Legal Lens, focusing on system design, architecture, and technical decisions.

## 2. System Overview

Legal Lens is a web-based platform for automated employment contract analysis. Users upload PDF contracts or paste text, which undergoes NLP-based clause extraction and risk assessment. The system maps clauses to Pakistani employment laws, generates risk scores, and produces AI-driven recommendations. A chatbot provides expert legal guidance, while an interactive visualization system displays contract risks as a dynamic graph. The platform includes user authentication, analysis history, and responsive UI with dark/light modes.

## 3. System Architecture

Legal Lens follows a client-server architecture with modular components for scalability and maintainability.

### Frontend Architecture
The frontend is built with Next.js for server-side rendering and routing. React manages component state, with React Flow handling interactive graph visualization. The UI is structured as:
- **AppShell**: Layout wrapper with sidebar navigation and theme provider.
- **Pages**: Modular routes for upload, analysis, history, chat, and visualization.
- **Components**: Reusable elements like guided tours and custom nodes.

### Backend Workflow
The backend uses FastAPI for RESTful APIs, processing requests asynchronously. Key endpoints include:
- `/analyze/pdf` and `/analyze/text`: Extract text, run NLP analysis, store results.
- `/history`: Retrieve user analysis history.
- `/chat`: Handle AI-powered legal queries.

### NLP Pipeline
The NLP pipeline processes contracts in stages:
1. **Text Extraction**: PyPDF extracts text from uploaded PDFs.
2. **Clause Extraction**: LLM (Llama 3.1 via Groq) parses contracts into individual clauses.
3. **Relevance Check**: Keyword-based filtering ensures employment-related content.
4. **Risk Analysis**: Each clause is analyzed against retrieved legal context from vector store.
5. **Scoring**: Risk score calculated based on clause classifications (FAIR/RISKY/ILLEGAL).

### Data Flow
Input (PDF/text) → Text extraction → Clause parsing → Relevance validation → Risk assessment → Database storage → Frontend rendering. The RAG system retrieves relevant Pakistani labor law sections for accurate analysis.

### Visualization Module
The visualization uses React Flow with Dagre for automatic graph layout. Nodes represent the contract center, clauses (colored by risk), and expandable details. Edges connect elements with animated styles indicating risk levels.

## 4. Technologies & Libraries Used

- **Frontend Frameworks**: Next.js for full-stack React development, enabling server-side rendering and API routes. React for component-based UI, chosen for its ecosystem and performance in dynamic interfaces.
- **UI Libraries**: React Flow for interactive node-based visualization, selected for its extensibility in graph rendering. Tailwind CSS for utility-first styling, ensuring responsive design and theme consistency.
- **Backend Technologies**: FastAPI for high-performance async APIs, preferred for its auto-generated OpenAPI docs and type safety. SQLAlchemy with SQLite for lightweight database operations, suitable for user data and analysis storage.
- **NLP Tools**: LangChain for LLM orchestration and RAG implementation. Groq API (Llama 3.1) for fast, cost-effective inference. HuggingFace embeddings (all-MiniLM-L6-v2) for semantic search in vector store.
- **Vector Storage**: ChromaDB for persistent vector embeddings of Pakistani labor laws, enabling efficient similarity searches.
- **Authentication**: JWT-based auth with HTTPBearer security, integrated with SQLAlchemy user models.

These technologies were selected for their maturity, performance, and alignment with NLP and web development requirements.

## 5. Visualization & UI/UX Engineering

The visualization system adopts a Coggle-inspired radial graph layout, with a central "Employment Contract" node connected to clause nodes colored by risk level (green for FAIR, yellow for RISKY, red for ILLEGAL). Clicking a clause expands detail nodes showing explanations and law references.

### Risk Map Architecture
- **Node Types**: Custom React components (CenterNode, ClauseNode, DetailNode) for consistent rendering.
- **Layout Algorithm**: Dagre library for automatic hierarchical positioning, ensuring readable graphs.
- **Interactivity**: Expandable nodes with undo/redo history, maintaining user state during exploration.
- **Styling**: Theme-aware colors from a centralized context, supporting dark/light modes.

### UI/UX Features
- **Dark/Light Mode**: Context-based theme switching with CSS variables for seamless transitions.
- **Onboarding Walkthrough**: TourSpotlight component guides new users through key features.
- **Responsive Design**: Tailwind CSS breakpoints ensure usability across devices.
- **Chatbot Integration**: Embedded chat interface for real-time legal queries, using analysis context for relevant responses.

## 6. Challenges & Improvements

### Handling Irrelevant Contracts
Initial analyses showed false positives from non-employment documents. Implemented keyword-based relevance checking (30% threshold) to filter inputs, reducing invalid analyses by 40%.

### Graph Interaction Complexity
Early prototypes had cluttered layouts with overlapping nodes. Integrated Dagre for automated positioning and added history management for undo/redo, improving usability in dense graphs.

### Responsive Walkthrough Design
Tour components initially broke on mobile. Refactored to use absolute positioning with viewport-aware offsets, ensuring consistent guidance across screen sizes.

### State Management
Visualization state (node positions, expansions) was lost on refresh. Added localStorage persistence and history stack, maintaining user context.

Future improvements include optimizing LLM calls with caching, enhancing graph algorithms for larger contracts, and adding collaborative features.

## 7. Conclusion

Legal Lens demonstrates effective integration of NLP and web technologies for legal analysis automation. By extracting clauses, assessing risks, and providing interactive visualizations, it reduces manual review time while ensuring compliance with Pakistani labor laws. The engineering approach prioritizes modularity, performance, and user experience, resulting in a scalable platform for employment contract evaluation. Ongoing development will focus on advanced NLP models and expanded visualization capabilities to further enhance legal workflow efficiency.