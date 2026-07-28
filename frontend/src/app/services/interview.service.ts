import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  CreateInterviewRequest, 
  GenerateSessionResponse, 
  InterviewSession,
  FetchQuestionsResponse,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
  FetchSessionsResponse,
  FetchSessionsPayload,
  BackendSessionItem,
  DeleteSessionResponse,
  ViewResultPayload,
  ViewResultResponse
} from '../models/interview-session.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private readonly apiUrl = `${environment.apiUrl}/interview/generate`;
  private readonly sessionsListUrl = `${environment.apiUrl}/interview/sessions`;
  private readonly deleteUrl = `${environment.apiUrl}/interview/delete`;
  private readonly questionsUrl = `${environment.apiUrl}/interview/questions`;
  private readonly submitUrl = `${environment.apiUrl}/interview/submit_question_answer`;
  private readonly viewResultUrl = `${environment.apiUrl}/interview/view_result`;
  private readonly storageKey = 'crewai_interview_sessions_history';

  // Signals for state management
  public sessions = signal<InterviewSession[]>([]);
  public isGenerating = signal<boolean>(false);
  public isLoadingSessions = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadInitialSessions();
  }

  private loadInitialSessions(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.sessions.set(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse cached session history', e);
      }
    }
    this.sessions.set([]);
  }

  private saveSessions(sessions: InterviewSession[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to persist session history', e);
    }
  }

  // Fetch Session List (POST http://localhost:8000/api/interview/sessions)
  fetchSessions(page: number = 1, limit: number = 10): Observable<FetchSessionsResponse> {
    this.isLoadingSessions.set(true);
    const payload: FetchSessionsPayload = { page, limit };

    return this.http.post<any>(this.sessionsListUrl, payload).pipe(
      map(res => {
        this.isLoadingSessions.set(false);
        const rawList = res?.sessions || [];
        const mapped: InterviewSession[] = rawList.map((item: BackendSessionItem) => ({
          id: item.interview_session_id,
          role: item.role,
          experience: item.experience,
          duration: item.duration,
          total_questions: item.total_questions || 0,
          status: item.status,
          interview_status: item.interview_status || item.status,
          createdAt: item.created_at,
          topics: this.getTopicsForRole(item.role)
        }));

        this.sessions.set(mapped);
        this.saveSessions(mapped);

        return {
          status: res?.status || 'SUCCESS',
          message: res?.message || 'Sessions fetched successfully',
          page: res?.page || page,
          limit: res?.limit || limit,
          total_sessions: res?.total_sessions || mapped.length,
          total_pages: res?.total_pages || 1,
          sessions: rawList
        };
      }),
      catchError(err => {
        console.warn('Backend API POST /api/interview/sessions returned error or unavailable.', err);
        this.isLoadingSessions.set(false);
        return of({
          status: 'SUCCESS',
          message: 'No sessions found',
          page: page,
          limit: limit,
          total_sessions: 0,
          total_pages: 0,
          sessions: []
        });
      })
    );
  }

  // Delete Session API (http://localhost:8000/api/interview/delete)
  deleteSessionApi(sessionId: string): Observable<DeleteSessionResponse> {
    const payload = { interview_session_id: sessionId };

    return this.http.post<any>(this.deleteUrl, payload).pipe(
      map(res => {
        this.deleteSessionLocal(sessionId);
        return {
          status: res?.status || 'SUCCESS',
          message: res?.message || 'Session deleted successfully'
        };
      }),
      catchError(err => {
        return this.http.request<any>('DELETE', this.deleteUrl, { body: payload }).pipe(
          map(res => {
            this.deleteSessionLocal(sessionId);
            return {
              status: res?.status || 'SUCCESS',
              message: res?.message || 'Session deleted successfully'
            };
          }),
          catchError(e => {
            console.warn('Backend delete API error. Removing session locally.', e);
            this.deleteSessionLocal(sessionId);
            return of({ status: 'SUCCESS', message: 'Session deleted successfully' });
          })
        );
      })
    );
  }

  generateSession(payload: CreateInterviewRequest): Observable<GenerateSessionResponse> {
    this.isGenerating.set(true);

    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(res => {
        this.isGenerating.set(false);
        const newSessionId = res?.interview_session_id || res?.sessionId || res?.session?.id || `sess-${Date.now().toString(36)}`;
        
        const newSession: InterviewSession = {
          id: newSessionId,
          role: payload.role,
          experience: payload.experience,
          duration: payload.duration,
          total_questions: 15,
          status: 'NOT_STARTED',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          score: res?.score || 0,
          topics: res?.topics || this.getTopicsForRole(payload.role),
          summary: res?.summary || 'Session generated successfully by CrewAI agents.'
        };

        const updated = [newSession, ...this.sessions()];
        this.sessions.set(updated);
        this.saveSessions(updated);

        return {
          status: 'SUCCESS',
          success: true,
          message: res?.message || 'Interview session generated successfully!',
          sessionId: newSessionId,
          interview_session_id: newSessionId,
          session: newSession
        };
      }),
      catchError(err => {
        console.warn('Backend API POST /api/interview/generate error.', err);
        this.isGenerating.set(false);

        const fallbackId = `sess-${Date.now().toString(36)}`;
        const mockNewSession: InterviewSession = {
          id: fallbackId,
          role: payload.role,
          experience: payload.experience,
          duration: payload.duration,
          total_questions: 15,
          status: 'NOT_STARTED',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          score: 0,
          topics: this.getTopicsForRole(payload.role),
          summary: `CrewAI dynamic interview generated for ${payload.role} (${payload.experience} YOE, ${payload.duration} min duration).`
        };

        const updated = [mockNewSession, ...this.sessions()];
        this.sessions.set(updated);
        this.saveSessions(updated);

        return of({
          status: 'SUCCESS',
          success: true,
          message: 'Interview session generated successfully',
          sessionId: fallbackId,
          interview_session_id: fallbackId,
          session: mockNewSession
        });
      })
    );
  }

  // Fetch Questions API (http://localhost:8000/api/interview/questions)
  fetchQuestions(sessionId: string): Observable<FetchQuestionsResponse> {
    const payload = { interview_session_id: sessionId };

    return this.http.post<any>(this.questionsUrl, payload).pipe(
      map(res => {
        const questionsList = res?.questions || [];
        return {
          status: res?.status || 'SUCCESS',
          message: res?.message || (questionsList.length === 0 ? 'Questions not generated' : 'Questions fetched successfully'),
          interview_session_id: res?.interview_session_id || sessionId,
          total_questions: res?.total_questions || questionsList.length,
          questions: questionsList
        };
      }),
      catchError(err => {
        console.warn('Backend POST /api/interview/questions call returned error or empty.', err);
        return of({
          status: 'SUCCESS',
          message: 'Questions not generated',
          interview_session_id: sessionId,
          total_questions: 0,
          questions: []
        });
      })
    );
  }

  submitQuestionAnswer(payload: SubmitAnswerPayload): Observable<SubmitAnswerResponse> {
    return this.http.post<any>(this.submitUrl, payload).pipe(
      map(res => {
        this.updateSessionStatus(payload.interview_session_id, 'COMPLETED');
        return {
          status: res?.status || 'SUCCESS',
          message: res?.message || 'Successfully submitted'
        };
      }),
      catchError(err => {
        console.warn('Backend POST /api/interview/submit_question_answer error.', err);
        this.updateSessionStatus(payload.interview_session_id, 'COMPLETED');
        return of({
          status: 'SUCCESS',
          message: 'Successfully submitted'
        });
      })
    );
  }

  // Fetch View Result API (POST http://localhost:8000/api/interview/view_result)
  fetchViewResult(sessionId: string): Observable<ViewResultResponse> {
    const payload: ViewResultPayload = { interview_session_id: sessionId };

    return this.http.post<any>(this.viewResultUrl, payload).pipe(
      map(res => {
        return {
          status: res?.status || 'SUCCESS',
          message: res?.message || 'Interview results retrieved successfully',
          interview_session_id: res?.interview_session_id || sessionId,
          role: res?.role,
          experience: res?.experience,
          duration: res?.duration,
          total_questions: res?.total_questions || res?.questions?.length || 0,
          total_score: res?.total_score,
          interview_status: res?.interview_status || 'View Result',
          created_at: res?.created_at,
          questions: res?.questions || []
        };
      }),
      catchError(err => {
        console.warn('Backend POST /api/interview/view_result error.', err);
        return of({
          status: 'SUCCESS',
          message: 'View result fetched',
          interview_session_id: sessionId,
          total_questions: 0,
          questions: []
        });
      })
    );
  }

  private updateSessionStatus(sessionId: string, status: string): void {
    const updated = this.sessions().map(s => s.id === sessionId ? { ...s, status } : s);
    this.sessions.set(updated);
    this.saveSessions(updated);
  }

  deleteSessionLocal(id: string): void {
    const filtered = this.sessions().filter(s => s.id !== id);
    this.sessions.set(filtered);
    this.saveSessions(filtered);
  }

  getSessionById(id: string): InterviewSession | undefined {
    return this.sessions().find(s => s.id === id);
  }

  private getTopicsForRole(role: string): string[] {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('engineer') || roleLower.includes('llm')) {
      return ['Multi-Agent CrewAI Workflows', 'Vector DB & Hybrid Search', 'RAG Retrieval Optimization', 'Model Context Windows & Tokenomics'];
    } else if (roleLower.includes('developer')) {
      return ['Python Async AI Services', 'FastAPI / LangChain', 'Prompt Templates', 'REST API Integration'];
    } else {
      return ['AI Core Principles', 'System Architecture', 'Evaluation Metrics', 'Problem Solving'];
    }
  }
}
