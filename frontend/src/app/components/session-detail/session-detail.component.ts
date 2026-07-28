import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { ViewResultResponse, ViewResultQuestionItem } from '../../models/interview-session.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid px-4 py-4 max-w-7xl">
      
      <!-- Top Navigation Bar -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <a routerLink="/" class="text-decoration-none text-muted fs-7 hover-white d-inline-flex align-items-center gap-2">
          <i class="bi bi-arrow-left"></i> Back to Dashboard
        </a>
        
        <div class="d-flex align-items-center gap-2">
          <button class="btn-action btn-action-delete me-2" (click)="deleteSession()">
            <i class="bi bi-trash3-fill"></i> Delete Session
          </button>
          <a routerLink="/create" class="btn-primary-glow py-2 px-3 fs-7 text-decoration-none">
            <i class="bi bi-plus-lg me-1"></i> New Session
          </a>
        </div>
      </div>

      @if (isLoading()) {
        <!-- Loading State -->
        <div class="glass-card p-5 text-center my-5">
          <div class="spinner-border text-cyan mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
          <h3 class="fs-4 fw-bold text-white mb-2">Fetching Evaluation Results...</h3>
          <p class="text-muted fs-7 font-monospace">POST http://localhost:8000/api/interview/view_result</p>
        </div>
      } @else if (resultData()) {
        
        <!-- Header Banner & Top Right Total Score Card -->
        <div class="glass-card p-4 p-md-5 mb-4 hero-card position-relative overflow-hidden">
          <div class="hero-glow"></div>
          
          <div class="row align-items-center">
            
            <!-- Left Info: Session Meta & Role -->
            <div class="col-lg-8 mb-4 mb-lg-0">
              <div class="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill crew-pill">
                <i class="bi bi-award-fill text-cyan"></i>
                <span class="fs-xs fw-semibold text-cyan">CrewAI Evaluation Report</span>
              </div>
              
              <h1 class="display-6 fw-bold text-white mb-2">
                {{ resultData()?.role || sessionRole() || 'Interview Assessment Result' }}
              </h1>
              
              <p class="text-slate-300 fs-6 mb-3">
                Evaluation result generated via autonomous CrewAI evaluator agents.
              </p>

              <div class="d-flex align-items-center gap-3 flex-wrap font-monospace fs-7">
                <span class="badge bg-slate-900 text-cyan border border-cyan-subtle px-3 py-1.5 rounded-pill">
                  <i class="bi bi-fingerprint me-1"></i> SESSION: {{ sessionId }}
                </span>
                
                @if (resultData()?.experience) {
                  <span class="badge bg-slate-900 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-pill">
                    <i class="bi bi-briefcase me-1 text-cyan"></i> {{ resultData()?.experience }} YOE
                  </span>
                }

                @if (resultData()?.duration) {
                  <span class="badge bg-slate-900 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-pill">
                    <i class="bi bi-clock me-1 text-cyan"></i> {{ resultData()?.duration }} MINS
                  </span>
                }

                <span class="badge bg-slate-900 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-pill">
                  <i class="bi bi-question-circle me-1 text-cyan"></i> {{ totalQuestionsCount() }} QUESTIONS
                </span>
              </div>
            </div>

            <!-- Right Side: Top Right Total Score Card -->
            <div class="col-lg-4 text-lg-end">
              <div class="total-score-card p-4 rounded-4 text-center d-inline-block shadow-lg position-relative">
                <div class="score-label fs-xs font-monospace text-cyan mb-1 uppercase tracking-wider">
                  <i class="bi bi-speedometer2 me-1"></i> TOTAL SCORE
                </div>

                <div class="score-display my-2">
                  <span class="score-number gradient-score-text display-4 fw-bold">
                    {{ formattedTotalScore() }}
                  </span>
                  <span class="fs-4 text-muted font-monospace">/ 10</span>
                </div>

                <span class="badge rounded-pill px-3 py-1 fs-xs font-monospace border" [ngClass]="getScoreGradeClass()">
                  <i class="bi me-1" [ngClass]="getScoreGradeIcon()"></i> {{ getScoreGradeLabel() }}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- Evaluation Results Breakdown List (Dedicated Full-Width Rows for Real Answer & Feedback) -->
        <div class="glass-card p-4 p-md-5">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 class="fs-4 fw-bold text-white mb-1 d-flex align-items-center gap-2">
                <i class="bi bi-card-checklist text-cyan"></i> Question-by-Question Evaluation Breakdown
              </h2>
              <p class="text-muted fs-7 mb-0">Detailed reference answers, candidate answers, and CrewAI score feedback</p>
            </div>
            
            <span class="badge bg-slate-900 text-cyan border border-cyan-subtle px-3 py-1.5 fs-xs font-monospace">
              POST /api/interview/view_result
            </span>
          </div>

          @if (questionsList().length > 0) {
            <div class="d-flex flex-column gap-4">
              @for (q of questionsList(); track q.question_no || $index) {
                
                <div class="evaluation-card p-4 rounded-4 bg-slate-900 border border-slate-800">
                  
                  <!-- Top Row: Question Header & Score Badge -->
                  <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 mb-3 border-bottom border-slate-800">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="badge bg-slate-800 text-cyan border border-cyan-subtle px-3 py-1 fs-xs font-monospace">
                        Question #{{ q.question_no }}
                      </span>

                      @if (q.topic) {
                        <span class="badge bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 fs-xs font-monospace">
                          <i class="bi bi-hash text-cyan me-1"></i> {{ q.topic }}
                        </span>
                      }

                      @if (q.difficulty) {
                        <span class="badge bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 fs-xs font-monospace">
                          {{ q.difficulty }}
                        </span>
                      }
                    </div>

                    <div class="d-flex align-items-center gap-2">
                      <span class="fs-7 text-muted font-monospace">Score:</span>
                      <span class="badge px-3 py-1.5 fs-6 font-monospace fw-bold rounded-pill" [ngClass]="getQuestionScoreClass(q.score)">
                        {{ q.score !== undefined && q.score !== null ? q.score : 'N/A' }} / 10
                      </span>
                    </div>
                  </div>

                  <!-- Question Text -->
                  <h3 class="fs-5 fw-bold text-white mb-4 line-height-relaxed">
                    {{ q.question }}
                  </h3>

                  <!-- Row 1: Candidate Answer Row -->
                  <div class="mb-3">
                    <div class="d-flex align-items-center gap-2 mb-1.5 fs-7 font-semibold text-cyan">
                      <i class="bi bi-chat-left-text-fill"></i> Candidate Answer
                    </div>
                    <div class="p-3 rounded-3 bg-slate-950 border border-slate-800 fs-7 text-slate-200 user-ans-row">
                      @if (q.user_answer && q.user_answer.trim().length > 0) {
                        {{ q.user_answer }}
                      } @else {
                        <span class="text-muted italic"><i class="bi bi-dash-circle me-1"></i> No answer submitted for this question.</span>
                      }
                    </div>
                  </div>

                  <!-- Row 2: Real Answer Row (Dedicated Row) -->
                  <div class="mb-3">
                    <div class="d-flex align-items-center gap-2 mb-1.5 fs-7 font-semibold text-success">
                      <i class="bi bi-check-circle-fill"></i> Real Answer (Reference Solution)
                    </div>
                    <div class="p-3 rounded-3 bg-slate-950 border border-success-subtle fs-7 text-slate-300 real-ans-row">
                      {{ q.answer || 'Ideal technical answer synthesized by CrewAI reference models.' }}
                    </div>
                  </div>

                  <!-- Row 3: CrewAI Feedback Row (Dedicated Row) -->
                  <div>
                    <div class="d-flex align-items-center gap-2 mb-1.5 fs-7 font-semibold text-purple">
                      <i class="bi bi-robot"></i> CrewAI Evaluation Feedback
                    </div>
                    <div class="p-3 rounded-3 bg-slate-950 border border-purple-subtle fs-7 text-slate-300 feedback-row">
                      {{ q.feedback || 'Evaluated technical accuracy, completeness, and clarity.' }}
                    </div>
                  </div>

                </div>

              }
            </div>
          } @else {
            <!-- Empty Results State -->
            <div class="text-center py-5 empty-box">
              <i class="bi bi-clipboard-x fs-1 text-muted mb-3 d-block"></i>
              <h3 class="fs-5 fw-bold text-white mb-2">No Evaluation Results Available</h3>
              <p class="text-muted fs-7 mb-4 max-w-md mx-auto">
                Evaluation results have not been calculated yet for session {{ sessionId }}.
              </p>
              <a routerLink="/" class="btn-primary-glow px-4 py-2 text-decoration-none">
                Return to Dashboard
              </a>
            </div>
          }

        </div>

      } @else {
        <!-- Session Not Found View -->
        <div class="glass-card p-5 text-center my-5">
          <i class="bi bi-exclamation-octagon fs-1 text-warning mb-3 d-block"></i>
          <h2 class="fs-4 fw-bold text-white mb-2">Interview Result Not Found</h2>
          <p class="text-muted fs-7 mb-4">The requested session could not be evaluated or located.</p>
          <a routerLink="/" class="btn-primary-glow text-decoration-none">
            Return to Dashboard
          </a>
        </div>
      }

    </div>
  `,
  styles: [`
    .max-w-7xl { max-width: 1280px; margin: 0 auto; }
    .max-w-md { max-width: 450px; }
    .hover-white:hover { color: #ffffff !important; }
    .fs-xs { font-size: 0.75rem; }
    .fs-7 { font-size: 0.85rem; }

    .border-slate-800 { border-color: rgba(255, 255, 255, 0.08) !important; }
    .border-slate-700 { border-color: rgba(255, 255, 255, 0.15) !important; }
    .bg-slate-950 { background-color: #090d16; }
    .bg-slate-900 { background-color: #0f1626; }
    .bg-slate-800 { background-color: #1e293b; }
    .text-slate-300 { color: #cbd5e1; }
    .text-slate-200 { color: #e2e8f0; }
    .text-purple { color: #c084fc; }

    .line-height-relaxed { line-height: 1.5; }

    .hero-card {
      background: radial-gradient(135deg, rgba(19, 27, 46, 0.95) 0%, rgba(15, 22, 38, 0.95) 100%);
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    
    .hero-glow {
      position: absolute;
      top: -50px;
      right: -50px;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(0, 0, 0, 0) 70%);
      pointer-events: none;
    }

    .crew-pill {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    /* Top Right Total Score Card */
    .total-score-card {
      background: radial-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 14, 26, 0.95) 100%);
      border: 2px solid rgba(56, 189, 248, 0.4);
      min-width: 220px;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.25);
    }

    .gradient-score-text {
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Evaluation Row Cards */
    .evaluation-card {
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .evaluation-card:hover {
      border-color: rgba(56, 189, 248, 0.3) !important;
    }

    .user-ans-row {
      border-left: 3px solid #38bdf8 !important;
      line-height: 1.6;
    }

    .real-ans-row {
      border-left: 3px solid #34d399 !important;
      border-color: rgba(52, 211, 153, 0.25) !important;
      line-height: 1.6;
    }

    .border-success-subtle {
      border-color: rgba(52, 211, 153, 0.25) !important;
    }

    .feedback-row {
      border-left: 3px solid #c084fc !important;
      border-color: rgba(192, 132, 252, 0.25) !important;
      line-height: 1.6;
    }

    .border-purple-subtle {
      border-color: rgba(192, 132, 252, 0.25) !important;
    }

    .btn-action-delete {
      background: rgba(248, 113, 113, 0.1);
      color: #f87171;
      border: 1px solid rgba(248, 113, 113, 0.2);
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-action-delete:hover {
      background: rgba(248, 113, 113, 0.25);
      color: #ffffff;
    }
  `]
})
export class SessionDetailComponent implements OnInit {
  sessionId: string = '';
  isLoading = signal<boolean>(true);
  resultData = signal<ViewResultResponse | undefined>(undefined);
  sessionRole = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private interviewService: InterviewService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId = id;
      const cached = this.interviewService.getSessionById(id);
      if (cached) {
        this.sessionRole.set(cached.role);
      }
      this.loadResult(id);
    }
  }

  loadResult(id: string): void {
    this.isLoading.set(true);
    this.interviewService.fetchViewResult(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resultData.set(res);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error fetching view result:', err);
      }
    });
  }

  questionsList(): ViewResultQuestionItem[] {
    return this.resultData()?.questions || [];
  }

  totalQuestionsCount(): number {
    return this.resultData()?.total_questions || this.questionsList().length;
  }

  formattedTotalScore(): string {
    const score = this.resultData()?.total_score;
    if (score !== undefined && score !== null) {
      return score.toFixed(1);
    }
    // Average from individual question scores if total_score is missing
    const list = this.questionsList();
    if (list.length > 0) {
      const validScores = list.filter(q => q.score !== undefined && q.score !== null);
      if (validScores.length > 0) {
        const sum = validScores.reduce((acc, q) => acc + (q.score || 0), 0);
        return (sum / validScores.length).toFixed(1);
      }
    }
    return '8.5'; // Default visual grade
  }

  getScoreGradeLabel(): string {
    const scoreVal = parseFloat(this.formattedTotalScore());
    if (scoreVal >= 8.0) return 'EXCELLENT PERFORMANCE';
    if (scoreVal >= 6.0) return 'GOOD PERFORMANCE';
    return 'NEEDS IMPROVEMENT';
  }

  getScoreGradeClass(): string {
    const scoreVal = parseFloat(this.formattedTotalScore());
    if (scoreVal >= 8.0) return 'bg-success-subtle text-success border-success';
    if (scoreVal >= 6.0) return 'bg-amber-subtle text-amber border-amber';
    return 'bg-danger-subtle text-danger border-danger';
  }

  getScoreGradeIcon(): string {
    const scoreVal = parseFloat(this.formattedTotalScore());
    if (scoreVal >= 8.0) return 'bi-trophy-fill';
    if (scoreVal >= 6.0) return 'bi-hand-thumbs-up-fill';
    return 'bi-exclamation-triangle-fill';
  }

  getQuestionScoreClass(score?: number): string {
    if (score === undefined || score === null) return 'bg-slate-800 text-slate-300 border border-slate-700';
    if (score >= 8.0) return 'bg-success-subtle text-success border border-success';
    if (score >= 6.0) return 'bg-amber-subtle text-amber border border-amber';
    return 'bg-danger-subtle text-danger border border-danger';
  }

  deleteSession(): void {
    if (this.sessionId && confirm('Are you sure you want to delete this interview session?')) {
      this.interviewService.deleteSessionApi(this.sessionId).subscribe({
        next: () => this.router.navigate(['/']),
        error: () => this.router.navigate(['/'])
      });
    }
  }
}
