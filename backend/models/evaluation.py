from pydantic import BaseModel, Field

class QuestionEvaluationModel(BaseModel):
    question_no: int
    score: float = Field(..., description="Score out of 10")
    feedback: str = Field(..., description="Evaluation feedback explaining the score")
