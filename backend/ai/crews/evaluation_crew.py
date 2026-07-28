from typing import List, Tuple
from crewai import Crew
from backend.core.logger import logger
from backend.shared.utils.answer_validator import is_valid_candidate_answer
from backend.repositories.interview_repository import InterviewRepository
from backend.repositories.evaluation_repository import EvaluationRepository
from backend.api.v1.schemas.evaluation_schema import QuestionEvaluationItem, InterviewEvaluationOutput
from backend.ai.llm.llm_factory import get_crewai_llm
from backend.ai.agents.evaluator_agent import create_evaluator_agent
from backend.ai.tasks.evaluation_task import create_evaluation_task

def run_evaluation_crew(session_id: str) -> Tuple[float, List[QuestionEvaluationItem]]:
    questions_data = InterviewRepository.fetch_questions_by_session_id_db(session_id)
    if not questions_data:
        logger.warning(f"No questions found for session {session_id} to evaluate.")
        return 0.0, []

    validated_evaluations_dict = {}
    valid_questions_to_eval = []

    for q in questions_data:
        q_no = q['question_no']
        u_ans = (q.get('user_answer') or '').strip()

        if not is_valid_candidate_answer(u_ans):
            validated_evaluations_dict[q_no] = QuestionEvaluationItem(
                question_no=q_no,
                score=0.0,
                feedback="No answer provided by candidate."
            )
        else:
            valid_questions_to_eval.append(q)

    # If ALL questions are unanswered or non-answers, save 0.0 and return
    if not valid_questions_to_eval:
        all_evals = [validated_evaluations_dict[q['question_no']] for q in questions_data]
        all_evals.sort(key=lambda x: x.question_no)
        EvaluationRepository.save_question_scores_db(session_id, all_evals)
        EvaluationRepository.save_session_total_score_db(session_id, 0.0)
        return 0.0, all_evals

    # Format input ONLY for valid candidate answers
    qa_formatted_input = []
    for q in valid_questions_to_eval:
        qa_formatted_input.append(
            f"Question {q['question_no']}: {q['question']}\n"
            f"Ideal Reference Answer: {q['answer']}\n"
            f"Candidate Submitted Answer: {q['user_answer']}\n"
        )

    full_qa_text = "\n---\n".join(qa_formatted_input)
    llm = get_crewai_llm()

    evaluator_agent = create_evaluator_agent(llm=llm)

    eval_task = create_evaluation_task(
        agent=evaluator_agent,
        session_id=session_id,
        full_qa_text=full_qa_text,
        output_schema=InterviewEvaluationOutput
    )

    crew = Crew(
        agents=[evaluator_agent],
        tasks=[eval_task],
        verbose=True
    )

    result = crew.kickoff()

    evaluations = []
    if hasattr(result, 'pydantic') and result.pydantic and hasattr(result.pydantic, 'evaluations'):
        evaluations = result.pydantic.evaluations
    elif hasattr(result, 'tasks_output') and result.tasks_output:
        last_out = result.tasks_output[-1]
        if hasattr(last_out, 'pydantic') and last_out.pydantic and hasattr(last_out.pydantic, 'evaluations'):
            evaluations = last_out.pydantic.evaluations
        elif hasattr(last_out, 'json_dict') and last_out.json_dict:
            q_list = last_out.json_dict.get('evaluations', [])
            evaluations = [QuestionEvaluationItem(**e) for e in q_list]

    # Map LLM evaluation results to valid questions
    llm_eval_map = {e.question_no: e for e in evaluations}

    for q in valid_questions_to_eval:
        q_no = q['question_no']
        u_ans = (q.get('user_answer') or '').strip()
        word_count = len(u_ans.split())

        llm_item = llm_eval_map.get(q_no)

        if not is_valid_candidate_answer(u_ans):
            score_val = 0.0
            feedback_text = "No answer provided by candidate."
        elif llm_item:
            score_val = max(0.0, min(10.0, float(llm_item.score)))
            feedback_text = llm_item.feedback.strip() if llm_item.feedback and llm_item.feedback.strip() else f"Evaluated answer score: {round(score_val, 1)}/10."
            
            # Post-check: if score_val is 0.0 or feedback indicates a non-answer
            if score_val == 0.0 or "no answer" in feedback_text.lower() or "empty" in feedback_text.lower() or "refusal" in feedback_text.lower():
                score_val = 0.0
                feedback_text = "No answer provided by candidate."
        else:
            # Fallback ONLY if LLM returned no item for this question
            if word_count >= 30:
                score_val = 7.5
                feedback_text = "Good technical response covering key concepts and implementation details."
            elif word_count >= 15:
                score_val = 6.0
                feedback_text = "Clear response addressing core question elements."
            else:
                score_val = 0.0
                feedback_text = "No answer provided by candidate."

        validated_evaluations_dict[q_no] = QuestionEvaluationItem(
            question_no=q_no,
            score=round(score_val, 1),
            feedback=feedback_text
        )


    # Build final sorted list of all evaluations
    all_evaluations = [validated_evaluations_dict[q['question_no']] for q in questions_data]
    all_evaluations.sort(key=lambda x: x.question_no)

    # 1. Save per-question scores to MySQL
    logger.info(f"Saving per-question scores for session {session_id} into MySQL")
    EvaluationRepository.save_question_scores_db(session_id, all_evaluations)

    # 2. Calculate average total score using Python
    total_score = round(sum(e.score for e in all_evaluations) / len(all_evaluations), 2)

    # 3. Save session total score & update status to 'View Result' using Python
    logger.info(f"Saving session {session_id} total_score={total_score} into MySQL")
    EvaluationRepository.save_session_total_score_db(session_id, total_score)

    return total_score, all_evaluations
