import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { CreateInterviewRequest } from '../../models/interview-session.model';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container px-4 py-4 max-w-4xl">
      
      <!-- Back Navigation & Breadcrumb -->
      <div class="mb-4 d-flex align-items-center justify-content-between">
        <a routerLink="/" class="text-decoration-none text-muted fs-7 hover-white d-inline-flex align-items-center gap-2">
          <i class="bi bi-arrow-left"></i> Back to Dashboard
        </a>
        <div class="d-flex align-items-center gap-2 text-cyan fs-xs font-monospace">
          <i class="bi bi-terminal"></i> POST http://localhost:8000/api/interview/generate
        </div>
      </div>

      <!-- Main Form Card -->
      <div class="glass-card p-4 p-md-5 position-relative overflow-hidden">
        
        <div class="mb-4">
          <div class="d-inline-flex align-items-center gap-2 px-3 py-1 mb-2 rounded-pill crew-badge">
            <i class="bi bi-robot text-cyan fs-7"></i>
            <span class="fs-xs fw-semibold text-cyan">CrewAI Orchestration System</span>
          </div>
          <h2 class="display-6 fw-bold text-white mb-2">
            Create <span class="gradient-text">Interview Session</span>
          </h2>
          <p class="text-muted fs-6 mb-0">
            Configure your technical interview parameters. CrewAI will instantiate dedicated evaluator agents to conduct your adaptive session.
          </p>
        </div>

        @if (isGeneratedSuccess()) {
          <!-- Success Confirmation Overlay with 2 Buttons -->
          <div class="text-center py-5 success-overlay">
            <div class="success-icon-box mx-auto mb-4">
              <i class="bi bi-check-circle-fill text-success fs-1"></i>
            </div>
            
            <span class="badge bg-success-subtle text-success fs-xs font-monospace px-3 py-1 mb-3 rounded-pill">
              STATUS: SUCCESS
            </span>
            
            <h3 class="fs-3 fw-bold text-white mb-2">Interview Session Generated Successfully!</h3>
            <p class="text-muted fs-6 max-w-md mx-auto mb-4">
              CrewAI multi-agent team for <strong class="text-white">{{ role }}</strong> ({{ experience }} YOE, {{ duration }} Mins) is active and ready.
            </p>

            <div class="session-id-preview p-3 mb-4 rounded-3 bg-slate-900 border border-slate-800 max-w-md mx-auto font-monospace fs-7 text-cyan">
              <span class="text-muted">SESSION ID:</span> {{ generatedSessionId() }}
            </div>

            <!-- Two Required Action Buttons -->
            <div class="d-flex align-items-center justify-content-center gap-3 flex-wrap">
              <a routerLink="/" class="btn-secondary-dark px-4 py-2.5 text-decoration-none">
                <i class="bi bi-grid-1x2-fill me-2"></i> Go to Dashboard
              </a>
              
              <a [routerLink]="['/interview/prep', generatedSessionId()]" class="btn-primary-glow px-4 py-2.5 text-decoration-none">
                <i class="bi bi-play-fill me-1"></i> Start Session
              </a>
            </div>
          </div>
        } @else if (isSubmitting()) {
          <!-- CrewAI Agent Orchestration Loading Screen -->
          <div class="text-center py-5 loading-overlay">
            <div class="agent-spinner-box mx-auto mb-4 position-relative">
              <div class="outer-ring"></div>
              <div class="inner-ring"></div>
              <i class="bi bi-cpu-fill fs-2 text-cyan center-icon"></i>
            </div>
            
            <h3 class="fs-4 fw-bold text-white mb-2">{{ activeStepText() }}</h3>
            <p class="text-muted fs-7 max-w-md mx-auto mb-4">
              Instantiating HR Evaluator, Technical Lead, and Agent Choreographer using CrewAI...
            </p>

            <!-- Agent Progress Cards -->
            <div class="row g-2 justify-content-center max-w-lg mx-auto text-start">
              <div class="col-12">
                <div class="agent-step-card d-flex align-items-center gap-3 p-2.5 rounded-3 bg-slate-900 border border-slate-800">
                  <span class="step-badge active"><i class="bi bi-check-lg"></i></span>
                  <div>
                    <div class="fw-semibold text-white fs-7">HR Evaluator Agent</div>
                    <div class="fs-xs text-muted">Configured role depth for {{ role }}</div>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <div class="agent-step-card d-flex align-items-center gap-3 p-2.5 rounded-3 bg-slate-900 border border-slate-800">
                  <span class="step-badge active"><i class="bi bi-check-lg"></i></span>
                  <div>
                    <div class="fw-semibold text-white fs-7">Technical Code Architect Agent</div>
                    <div class="fs-xs text-muted">Building {{ experience }} YOE question tree</div>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <div class="agent-step-card d-flex align-items-center gap-3 p-2.5 rounded-3 bg-slate-900 border border-slate-800">
                  <span class="step-badge active"><i class="bi bi-check-lg"></i></span>
                  <div>
                    <div class="fw-semibold text-white fs-7">Session Timer & Evaluator</div>
                    <div class="fs-xs text-muted">Setting {{ duration }} minute timer & rubric</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <form (ngSubmit)="submitForm()" #sessionForm="ngForm">
            
            <!-- Field 1: Role -->
            <div class="mb-4">
              <label class="form-label-custom">
                <i class="bi bi-person-badge text-cyan me-1"></i> Target Role
              </label>
              
              <!-- Quick Role Selection Chips -->
              <div class="d-flex flex-wrap gap-2 mb-3">
                @for (presetRole of presetRoles; track presetRole) {
                  <button 
                    type="button" 
                    class="chip-button" 
                    [class.active]="role === presetRole"
                    (click)="setRole(presetRole)">
                    {{ presetRole }}
                  </button>
                }
              </div>

              <input 
                type="text" 
                name="role" 
                class="form-control-dark" 
                placeholder="e.g. AI Engineer, AI Developer, LLM Architect" 
                [(ngModel)]="role" 
                required 
              />
              <div class="form-text text-muted fs-xs mt-1">
                Select from quick presets above or type a custom AI title.
              </div>
            </div>

            <!-- Field 2: Year of Experience -->
            <div class="mb-4">
              <label class="form-label-custom">
                <i class="bi bi-briefcase text-cyan me-1"></i> Years of Experience
              </label>

              <!-- Quick Experience Pills -->
              <div class="d-flex flex-wrap gap-2 mb-3">
                @for (expOption of presetExperiences; track expOption) {
                  <button 
                    type="button" 
                    class="chip-button font-monospace" 
                    [class.active]="experience === expOption"
                    (click)="setExperience(expOption)">
                    {{ expOption }} {{ expOption === 1 ? 'Year' : 'Years' }}
                  </button>
                }
              </div>

              <div class="d-flex align-items-center gap-3">
                <input 
                  type="number" 
                  name="experience" 
                  class="form-control-dark font-monospace" 
                  style="max-width: 180px;"
                  min="0"
                  max="30"
                  [(ngModel)]="experience" 
                  required 
                />
                <span class="text-muted fs-7">Years of professional experience</span>
              </div>
            </div>

            <!-- Field 3: Interview Duration -->
            <div class="mb-4">
              <label class="form-label-custom">
                <i class="bi bi-clock-history text-cyan me-1"></i> Interview Duration
              </label>

              <div class="row g-2">
                @for (durOption of presetDurations; track durOption.minutes) {
                  <div class="col-6 col-sm-4 col-md-2">
                    <div 
                      class="duration-card text-center p-3" 
                      [class.active]="duration === durOption.minutes"
                      (click)="setDuration(durOption.minutes)">
                      <i class="bi bi-hourglass-split fs-4 mb-1 d-block" 
                         [class.text-cyan]="duration === durOption.minutes"
                         [class.text-muted]="duration !== durOption.minutes"></i>
                      <div class="fw-bold text-white fs-6 mb-0">{{ durOption.label }}</div>
                      <div class="fs-xs text-muted font-monospace">{{ durOption.minutes }} Mins</div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- JSON Payload Preview Box -->
            <div class="glass-card p-3 mb-4 payload-preview">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fs-xs fw-bold text-cyan font-monospace">
                  <i class="bi bi-code-slash me-1"></i> API Payload Preview (POST http://localhost:8000/api/interview/generate)
                </span>
                <span class="badge bg-slate-800 text-slate-300 fs-xs font-monospace">JSON</span>
              </div>
              <pre class="mb-0 font-monospace text-emerald fs-7"><code>{{ getPayloadJson() }}</code></pre>
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger-dark mb-4 p-3 rounded-3 d-flex align-items-center gap-2">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span class="fs-7">{{ errorMessage() }}</span>
              </div>
            }

            <!-- Submit Button -->
            <div class="d-flex align-items-center justify-content-end gap-3">
              <a routerLink="/" class="btn-secondary-dark text-decoration-none">
                Cancel
              </a>
              
              <button 
                type="submit" 
                class="btn-primary-glow px-4 py-2.5" 
                [disabled]="!role || experience < 0 || !duration">
                <i class="bi bi-lightning-fill me-1"></i> Generate Interview Session
              </button>
            </div>

          </form>
        }

      </div>

    </div>
  `,
  styles: [`
    .max-w-4xl { max-width: 860px; margin: 0 auto; }
    .max-w-md { max-width: 450px; }
    .max-w-lg { max-width: 550px; }

    .hover-white:hover { color: #ffffff !important; }
    .fs-xs { font-size: 0.75rem; }
    .fs-7 { font-size: 0.85rem; }

    .crew-badge {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    .chip-button {
      background: rgba(19, 27, 46, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      border-radius: 20px;
      padding: 0.4rem 1rem;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .chip-button:hover {
      background: rgba(56, 189, 248, 0.1);
      color: #f8fafc;
      border-color: rgba(56, 189, 248, 0.3);
    }

    .chip-button.active {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.5);
      font-weight: 600;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
    }

    .duration-card {
      background: rgba(19, 27, 46, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .duration-card:hover {
      background: rgba(56, 189, 248, 0.08);
      border-color: rgba(56, 189, 248, 0.3);
    }

    .duration-card.active {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.5);
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.15);
    }

    .payload-preview {
      background: #090d16 !important;
      border: 1px solid rgba(56, 189, 248, 0.2) !important;
      border-radius: 12px;
    }

    .text-emerald { color: #34d399; }
    .bg-slate-800 { background-color: #1e293b; }
    .bg-slate-900 { background-color: #0f1626; }
    .text-slate-300 { color: #cbd5e1; }

    .alert-danger-dark {
      background: rgba(248, 113, 113, 0.15);
      border: 1px solid rgba(248, 113, 113, 0.3);
      color: #f87171;
    }

    .bg-success-subtle { background-color: rgba(52, 211, 153, 0.15); }
    .text-success { color: #34d399; }

    .success-icon-box {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(52, 211, 153, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Loading Spinner Styling */
    .agent-spinner-box {
      width: 80px;
      height: 80px;
    }

    .outer-ring {
      position: absolute;
      inset: 0;
      border: 3px solid transparent;
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 1.2s linear infinite;
    }

    .inner-ring {
      position: absolute;
      inset: 10px;
      border: 3px solid transparent;
      border-bottom-color: #818cf8;
      border-radius: 50%;
      animation: spin-reverse 0.8s linear infinite;
    }

    .center-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @keyframes spin-reverse {
      100% { transform: rotate(-360deg); }
    }

    .step-badge.active {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(52, 211, 153, 0.2);
      border: 1px solid #34d399;
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }
  `]
})
export class CreateSessionComponent {
  role: string = 'AI Engineer';
  experience: number = 3;
  duration: number = 30;

  isSubmitting = signal<boolean>(false);
  isGeneratedSuccess = signal<boolean>(false);
  generatedSessionId = signal<string | null>(null);

  errorMessage = signal<string | null>(null);
  activeStepText = signal<string>('Initializing CrewAI Multi-Agent Task Flow...');

  presetRoles = [
    'AI Engineer',
    'AI Developer',
    'LLM Engineer',
    'Machine Learning Engineer',
    'Prompt Engineer'
  ];

  presetExperiences = [1, 3, 5, 8, 9];

  presetDurations = [
    { label: '5 Min', minutes: 5 },
    { label: '10 Min', minutes: 10 },
    { label: '20 Min', minutes: 20 },
    { label: '30 Min', minutes: 30 },
    { label: '45 Min', minutes: 45 },
    { label: '1 Hour', minutes: 60 }
  ];

  constructor(
    private interviewService: InterviewService,
    private router: Router
  ) {}

  setRole(selectedRole: string): void {
    this.role = selectedRole;
  }

  setExperience(exp: number): void {
    this.experience = exp;
  }

  setDuration(dur: number): void {
    this.duration = dur;
  }

  getPayloadJson(): string {
    const payload: CreateInterviewRequest = {
      role: this.role || 'AI Engineer',
      experience: Number(this.experience) || 0,
      duration: Number(this.duration) || 30
    };
    return JSON.stringify(payload, null, 2);
  }

  submitForm(): void {
    if (!this.role.trim()) {
      this.errorMessage.set('Please select or enter a valid interview role.');
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const payload: CreateInterviewRequest = {
      role: this.role.trim(),
      experience: Number(this.experience),
      duration: Number(this.duration)
    };

    setTimeout(() => {
      this.activeStepText.set('HR Evaluator & Code Architect Agents Ready...');
    }, 800);

    setTimeout(() => {
      this.interviewService.generateSession(payload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res && (res.status === 'SUCCESS' || res.success)) {
            const sid = res.interview_session_id || res.sessionId || `sess-${Date.now().toString(36)}`;
            this.generatedSessionId.set(sid);
            this.isGeneratedSuccess.set(true);
          } else {
            this.errorMessage.set(res?.message || 'Failed to generate interview session.');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Failed to generate interview session. Please try again.');
          console.error(err);
        }
      });
    }, 1500);
  }
}
