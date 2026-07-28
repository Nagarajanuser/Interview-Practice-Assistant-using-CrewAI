# 🚀 Enterprise AI Interview Practice Assistant using CrewAI

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent%20Framework-red.svg?logo=openai&logoColor=white)](https://www.crewai.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Angular](https://img.shields.io/badge/Angular-17%2B-DD0031.svg?logo=angular&logoColor=white)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1.svg?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2-E92063.svg?logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![LLM Support](https://img.shields.io/badge/LLM-OpenAI%20%7C%20Ollama-purple.svg)](https://ollama.ai/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Project Overview & Executive Summary

The **AI Interview Practice Assistant** is a production-grade, enterprise-ready multi-agent platform designed to automate, standardize, and scale technical interview candidate evaluations and practice simulations. Powered by **CrewAI**, **FastAPI**, **MySQL**, and **Angular**, the platform simulates real-world engineering interview rounds with granular role customization, strict domain boundary enforcement, automated benchmark answer generation, and objective AI evaluation.

### 🌟 Key Highlights
* **Standardized Candidate Screening**: Eliminates bias by evaluating candidate answers against objective, AI-generated benchmark rubrics mapped to explicit experience levels (Beginner, Intermediate, Advanced).
* **Instant Actionable Feedback**: Provides candidates with immediate point-by-point feedback, score breakdown per topic, and targeted skill gap analysis.
* **Domain Matrix Governance**: Prevents out-of-scope questions by using dynamic role configurations (`roles.json`), ensuring mandatory skills (e.g., FastAPI, RAG, CrewAI) are tested while excluding irrelevant topics (e.g., CNN, Computer Vision).

* **Collaborative Multi-Agent Architecture**: Leverages CrewAI agents operating in sequential pipeline graph topologies with distinct roles (Planner, Question Generator, Answer Specialist, QA Reviewer, Evaluator).
* **Guaranteed Schema Integrity & Pydantic Guardrails**: Enforces structured JSON outputs at agent boundaries using Pydantic schemas, eliminating LLM hallucinations and malformed responses.
* **Hybrid LLM Provider Switcher**: Features an abstraction layer (`llm_factory.py`) supporting both cloud models (**OpenAI GPT-4o / GPT-4o-mini**) and local privacy-preserving LLMs (**Ollama Llama 3 / Mistral**).
* **Asynchronous Enterprise Stack**: Clean, decoupled, layered backend (API Router -> Service Layer -> Repository Layer -> SQLAlchemy/MySQL Database) integrated with a modern Angular single-page application (SPA).

---

## 🏗️ Production System Architecture (Block Diagram)

The following block diagram illustrates the system's multi-tier architecture, showing data flow from the Angular Frontend through the FastAPI API layer, CrewAI Agent Orchestration Engine, LLM Abstraction Layer, down to MySQL Persistence.

```mermaid
graph TD
    %% Styling Definitions
    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;
    classDef api fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20;
    classDef agent fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100;
    classDef llm fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;
    classDef db fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#b71c1c;

    subgraph Presentation_Layer["🌐 Presentation Layer (Client)"]
        UI["Angular 17+ SPA Client<br/>(Chat Widget, Admin, Feedback Dashboard)"]:::client
    end

    subgraph API_Tier["⚡ Application Tier (FastAPI Gateway)"]
        CORS["CORS Middleware & Auth Guards"]:::api
        Router["FastAPI REST Router<br/>(/api/v1/interview, /api/v1/evaluation)"]:::api
        Service["Service Layer<br/>(Interview & Evaluation Services)"]:::api
        Config["Domain Matrix Config<br/>(backend/config/roles.json)"]:::api
    end

    subgraph Agent_Orchestration["🤖 Agentic AI Engine (CrewAI Framework)"]
        subgraph Interview_Crew["Interview Generation Crew"]
            Planner["1. Planner Agent<br/>(Curriculum & Blueprint)"]:::agent
            QGen["2. Question Generator Agent<br/>(Technical Question Creator)"]:::agent
            AnsGen["3. Answer Specialist Agent<br/>(Ideal Benchmark & Rubric)"]:::agent
            QA["4. QA Reviewer Agent<br/>(Schema & Constraint Validator)"]:::agent
        end

        subgraph Evaluation_Crew["Candidate Assessment Crew"]
            EvalAgent["5. Evaluator Agent<br/>(Rubric Matching & Scoring)"]:::agent
        end
    end

    subgraph LLM_Tier["🧠 LLM Abstraction & Provider Layer"]
        LLMFactory["LLM Factory Switcher<br/>(llm_factory.py)"]:::llm
        OpenAI_Model["OpenAI GPT-4o / GPT-4o-mini"]:::llm
        Ollama_Model["Ollama Local Model<br/>(Llama 3 / Mistral)"]:::llm
    end

    subgraph Persistence_Tier["💾 Persistence & Storage Tier"]
        Repo["Repository Layer<br/>(Interview & Evaluation Repos)"]:::db
        MySQL[("MySQL 8.0 Database<br/>(Sessions, Questions, Responses, Scores)")]:::db
    end

    %% Component Connections
    UI <-->|HTTP REST / JSON Payload| CORS
    CORS --> Router
    Router --> Service
    Config -->|Skill Constraints| Service
    Service -->|Trigger Generation| Interview_Crew
    Service -->|Trigger Assessment| Evaluation_Crew

    Planner -->|Interview Blueprint| QGen
    QGen -->|Draft Questions| AnsGen
    AnsGen -->|Questions + Benchmarks| QA
    QA -->|Validated Pydantic JSON| Service

    EvalAgent -->|Scored Evaluation Item| Service

    Interview_Crew <-->|Prompt Invocations| LLMFactory
    Evaluation_Crew <-->|Prompt Invocations| LLMFactory
    LLMFactory <-->|Cloud API| OpenAI_Model
    LLMFactory <-->|Local Protocol| Ollama_Model

    Service --> Repo
    Repo <-->|SQL Queries / ORM| MySQL
```

---

## 🔄 Project Working Flow & Execution Sequence Diagram

The lifecycle of an interview session consists of **Two Phase Pipelines**: 
1. **Interview Generation Pipeline**: Assembles a role-customized, quality-audited set of questions and benchmark answers.
2. **Evaluation & Scoring Pipeline**: Audits candidate submissions against benchmark solutions, normalizes scoring, and persists metrics.

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate / User
    participant Frontend as Angular Frontend
    participant API as FastAPI Backend
    participant Config as roles.json Matrix
    participant ICrew as Interview Crew (CrewAI)
    participant ECrew as Evaluation Crew (CrewAI)
    participant DB as MySQL Database

    %% PHASE 1: GENERATION
    rect rgb(235, 245, 255)
    note right of Candidate: Phase 1: Interview Generation & Setup
    Candidate->>Frontend: Select Role (e.g. AI Engineer), Experience (e.g. 3 Yrs), Difficulty (Hard)
    Frontend->>API: POST /api/v1/interview/generate {role, experience, difficulty, question_count}
    API->>Config: Fetch mandatory/optional/excluded skills
    Config-->>API: Skill Governance Constraints
    API->>ICrew: Kickoff Interview Generation Crew (Planner -> Question -> Answer -> QA)
    ICrew->>ICrew: Planner creates blueprint matching experience
    ICrew->>ICrew: Question Agent generates targeted technical questions
    ICrew->>ICrew: Answer Agent synthesizes benchmark ideal answers
    ICrew->>ICrew: QA Agent filters duplicates, verifies constraints & returns InterviewPlanOutput
    ICrew-->>API: Return Pydantic Validated Question Set
    API->>DB: Save Session & Generated Questions into MySQL
    DB-->>API: Session ID Created
    API-->>Frontend: Return Session Data & Questions (Hiding Ideal Answers from Client)
    Frontend-->>Candidate: Display Interactive Candidate Interface
    end

    %% PHASE 2: ASSESSMENT
    rect rgb(255, 245, 235)
    note right of Candidate: Phase 2: Candidate Submission & Evaluation
    Candidate->>Frontend: Complete Interview & Submit Responses
    Frontend->>API: POST /api/v1/interview/submit {session_id, answers: [{q_id, response}]}
    API->>DB: Update Candidate Answers in MySQL
    API->>ECrew: Kickoff Evaluation Crew (session_id)
    ECrew->>DB: Fetch Questions, Candidate Answers & Ideal References
    DB-->>ECrew: Return Session Q&A Data
    ECrew->>ECrew: Sanitize & Filter non-answers / empty responses
    ECrew->>ECrew: Evaluator Agent evaluates candidate responses against Ideal Answer
    ECrew->>ECrew: Score each question (0.0 - 10.0) & write constructive feedback
    ECrew-->>API: Return Total Score & Per-Question Evaluation Items
    API->>DB: Persist Question Scores & Session Total Score into MySQL
    API-->>Frontend: Return Complete Evaluation Breakdown & Performance Dashboard
    Frontend-->>Candidate: Render Feedback, Weakness Analysis & Final Score
    end
```

---

## 🤖 Multi-Agent Architecture Matrix

The core intelligence of the platform is driven by 5 specialized CrewAI agents working in harmony:

| Agent Name | Specialization & Role | Key Responsibilities | Primary Input | Pydantic Output |
| :--- | :--- | :--- | :--- | :--- |
| **Planner Agent** | Curriculum & Blueprint Architect | Parses domain skills from `roles.json`, balances mandatory vs optional topics, enforces excluded skill guards. | Role, Experience Level, Skill Matrix | Interview Blueprint |
| **Question Agent** | Technical Question Generator | Drafts scenario-based, coding, and architectural questions matching the blueprint and target difficulty. | Blueprint, Difficulty Level | Draft Question List |
| **Answer Agent** | Subject Matter Benchmark Specialist | Formulates authoritative reference answers, code samples, and scoring criteria for each question. | Draft Questions | Questions + Ideal Answers |
| **QA Agent** | Quality Control & Constraint Auditor | Eliminates duplicate/overlapping questions, enforces strict numbering, and verifies JSON schema compliance. | Draft Questions + Ideal Answers | `InterviewPlanOutput` Schema |
| **Evaluator Agent** | Candidate Response Evaluator | Compares candidate submissions against ideal benchmark answers, assigns granular scores (0-10), and produces diagnostic feedback. | Questions, Candidate Answers, Benchmarks | `InterviewEvaluationOutput` Schema |

---

## 📂 Project Directory Structure

```text
interview-practice-assistant/
│
├── backend/                             # Enterprise Python FastAPI Backend
│   ├── main.py                          # FastAPI Application Entry point & Server Setup
│   ├── requirements.txt                 # Backend Python Dependencies
│   ├── .env                             # Environment Variables & LLM Keys
│   │
│   ├── core/                            # Application Core Configurations
│   │   ├── config.py                    # Base Application Settings & Environment Loader
│   │   ├── database.py                  # SQLAlchemy Engine & Session Configuration
│   │   ├── logger.py                    # Structured Logging Utility
│   │   ├── middleware.py                # CORS & Middleware Pipeline Configuration
│   │   ├── security.py                  # Security Utility & Handlers
│   │   └── startup.py                   # Server Startup Initialization Hooks
│   │
│   ├── api/                             # RESTful API Layer (v1)
│   │   └── v1/
│   │       ├── routes/                  # API Endpoint Handlers
│   │       │   ├── interview.py         # Generation & Candidate Submission Endpoints
│   │       │   ├── evaluation.py        # Assessment Result Retrieval Endpoints
│   │       │   ├── session.py           # Candidate Session History Endpoints
│   │       │   ├── health.py            # Health Check Endpoint
│   │       │   └── admin.py             # Role Configuration Administration
│   │       ├── schemas/                 # Pydantic Input/Output Schemas
│   │       │   ├── interview_schema.py  # GeneratedQuestion & InterviewPlanOutput Schemas
│   │       │   ├── evaluation_schema.py # QuestionEvaluationItem & InterviewEvaluationOutput
│   │       │   └── session_schema.py    # Session Management Schemas
│   │       └── services/                # Business Logic Services
│   │           ├── interview_service.py # Orchestrates Interview Generation Crews
│   │           ├── evaluation_service.py# Orchestrates Evaluation Crews
│   │           └── session_service.py   # Manages Session Lifecycle & DB Operations
│   │
│   ├── ai/                              # CrewAI Agentic Multi-Agent Core
│   │   ├── agents/                      # Specialized Agent Factories
│   │   │   ├── planner_agent.py         # Blueprint Planning Agent
│   │   │   ├── question_agent.py        # Question Generation Agent
│   │   │   ├── answer_agent.py          # Reference Benchmark Agent
│   │   │   ├── qa_agent.py              # Quality Audit Agent
│   │   │   └── evaluator_agent.py       # Scoring & Feedback Agent
│   │   ├── tasks/                       # Task Definitions & Prompts Binding
│   │   │   ├── planner_task.py          # Curriculum Planning Task
│   │   │   ├── question_task.py         # Question Creation Task
│   │   │   ├── answer_task.py           # Benchmark Solution Task
│   │   │   ├── qa_task.py               # Audit & Schema Compliance Task
│   │   │   └── evaluation_task.py       # Candidate Evaluation Task
│   │   ├── crews/                       # Sequential Crew Executions
│   │   │   ├── interview_crew.py        # Multi-Agent Generation Crew Pipeline
│   │   │   └── evaluation_crew.py       # Automated Evaluation Crew Pipeline
│   │   ├── llm/                         # LLM Provider Layer
│   │   │   ├── llm_factory.py           # Dual-LLM Routing (OpenAI / Ollama)
│   │   │   ├── openai.py                # OpenAI API Interface
│   │   │   └── ollama.py                # Local Ollama Interface
│   │   ├── prompts/                     # System Prompts & Context Instructions
│   │   └── configs/                     # Role & Skill Boundary Governance (`roles.json`)
│   │
│   ├── repositories/                    # Data Access Layer (SQLAlchemy ORM)
│   │   ├── interview_repository.py      # Questions & Session SQL Operations
│   │   ├── evaluation_repository.py     # Evaluation & Scoring SQL Operations
│   │   ├── session_repository.py        # Session Query Operations
│   │   └── role_repository.py           # Dynamic Role JSON Reader
│   │
│   ├── models/                          # SQLAlchemy Database ORM Models
│   │   ├── interview_session.py         # Session Entity Model
│   │   ├── interview_question.py        # Question & Response Entity Model
│   │   └── evaluation.py                # Score & Feedback Entity Model
│   │
│   └── shared/                          # Common Utilities & Validators
│       ├── exceptions/                  # Custom API Exceptions
│       ├── utils/                       # Candidate Answer Validator (Non-answer filter)
│       ├── validators/                  # Input Request Sanitize Helpers
│       └── helpers/                     # Response Formatter Utilities
│
├── frontend/                            # Angular 17+ Modern SPA Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/              # UI Component Modules
│   │   │   │   ├── chat-widget/         # Interactive Interview Simulation Component
│   │   │   │   ├── login/               # Authentication Interface
│   │   │   │   ├── registration/        # User Registration
│   │   │   │   ├── upload/              # Resume / Document Upload
│   │   │   │   ├── admin/               # Admin Management Dashboard
│   │   │   │   └── feedback/            # Candidate Evaluation Results Display
│   │   │   ├── services/                # Angular HttpClient Services
│   │   │   │   ├── auth.service.ts      # Authentication & Guard Token Management
│   │   │   │   ├── chat.service.ts      # Session & Question API Bridge
│   │   │   │   └── admin.service.ts     # Admin Settings API Service
│   │   │   └── models/                  # TypeScript Data Models & Interfaces
│   │   └── index.html                   # Application Root Page
│   └── package.json                     # Frontend Dependencies & NPM Scripts
│
└── docs/                                # Technical Architectural Documentation
    └── Architecture.md                  # Comprehensive System Blueprints
```

---

## 🛢️ Database Schema & Entity Relationship

The MySQL storage engine uses normalized relational tables to track candidate sessions, questions, benchmark solutions, candidate answers, and scoring breakdowns:

1. **`interview_sessions`**: Stores session metadata (`session_id`, `role`, `experience_years`, `difficulty`, `status`, `total_score`, `created_at`).
2. **`interview_questions`**: Holds individual generated questions (`id`, `session_id`, `question_no`, `topic`, `difficulty`, `question_text`, `ideal_answer`, `user_answer`).
3. **`candidate_evaluations`**: Records AI assessment scores (`id`, `session_id`, `question_no`, `score`, `feedback_text`, `evaluated_at`).

---

## ⚡ API Endpoint Specification

| Method | Endpoint | Description | Request Payload / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/interview/generate` | Generates a new customized interview session via CrewAI. | `{ "role": "ai_engineer", "experience": 3, "difficulty": "Hard", "total_questions": 5 }` |
| `POST` | `/api/v1/interview/submit` | Submits candidate responses for a session. | `{ "session_id": "UUID", "answers": [{ "question_no": 1, "answer": "..." }] }` |
| `GET` | `/api/v1/evaluation/results/{session_id}` | Fetches final candidate scores, feedback, and benchmark comparison. | `session_id` (Path Parameter) |
| `GET` | `/api/v1/session/history` | Retrieves historical interview sessions for analytics. | Query Params: `limit`, `offset` |
| `GET` | `/api/v1/health` | System health check and database connectivity verification. | None |

---

## 💻 Quick Start & Local Setup Guide

### 1. Prerequisites
* **Python 3.10+** installed
* **Node.js 18+** & **Angular CLI** (`npm install -g @angular/cli`)
* **MySQL 8.0+** running locally or in Docker
* *(Optional)* **Ollama** installed locally for privacy-focused offline LLM execution

---

### 2. Backend Setup (FastAPI & CrewAI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Configure Environment Variables (.env)
cp .env.example .env
```

Edit `.env` to configure your database and LLM credentials:
```ini
PROJECT_NAME="AI Interview Practice Assistant"
PROJECT_VERSION="1.0.0"

# LLM Configuration (Choose 'openai' or 'ollama')
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL_NAME=gpt-4o-mini

# Local Ollama Configuration (Fallback/Local Mode)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=llama3

# MySQL Database Configuration
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/interview_assistant_db
```

Launch the FastAPI Backend Server:
```bash
python main.py
# Server starts at: http://localhost:8000
# Interactive Swagger API Docs available at: http://localhost:8000/docs
```

---

### 3. Frontend Setup (Angular)

```bash
# Navigate to frontend directory
cd frontend

# Install node packages
npm install

# Serve frontend application
ng serve --open
# Application available at: http://localhost:4200
```

---

## 🎯 Key Highlights for Technical 

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             WHY THIS PROJECT STANDS OUT                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. REAL AGENTIC WORKFLOW: Unlike basic wrapper apps, this project implements     │
│    sequential multi-agent orchestration with dedicated CrewAI roles & tasks.      │
│                                                                                  │
│ 2. STRUCTURED OUTPUT GUARANTEE: Uses Pydantic schemas across all agent boundaries │
│    to eliminate JSON parsing errors and hallucinated fields.                    │
│                                                                                  │
│ 3. ENTERPRISE REPO DESIGN: Layered architecture separating Routing, Services,   │
│    Multi-Agent Crews, Repositories, and ORM Models cleanly.                      │
│                                                                                  │
│ 4. RESILIENT EVALUATION PIPELINE: Includes automatic non-answer filtering,      │
│    rubric matching, and fallbacks to ensure accurate scoring every single time. │
└──────────────────────────────────────────────────────────────────────────────────┘
```


# CrewAI Multi Agent Flow
```text
                  Planner Agent
                        |
          -------------------------------
          |                             |
          V                             V
 Question Generator              Answer Generator
          |                             |
          -----------Review--------------
                        |
                   QA Agent
                        |
                  MySQL Storage


Planner Agent
        │
        │
        ▼
Planner Blueprint
        │
        ▼
Question Agent
        │
        │  ✓ Mandatory Skills
        │  ✓ Excluded Skills
        ▼
Interview Questions
        │
        ▼
Answer Agent
        │
        ▼
Questions + Answers
        │
        ▼
QA Agent
        │
        ├── ✓ Mandatory Skills Covered
        ├── ✓ No Excluded Skills
        ├── ✓ No Duplicate Questions
        ├── ✓ Correct Difficulty
        ├── ✓ Correct Experience Level
        ├── ✓ Sequential Numbering
        ├── ✓ Exactly N Questions
        ├── ✓ Valid Answers
        └── ✓ InterviewPlanOutput Schema
        │
        ▼
Final Output
```


# Production Architecture
                         +----------------------------+
                         |        roles.json          |
                         |----------------------------|
                         | Mandatory Skills           |
                         | Optional Skills            |
                         | Excluded Skills            |
                         +-------------+--------------+
                                       |
                                       |
                                       v
                     +----------------------------------+
                     | Load Role Configuration          |
                     +---------------+------------------+
                                     |
                                     |
                                     v
          +------------------------------------------------+
          | 1. Planner Agent                               |
          | Interview Curriculum Planner                   |
          |------------------------------------------------|
          | • Read Role Configuration                      |
          | • Generate Interview Blueprint                 |
          | • Cover Mandatory Skills                       |
          | • Ignore Excluded Skills                       |
          +----------------+-------------------------------+
                           |
                           | Blueprint
                           v
          +------------------------------------------------+
          | 2. Question Agent                              |
          | Technical Question Creator                     |
          |------------------------------------------------|
          | • Read Blueprint                              |
          | • Generate Questions                          |
          | • Match Experience                            |
          | • Match Difficulty                            |
          +----------------+-------------------------------+
                           |
                           | Questions
                           v
          +------------------------------------------------+
          | 3. Answer Agent                                |
          | Subject Matter Answer Specialist               |
          |------------------------------------------------|
          | • Read Questions                              |
          | • Generate Ideal Answers                      |
          | • Explain Best Practices                      |
          +----------------+-------------------------------+
                           |
                           | Questions + Answers
                           v
          +------------------------------------------------+
          | 4. QA Agent                                    |
          | Interview QA & Quality Reviewer                |
          |------------------------------------------------|
          | ✓ Validate Mandatory Skills Covered           |
          | ✓ Validate No Excluded Skills Used            |
          | ✓ Remove Duplicate Questions                  |
          | ✓ Remove Overlapping Questions                |
          | ✓ Verify Experience Level                     |
          | ✓ Verify Difficulty                           |
          | ✓ Verify Question Numbering                   |
          | ✓ Verify Total Question Count                 |
          | ✓ Verify InterviewPlanOutput Schema           |
          +----------------+-------------------------------+
                           |
                           |
                           v
          +-----------------------------------------------+
          | InterviewPlanOutput (Pydantic)                |
          +----------------+------------------------------+
                           |
                 +---------+---------+
                 |                   |
                 v                   v
        +----------------+   +----------------------+
        | Save to MySQL  |   | Return FastAPI JSON  |
        +----------------+   +----------------------+


