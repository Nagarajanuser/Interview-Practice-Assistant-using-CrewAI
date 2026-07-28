# AI Interview Practice Assistant using CrewAI
It is an enterprise-grade multi-agent Generative AI application that automatically generates personalized technical interviews, evaluates candidate responses, and provides intelligent feedback using CrewAI. The system simulates a real technical interview by dynamically generating role-specific questions, ideal answers, scoring candidate responses, and storing complete interview history for future analysis.
The platform leverages CrewAI Multi-Agent Architecture, FastAPI, MySQL, Ollama LLMs, and Pydantic to build a scalable AI-powered interview assessment system


# High-Level Architecture
                +----------------------+
                |      Angular UI      |
                +----------+-----------+
                           |
                    REST API Calls
                           |
                           ▼
                +----------------------+
                |      FastAPI         |
                | Interview Services   |
                +----------+-----------+
                           |
             -----------------------------
             |            |             |
             ▼            ▼             ▼
      Session DB     CrewAI Engine    Logging
         MySQL
                           |
      --------------------------------------------
      |          |          |          |          |
      ▼          ▼          ▼          ▼          ▼
 Planner     Question    Answer      QA     Evaluation
  Agent        Agent      Agent     Agent      Agent
      |          |          |          |          |
      --------------------------------------------
                           |
                           ▼
                    OpenAI / Ollama
                           |
                           ▼
                    Generated Results
                           |
                           ▼
                        MySQL Database
                           |
                           ▼
                     Interview Reports

# Complete Workflow
User
↓
Select Role
Select Experience
Select Duration
↓
FastAPI
↓
Create Interview Session
↓
CrewAI
↓
Planner Agent
↓
Question Generator Agent
↓
Answer Generator Agent
↓
QA Agent
↓
Validated Interview
↓
Save Questions into MySQL
↓
Frontend Displays Questions
↓
Candidate Answers Questions
↓
Submit Answers
↓
Evaluation Agent
↓
Score Each Question
↓
Calculate Total Score
↓
Save Scores
↓
Display Final Report


# Sequence Diagram
Candidate
↓
Generate Interview
↓
FastAPI
↓
CrewAI
↓
Planner Agent
↓
Question Agent
↓
Answer Agent
↓
QA Agent
↓
MySQL
↓
Questions Returned
↓
Candidate Answers
↓
FastAPI
↓
Evaluation Agent
↓
Score Calculation
↓
Store Results
↓
Return Final Report

