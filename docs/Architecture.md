
```text
interview-practice-assistant/
│
├── backend/
│   │
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── logger.py
│   │   ├── security.py
│   │   ├── middleware.py
│   │   ├── constants.py
│   │   ├── startup.py
│   │   └── settings.py
│   │
│   ├── api/
│   │   └── v1/
│   │        ├── routes/
│   │        │      ├── interview.py
│   │        │      ├── evaluation.py
│   │        │      ├── session.py
│   │        │      ├── health.py
│   │        │      └── admin.py
│   │        │
│   │        ├── schemas/
│   │        │      ├── interview_schema.py
│   │        │      ├── evaluation_schema.py
│   │        │      └── session_schema.py
│   │        │
│   │        └── services/
│   │               ├── interview_service.py
│   │               ├── evaluation_service.py
│   │               └── session_service.py
│   │
│   ├── ai/
│   │   │
│   │   ├── agents/
│   │   │      ├── planner_agent.py
│   │   │      ├── question_agent.py
│   │   │      ├── answer_agent.py
│   │   │      ├── qa_agent.py
│   │   │      └── evaluator_agent.py
│   │   │
│   │   ├── tasks/
│   │   │      ├── planner_task.py
│   │   │      ├── question_task.py
│   │   │      ├── answer_task.py
│   │   │      ├── qa_task.py
│   │   │      └── evaluation_task.py
│   │   │
│   │   ├── crews/
│   │   │      ├── interview_crew.py
│   │   │      └── evaluation_crew.py
│   │   │
│   │   ├── prompts/
│   │   │      ├── planner_prompt.py
│   │   │      ├── question_prompt.py
│   │   │      ├── answer_prompt.py
│   │   │      ├── qa_prompt.py
│   │   │      └── evaluation_prompt.py
│   │   │
│   │   ├── llm/
│   │   │      ├── llm_factory.py
│   │   │      ├── openai.py
│   │   │      └── ollama.py
│   │   │
│   │   └── configs/
│   │          └── roles.json
│   │
│   ├── repositories/
│   │      ├── interview_repository.py
│   │      ├── evaluation_repository.py
│   │      ├── session_repository.py
│   │      └── role_repository.py
│   │
│   ├── models/
│   │      ├── interview_session.py
│   │      ├── interview_question.py
│   │      └── evaluation.py
│   │
│   ├── shared/
│   │      ├── exceptions/
│   │      ├── utils/
│   │      ├── validators/
│   │      ├── helpers/
│   │      └── response.py
│   │
│   ├── config/
│   │      └── roles.json
│   │
│   ├── tests/
│   │      ├── api/
│   │      ├── unit/
│   │      ├── integration/
│   │      └── crew/
│   │
│   ├── logs/
│   │
│   ├── .env
│   ├── requirements.txt
│   └── README.md
├──DOCS/
│   └── Architecture.md
│   └── components.md
│   └── services.md
│   └── tests.md
│   └── deployment.md
│   └── user_authentication.md
│   └── user_interaction.md
│   └── document_upload.md
│   └── admin_panel.md
│   └── feedback_system.md
│   └── performance_monitoring.md
│
├── frontend/                           # Angular Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/              # Reusable UI components
│   │   │   │   ├── chat-widget/
│   │   │   │   │   ├── chat-widget.component.ts
│   │   │   │   │   ├── chat-widget.component.html
│   │   │   │   │   ├── chat-widget.component.scss
│   │   │   │   ├── login/               # Login/Authentication
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   ├── registration/         
│   │   │   │   │   ├── registration.component.ts
│   │   │   │   │   ├── registration.component.html
│   │   │   │   ├── upload/
│   │   │   │   ├── admin/
│   │   │   │   └── feedback/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── chat.service.ts
│   │   │   │   ├── upload.service.ts
│   │   │   │   └── admin.service.ts
│   │   │   ├── guards/                 # Route Guards
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── admin.guard.ts
│   │   │   ├── pipes/                  # Pipes for date formatting, etc.
│   │   │   ├── models/                 # TypeScript interfaces
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── message.model.ts
│   │   │   │   ├── upload.model.ts
│   │   │   │   └── feedback.model.ts
│   │   │   ├── environments/           # Environment variables
│   │   │   │   ├── environment.ts
│   │   │   │   └── environment.prod.ts
│   │   │   ├── interceptors/           # HTTP Interceptors (add auth tokens)
│   │   │   │   └── auth.interceptor.ts
│   │   │   └── utils/
│   │   ├── assets/                 # Static assets (logos, favicons)
│   │   ├── favicon.ico
│   │   └── index.html
│   │
│   ├── angular.json                   # Angular CLI configuration
│   ├── package.json                   # Frontend dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   └── README.md                      # Frontend README

```