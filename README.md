# AI Interview Practice Assistant using CrewAI
It is an enterprise-grade multi-agent Generative AI application that automatically generates personalized technical interviews, evaluates candidate responses, and provides intelligent feedback using CrewAI. The system simulates a real technical interview by dynamically generating role-specific questions, ideal answers, scoring candidate responses, and storing complete interview history for future analysis.
The platform leverages CrewAI Multi-Agent Architecture, FastAPI, MySQL, Ollama LLMs, and Pydantic to build a scalable AI-powered interview assessment system

# Description
•	Designed and developed a production-ready AI-powered interview platform using CrewAI, FastAPI, Python, OpenAI/Ollama, and MySQL. 
•	Built a multi-agent architecture comprising Planner, Question Generator, Answer Generator, QA, and Evaluation Agents to automate end-to-end interview generation and assessment. 
•	Developed RESTful APIs for interview generation, candidate answer submission, session management, and result retrieval with Pydantic validation and structured logging. 
•	Implemented AI-driven answer evaluation by comparing candidate responses with reference answers, generating detailed feedback, and assigning automated scores. 
•	Designed a normalized MySQL schema to manage interview sessions, questions, candidate responses, scores, and interview history. 
•	Integrated configurable role-based interview generation with dynamic difficulty selection and quality validation for enterprise-scale interview simulations. 


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

