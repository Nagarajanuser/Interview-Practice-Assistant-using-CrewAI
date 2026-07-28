

# Interview Practice Assistant

py -3.11 -m venv venv
venv\Scripts\activate

# To install requirement file
pip install -r requirements.txt

# This will generate full requirements file:
pip freeze > requirements.txt


Handle Multiple Python version in Windows python
https://www.python.org/downloads/windows/


C:\Users\nraja>py -3.11 --version
Python 3.11.0

C:\Users\nraja>py --list
 -V:3.12 *        Python 3.12 (64-bit)
 -V:3.11          Python 3.11 (64-bit)
 -V:3.10          Python 3.10 (64-bit)


Install Dependencies

# Requird Packages
# STEP 1
pip install python-dotenv
pip install fastapi
pip install uvicorn
pip install mysql-connector-python

pip install crewai
pip install ipython
pip install crewai-tools


# To run API
uvicorn main:app --reload



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

# Roles JSON File
AI Engineer
Machine Learning Engineer
Data Scientist
Data Engineer
Python Developer
Python Backend Developer
Angular Frontend Developer

Java Developer
.NET Developer
Java Backend Developer
React Frontend Developer
Angular Full Stack Developer
React Full Stack Developer
DevOps Engineer
Cloud Engineer
QA Automation Engineer
Cyber Security Engineer
Mobile App Developer (Flutter)
Android Developer
iOS Developer
Site Reliability Engineer (SRE)