import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid px-4 py-4 max-w-7xl">
      
      <!-- Top Banner / Hero -->
      <div class="glass-card p-4 p-md-5 mb-4 position-relative overflow-hidden hero-card">
        <div class="hero-glow"></div>
        <div class="row align-items-center">
          <div class="col-lg-8 mb-3 mb-lg-0">
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill crew-pill">
              <i class="bi bi-cpu-fill text-cyan"></i>
              <span class="fs-xs fw-semibold text-cyan">CrewAI Multi-Agent Engine v2.4</span>
            </div>
            <h1 class="display-6 fw-bold text-white mb-2">
              Practice Technical Interviews with <span class="gradient-text">Autonomous AI Crews</span>
            </h1>
            <p class="text-muted fs-6 mb-0 max-w-2xl">
              Simulate realistic AI Engineer & AI Developer technical interviews. CrewAI orchestrates HR evaluators, code architects, and technical interviewers tailored to your experience.
            </p>
          </div>
          <div class="col-lg-4 text-lg-end">
            <a routerLink="/create" class="btn-primary-glow btn-lg px-4 py-3 text-decoration-none">
              <i class="bi bi-plus-lg me-2"></i> Create New Interview Session
            </a>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="row g-3 mb-4">
        
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="glass-card p-3 d-flex align-items-center gap-3">
            <div class="stat-icon-box bg-blue-subtle">
              <i class="bi bi-collection-play-fill text-blue"></i>
            </div>
            <div>
              <div class="stat-value">{{ totalSessions() }}</div>
              <div class="stat-label">Total Sessions</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="glass-card p-3 d-flex align-items-center gap-3">
            <div class="stat-icon-box bg-green-subtle">
              <i class="bi bi-check-circle-fill text-green"></i>
            </div>
            <div>
              <div class="stat-value">{{ completedCount() }}</div>
              <div class="stat-label">Completed Sessions</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="glass-card p-3 d-flex align-items-center gap-3">
            <div class="stat-icon-box bg-purple-subtle">
              <i class="bi bi-speedometer2 text-purple"></i>
            </div>
            <div>
              <div class="stat-value">{{ avgScore() }}%</div>
              <div class="stat-label">Avg CrewAI Score</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="glass-card p-3 d-flex align-items-center gap-3">
            <div class="stat-icon-box bg-amber-subtle">
              <i class="bi bi-clock-history text-amber"></i>
            </div>
            <div>
              <div class="stat-value">{{ totalHours() }} mins</div>
              <div class="stat-label">Total Practice Time</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Session History Section -->
      <div class="glass-card p-4">
        
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 class="fs-4 fw-bold text-white mb-1 d-flex align-items-center gap-2">
              <i class="bi bi-journal-code text-cyan"></i>
              History of Interview Sessions
            </h2>
            <p class="text-muted fs-7 mb-0">Showing latest 10 sessions from POST http://localhost:8000/api/interview/sessions</p>
          </div>

          <!-- Controls: Search & Filter & New CTA -->
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="search-box position-relative">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input 
                type="text" 
                class="form-control-dark ps-5 pe-3 py-2 fs-7" 
                placeholder="Search by role or ID..." 
                [value]="searchTerm()"
                (input)="updateSearch($event)"
              />
            </div>

            <select class="form-control-dark py-2 px-3 fs-7 select-filter" (change)="updateFilter($event)">
              <option value="all">All Statuses</option>
              <option value="Not started">Not started</option>
              <option value="Inprogress">Inprogress</option>
              <option value="waiting for Result">waiting for Result</option>
              <option value="View Result">View Result</option>
            </select>

            <a routerLink="/create" class="btn-primary-glow py-2 px-3 fs-7 text-decoration-none">
              <i class="bi bi-plus-lg me-1"></i> New Session
            </a>
          </div>
        </div>

        @if (isLoadingSessions()) {
          <div class="text-center py-5">
            <div class="spinner-border text-cyan mb-2" role="status"></div>
            <p class="text-muted fs-7 mb-0">Fetching latest sessions...</p>
          </div>
        } @else if (filteredSessions().length > 0) {
          <div class="table-responsive">
            <table class="table custom-dark-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Interview Session</th>
                  <th>Experience</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Interview Status</th>
                  <th>Created Date</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (session of filteredSessions(); track session.id) {
                  <tr class="session-row">
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <div class="role-avatar-box">
                          <i class="bi bi-diagram-3-fill text-cyan"></i>
                        </div>
                        <div>
                          <div class="fw-bold text-white mb-0">{{ session.role }}</div>
                          <div class="fs-xs text-muted font-monospace">{{ session.id }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1">
                        {{ session.experience }} {{ session.experience === 1 ? 'Year' : 'Years' }}
                      </span>
                    </td>
                    <td>
                      <span class="text-slate-300 fs-7 font-monospace">
                        <i class="bi bi-clock me-1 text-muted"></i> {{ session.duration }} min
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-slate-800 text-cyan border border-slate-700 px-2.5 py-1 font-monospace fs-xs">
                        {{ session.total_questions || 15 }} Qs
                      </span>
                    </td>
                    <td>
                      <!-- Interview Status Column bound to interview_status property -->
                      <span class="badge-status" [ngClass]="{
                        'status-not-started': getDisplayStatus(session.status, session.interview_status) === 'Not started',
                        'status-inprogress': getDisplayStatus(session.status, session.interview_status) === 'Inprogress',
                        'status-waiting': getDisplayStatus(session.status, session.interview_status) === 'waiting for Result',
                        'status-completed': getDisplayStatus(session.status, session.interview_status) === 'View Result'
                      }">
                        <i class="bi" [ngClass]="{
                          'bi-play-circle-fill': getDisplayStatus(session.status, session.interview_status) === 'Not started',
                          'bi-arrow-repeat': getDisplayStatus(session.status, session.interview_status) === 'Inprogress',
                          'bi-hourglass-split': getDisplayStatus(session.status, session.interview_status) === 'waiting for Result',
                          'bi-check-circle-fill': getDisplayStatus(session.status, session.interview_status) === 'View Result'
                        }"></i>
                        {{ getDisplayStatus(session.status, session.interview_status) }}
                      </span>
                    </td>
                    <td>
                      <span class="text-muted fs-7 font-monospace">{{ session.createdAt }}</span>
                    </td>
                    <td class="text-end">
                      <div class="d-flex align-items-center justify-content-end gap-2">
                        
                        <!-- Status-based Conditional Action Buttons using interview_status property -->
                        @if (getDisplayStatus(session.status, session.interview_status) === 'Not started') {
                          <a [routerLink]="['/interview/prep', session.id]" class="btn-action btn-action-start text-decoration-none">
                            <i class="bi bi-play-fill me-1"></i> Start Interview
                          </a>
                        } @else if (getDisplayStatus(session.status, session.interview_status) === 'Inprogress') {
                          <a [routerLink]="['/interview/active', session.id]" class="btn-action btn-action-resume text-decoration-none">
                            <i class="bi bi-arrow-right-circle-fill me-1"></i> Resume
                          </a>
                        } @else if (getDisplayStatus(session.status, session.interview_status) === 'View Result') {
                          <a [routerLink]="['/session', session.id]" class="btn-action btn-action-result text-decoration-none">
                            <i class="bi bi-file-earmark-bar-graph-fill me-1"></i> View Result
                          </a>
                        } @else {
                          <span class="btn-action btn-action-disabled">
                            <i class="bi bi-hourglass me-1"></i> Evaluation Pending
                          </span>
                        }

                        <button class="btn-action btn-action-delete" (click)="deleteSession(session.id)" title="Delete session">
                          <i class="bi bi-trash3-fill"></i>
                        </button>

                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="text-center py-5 empty-box">
            <div class="empty-icon-wrapper mb-3">
              <i class="bi bi-journal-x fs-1 text-muted"></i>
            </div>
            <h3 class="fs-5 fw-bold text-white mb-2">No Interview Sessions Found</h3>
            <p class="text-muted fs-7 mb-4 max-w-md mx-auto">
              @if (searchTerm() || statusFilter() !== 'all') {
                No interview sessions match your current filter criteria.
              } @else {
                You haven't generated any CrewAI interview sessions yet. Click below to create your first session!
              }
            </p>
            <a routerLink="/create" class="btn-primary-glow px-4 py-2.5 text-decoration-none">
              <i class="bi bi-plus-circle me-2"></i> Create Interview Session
            </a>
          </div>
        }

      </div>

    </div>
  `,
  styles: [`
    .max-w-7xl { max-width: 1280px; margin: 0 auto; }
    .max-w-2xl { max-width: 650px; }
    .max-w-md { max-width: 440px; }
    
    .hero-card {
      background: radial-gradient(135deg, rgba(19, 27, 46, 0.9) 0%, rgba(15, 22, 38, 0.95) 100%);
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

    .fs-xs { font-size: 0.75rem; }
    .fs-7 { font-size: 0.85rem; }

    .stat-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }

    .bg-blue-subtle { background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); }
    .text-blue { color: #38bdf8; }

    .bg-green-subtle { background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.25); }
    .text-green { color: #34d399; }

    .bg-purple-subtle { background: rgba(192, 132, 252, 0.12); border: 1px solid rgba(192, 132, 252, 0.25); }
    .text-purple { color: #c084fc; }

    .bg-amber-subtle { background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.25); }
    .text-amber { color: #fbbf24; }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.78rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .search-box { min-width: 240px; }
    .select-filter { min-width: 140px; }

    /* Custom Table Styling */
    .custom-dark-table {
      --bs-table-bg: transparent;
      --bs-table-color: #f8fafc;
    }

    .custom-dark-table th {
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.85rem 1rem;
    }

    .session-row {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      transition: background 0.2s ease;
    }

    .session-row:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .session-row td {
      padding: 1rem;
    }

    .role-avatar-box {
      width: 40px;
      height: 40px;
      background: rgba(15, 22, 38, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bg-slate-800 { background-color: #1e293b; }
    .text-slate-300 { color: #cbd5e1; }
    .border-slate-700 { border-color: rgba(255, 255, 255, 0.1) !important; }

    /* Status Badges */
    .badge-status {
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .status-not-started {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .status-inprogress {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }

    .status-waiting {
      background: rgba(192, 132, 252, 0.15);
      color: #c084fc;
      border: 1px solid rgba(192, 132, 252, 0.3);
    }

    .status-completed {
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    /* Action Buttons */
    .btn-action {
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
    }

    .btn-action-start {
      background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
      color: #ffffff;
      box-shadow: 0 0 12px rgba(2, 132, 199, 0.3);
    }

    .btn-action-start:hover {
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .btn-action-resume {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.4);
    }

    .btn-action-resume:hover {
      background: rgba(251, 191, 36, 0.35);
      color: #ffffff;
    }

    .btn-action-result {
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .btn-action-result:hover {
      background: rgba(52, 211, 153, 0.3);
      color: #ffffff;
    }

    .btn-action-disabled {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.2);
      cursor: not-allowed;
    }

    .btn-action-delete {
      background: rgba(248, 113, 113, 0.1);
      color: #f87171;
      border: 1px solid rgba(248, 113, 113, 0.2);
    }

    .btn-action-delete:hover {
      background: rgba(248, 113, 113, 0.25);
      color: #ffffff;
    }

    .empty-box {
      background: rgba(15, 22, 38, 0.4);
      border-radius: 12px;
      border: 1px dashed rgba(255, 255, 255, 0.08);
    }

    .empty-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class DashboardComponent implements OnInit {
  searchTerm = signal<string>('');
  statusFilter = signal<string>('all');

  constructor(private interviewService: InterviewService) {}

  ngOnInit(): void {
    // Fetch latest sessions from POST http://localhost:8000/api/interview/sessions (page: 1, limit: 10)
    this.interviewService.fetchSessions(1, 10).subscribe();
  }

  sessions = computed(() => this.interviewService.sessions());
  isLoadingSessions = computed(() => this.interviewService.isLoadingSessions());

  totalSessions = computed(() => this.sessions().length);
  
  completedCount = computed(() => 
    this.sessions().filter(s => this.getDisplayStatus(s.status, s.interview_status) === 'View Result').length
  );

  avgScore = computed(() => {
    const completed = this.sessions().filter(s => s.score && s.score > 0);
    if (completed.length === 0) return 92;
    const total = completed.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round(total / completed.length);
  });

  totalHours = computed(() => {
    return this.sessions().reduce((acc, curr) => acc + (curr.duration || 0), 0);
  });

  getDisplayStatus(rawStatus: string, rawInterviewStatus?: string): 'Not started' | 'Inprogress' | 'waiting for Result' | 'View Result' {
    const val = rawInterviewStatus || rawStatus;
    if (!val) return 'Not started';
    const s = val.trim();
    if (s === 'Not started' || s === 'NOT_STARTED' || s === 'NOT STARTED' || s === 'READY') return 'Not started';
    if (s === 'Inprogress' || s === 'IN_PROGRESS' || s === 'INPROGRESS' || s === 'IN PROGRESS') return 'Inprogress';
    if (s === 'waiting for Result' || s === 'WAITING_FOR_RESULT' || s === 'WAITING FOR RESULT') return 'waiting for Result';
    if (s === 'View Result' || s === 'COMPLETED' || s === 'VIEW RESULT' || s === 'VIEW_RESULT') return 'View Result';
    return 'Not started';
  }

  filteredSessions = computed(() => {
    const query = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    return this.sessions().filter(session => {
      const matchesRole = session.role.toLowerCase().includes(query) ||
                          session.id.toLowerCase().includes(query) ||
                          (session.topics && session.topics.some(t => t.toLowerCase().includes(query)));
      
      const displayStat = this.getDisplayStatus(session.status, session.interview_status);
      const matchesStatus = status === 'all' || displayStat === status;
      return matchesRole && matchesStatus;
    }).slice(0, 10); // Display top 10 latest sessions
  });

  updateSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  updateFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(val);
  }

  deleteSession(id: string): void {
    if (confirm('Are you sure you want to delete this interview session?')) {
      this.interviewService.deleteSessionApi(id).subscribe({
        next: () => {
          this.interviewService.fetchSessions(1, 10).subscribe();
        },
        error: (err) => {
          console.error('Delete session error:', err);
          this.interviewService.fetchSessions(1, 10).subscribe();
        }
      });
    }
  }
}
