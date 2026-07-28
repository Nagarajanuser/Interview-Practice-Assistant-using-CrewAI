export interface CreateInterviewRequest {
  role: string;
  experience: number;
  duration: number;
}

export interface CrewAgentInfo {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'ready' | 'idle';
  currentTask?: string;
}

export interface InterviewQuestion {
  id: string | number;
  category: 'Technical' | 'Architecture' | 'Problem Solving' | 'Behavioral' | string;
  question: string;
  expectedKeyPoints?: string[];
  answer?: string;
  difficulty?: string;
  topic?: string;
  created_at?: string;
}

export interface InterviewSession {
  id: string;
  role: string;
  experience: number;
  duration: number;
  status: string; // 'Not started' | 'Inprogress' | 'waiting for Result' | 'View Result' | 'COMPLETED' | 'NOT_STARTED' | 'IN_PROGRESS'
  interview_status?: string; // 'Not started' | 'Inprogress' | 'waiting for Result' | 'View Result'
  createdAt: string;
  score?: number;
  total_questions?: number;
  questions?: InterviewQuestion[];
  topics?: string[];
  crewAgents?: CrewAgentInfo[];
  summary?: string;
}

export interface GenerateSessionResponse {
  status?: string;
  success?: boolean;
  message?: string;
  sessionId?: string;
  interview_session_id?: string;
  session?: InterviewSession;
}

// Sessions List API Request & Response (POST http://localhost:8000/api/interview/sessions)
export interface FetchSessionsPayload {
  page: number;
  limit: number;
}

export interface BackendSessionItem {
  interview_session_id: string;
  role: string;
  experience: number;
  duration: number;
  total_questions?: number;
  created_at: string;
  status: string; // e.g. "COMPLETED", "NOT_STARTED", "IN_PROGRESS", "WAITING_FOR_RESULT"
  interview_status?: string; // e.g. "Not started", "Inprogress", "waiting for Result", "View Result"
}

export interface FetchSessionsResponse {
  status: string;
  message: string;
  page: number;
  limit: number;
  total_sessions: number;
  total_pages: number;
  sessions: BackendSessionItem[];
}

// Delete Session API Request & Response (http://localhost:8000/api/interview/delete)
export interface DeleteSessionRequest {
  interview_session_id: string;
}

export interface DeleteSessionResponse {
  status: string;
  message: string;
}

// Question Retrieval API Request & Response
export interface FetchQuestionsRequest {
  interview_session_id: string;
}

export interface FetchedQuestion {
  id: number | string;
  interview_session_id: string;
  question_no: number;
  question: string;
  answer?: string;
  difficulty?: string;
  topic?: string;
  created_at?: string;
}

export interface FetchQuestionsResponse {
  status: string;
  message: string;
  interview_session_id: string;
  total_questions: number;
  questions: FetchedQuestion[];
}

// Question & Answer Submission Payload & Response
export interface SubmitAnswerItem {
  question_id: number | string;
  question_no: number;
  question: string;
  user_answer: string;
}

export interface SubmitAnswerPayload {
  interview_session_id: string;
  answers: SubmitAnswerItem[];
}

export interface SubmitAnswerResponse {
  status: string;
  message: string;
}

// View Result API Request & Response (POST http://localhost:8000/api/interview/view_result)
export interface ViewResultPayload {
  interview_session_id: string;
}

export interface ViewResultQuestionItem {
  id?: number | string;
  interview_session_id?: string;
  question_no: number;
  question: string;
  answer: string; // Real / Reference Answer
  user_answer?: string; // User Submitted Answer
  score?: number; // Question Score out of 10
  feedback?: string; // Evaluation Feedback
  difficulty?: string;
  topic?: string;
  created_at?: string;
}

export interface ViewResultResponse {
  status: string;
  message: string;
  interview_session_id: string;
  role?: string;
  experience?: number;
  duration?: number;
  total_questions?: number;
  total_score?: number; // Total / Average Score out of 10
  interview_status?: string; // e.g. "View Result"
  created_at?: string;
  questions: ViewResultQuestionItem[];
}
