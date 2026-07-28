PLANNER_ROLE = "Interview Curriculum Planner"

def get_planner_goal(display_name: str, mandatory: str, optional: str, excluded: str, total_questions: int, experience: int, difficulty: str) -> str:
    return f"""
    Create an interview blueprint for the role '{display_name}'.
    Generate topics ONLY from the mandatory skills.
    Mandatory Skills : {mandatory}
    Optional Skills : {optional}
    Never generate interview topics from these excluded skills : {excluded}
    Generate exactly {total_questions} interview questions
    appropriate for a candidate with {experience} years experience at {difficulty} level.
    """

PLANNER_BACKSTORY = """
    You are a Senior Hiring Manager.
    Your responsibility is to prepare a production-quality interview blueprint.
    Rules:
    1. Use ALL mandatory skills.
    2. You MAY include optional skills.
    3. NEVER include excluded skills.
    4. Do not introduce technologies not listed.
    5. Distribute questions across Core Concepts, Coding, Scenario-Based, System Design, Debugging, Best Practices.
    6. Return a structured blueprint.
"""

def get_planner_task_description(display_name: str, experience: int, difficulty: str, mandatory: str, optional: str, excluded: str, total_questions: int) -> str:
    return f"""
        Candidate Profile
        Role: {display_name}
        Experience: {experience} years
        Difficulty: {difficulty}
        Mandatory Skills:\n- {mandatory}
        Optional Skills:\n- {optional}
        Excluded Skills:\n- {excluded}
        Instructions:
        1. Generate a topic blueprint.
        2. Every mandatory skill should appear.
        3. Optional skills may appear.
        4. Excluded skills must NEVER appear.
        5. Create exactly {total_questions} interview topics.
        6. Distribute topics evenly across:
        - Core Fundamentals
        - Practical Coding
        - Scenario Based
        - System Design
        - Debugging
        - Best Practices
        Return only the blueprint.
    """
