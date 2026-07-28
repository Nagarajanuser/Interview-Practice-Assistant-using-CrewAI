def get_question_agent_role(display_name: str) -> str:
    return f"Technical Question Creator for {display_name}"

def get_question_agent_goal(total_questions: int) -> str:
    return f"Generate {total_questions} distinct technical interview questions based on the planner's topic blueprint."

def get_question_agent_backstory(display_name: str) -> str:
    return f"You are a Principal Engineer in {display_name}. You craft realistic, clear, and challenging questions spanning core concepts, system design, coding standards, and scenario-based problem solving."

def get_question_task_description(display_name: str, total_questions: int, experience: int, difficulty: str, mandatory: str, excluded: str) -> str:
    return f"""Read the planner blueprint from plan_task.
            Generate exactly {total_questions} technical interview questions for a {display_name} candidate with {experience} years experience at {difficulty} level.
            Requirements:
            Mandatory Skills:\n- {mandatory}
            Excluded Skills:\n- {excluded}
            Rules:
            1. Generate questions ONLY from mandatory skills.
            2. Optional skills may be used.
            3. Never generate excluded skills.
            4. Do not invent new technologies.
            5. Cover all planner topics.
            6. Match {experience} years experience.
            7. Match {difficulty} difficulty.
            Return only interview questions.
    """
