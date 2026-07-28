import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { InterviewSession } from '../../models/interview-session.model';

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container px-4 py-4 max-w-4xl">
      
      <!-- Top Breadcrumb Navigation -->
      <div class="mb-4 d-flex align-items-center justify-content-between">
        <a routerLink="/" class="text-decoration-none text-muted fs-7 hover-white d-inline-flex align-items-center gap-2">
          <i class="bi bi-arrow-left"></i> Back to Dashboard
        </a>
        <div class="d-flex align-items-center gap-2 text-cyan fs-xs font-monospace">
          <i class="bi bi-shield-check"></i> PRE-INTERVIEW CHECKLIST
        </div>
      </div>

      <!-- Main Prep Card -->
      <div class="glass-card p-4 p-md-5 position-relative overflow-hidden mb-4">
        
        <div class="mb-4">
          <div class="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill crew-pill">
            <i class="bi bi-shield-lock-fill text-cyan"></i>
            <span class="fs-xs fw-semibold text-cyan">Preparation & Precautions</span>
          </div>
          
          <h1 class="display-6 fw-bold text-white mb-2">
            Interview Session <span class="gradient-text">Guidelines</span>
          </h1>
          <p class="text-muted fs-6 mb-0">
            Please read the precautions below and test your computer speaker & microphone before clicking <strong>Start Interview</strong>.
          </p>
        </div>

        @if (session()) {
          <!-- Session Target Details Card -->
          <div class="p-3 mb-4 rounded-3 bg-slate-900 border border-slate-800 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <span class="fs-xs text-muted font-monospace d-block">SESSION ID: {{ session()!.id }}</span>
              <h3 class="fs-5 fw-bold text-white mb-0">{{ session()!.role }} Interview</h3>
            </div>
            <div class="d-flex align-items-center gap-3">
              <span class="badge bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 fs-7 font-monospace">
                <i class="bi bi-briefcase me-1 text-cyan"></i> {{ session()!.experience }} YOE
              </span>
              <span class="badge bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 fs-7 font-monospace">
                <i class="bi bi-clock me-1 text-cyan"></i> {{ session()!.duration }} Mins
              </span>
            </div>
          </div>
        }

        <!-- Precautions & Instructions Grid -->
        <h4 class="fs-6 fw-bold text-white mb-3 text-uppercase letter-spacing-1">Important Precautions & Rules</h4>
        
        <div class="row g-3 mb-4">
          
          <div class="col-12 col-md-6">
            <div class="rule-card p-3 rounded-3 h-100 bg-slate-900 border border-slate-800 d-flex align-items-start gap-3">
              <div class="rule-icon-box bg-blue-subtle text-cyan">
                <i class="bi bi-volume-up-fill fs-5"></i>
              </div>
              <div>
                <h5 class="fs-7 fw-bold text-white mb-1">1. Speaker & Audio Playback</h5>
                <p class="text-muted fs-xs mb-0">
                  Questions will be spoken automatically through your computer speakers using Text-To-Speech. Ensure your sound is unmuted.
                </p>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6">
            <div class="rule-card p-3 rounded-3 h-100 bg-slate-900 border border-slate-800 d-flex align-items-start gap-3">
              <div class="rule-icon-box bg-purple-subtle text-purple">
                <i class="bi bi-mic-fill fs-5"></i>
              </div>
              <div>
                <h5 class="fs-7 fw-bold text-white mb-1">2. Speech-to-Text & Typing</h5>
                <p class="text-muted fs-xs mb-0">
                  You can answer by typing in the response area, speaking directly into your computer microphone, or combining both!
                </p>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6">
            <div class="rule-card p-3 rounded-3 h-100 bg-slate-900 border border-slate-800 d-flex align-items-start gap-3">
              <div class="rule-icon-box bg-emerald-subtle text-emerald">
                <i class="bi bi-pencil-square fs-5"></i>
              </div>
              <div>
                <h5 class="fs-7 fw-bold text-white mb-1">3. Review & Edit Anytime</h5>
                <p class="text-muted fs-xs mb-0">
                  You can navigate between previous and next questions at any time to revise or refine your answers before final submission.
                </p>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6">
            <div class="rule-card p-3 rounded-3 h-100 bg-slate-900 border border-slate-800 d-flex align-items-start gap-3">
              <div class="rule-icon-box bg-amber-subtle text-amber">
                <i class="bi bi-shield-exclamation fs-5"></i>
              </div>
              <div>
                <h5 class="fs-7 fw-bold text-white mb-1">4. Quiet Environment</h5>
                <p class="text-muted fs-xs mb-0">
                  Please stay in a quiet environment free from background noise for clear voice transcription and focused evaluation.
                </p>
              </div>
            </div>
          </div>

        </div>

        <!-- Hardware Self-Test Box -->
        <div class="p-3 mb-4 rounded-3 border-cyan-glow bg-dark-eval d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <i class="bi bi-broadcast fs-3 text-cyan"></i>
            <div>
              <div class="fw-bold text-white fs-7">Test Computer Speaker & Audio Output</div>
              <div class="fs-xs text-muted">Click to verify that your audio output volume is clear</div>
            </div>
          </div>
          <button class="btn-secondary-dark fs-7 py-2 px-3 text-nowrap" (click)="testSpeakerAudio()">
            <i class="bi" [ngClass]="isTestingAudio() ? 'bi-stop-fill text-danger' : 'bi-play-fill text-cyan'"></i>
            {{ isTestingAudio() ? 'Stop Test' : 'Play Test Sound' }}
          </button>
        </div>

        <!-- Start Interview Action -->
        <div class="d-flex align-items-center justify-content-between pt-3 border-top border-slate-800">
          <a routerLink="/" class="btn-secondary-dark px-4 py-2.5 text-decoration-none">
            Cancel
          </a>

          <button (click)="startInterview()" class="btn-primary-glow px-5 py-3 fs-6">
            <i class="bi bi-play-circle-fill me-2"></i> Start Interview
          </button>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .max-w-4xl { max-width: 860px; margin: 0 auto; }
    .hover-white:hover { color: #ffffff !important; }
    .fs-xs { font-size: 0.75rem; }
    .fs-7 { font-size: 0.85rem; }

    .crew-pill {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    .letter-spacing-1 { letter-spacing: 0.05em; }

    .bg-slate-900 { background-color: #0f1626; }
    .bg-slate-800 { background-color: #1e293b; }
    .border-slate-800 { border-color: rgba(255, 255, 255, 0.08) !important; }
    .border-slate-700 { border-color: rgba(255, 255, 255, 0.15) !important; }

    .rule-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bg-blue-subtle { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.25); }
    .bg-purple-subtle { background: rgba(192, 132, 252, 0.15); border: 1px solid rgba(192, 132, 252, 0.25); }
    .bg-emerald-subtle { background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.25); }
    .bg-amber-subtle { background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.25); }

    .text-purple { color: #c084fc; }
    .text-emerald { color: #34d399; }
    .text-amber { color: #fbbf24; }

    .border-cyan-glow {
      border: 1px solid rgba(56, 189, 248, 0.3) !important;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.1);
    }

    .bg-dark-eval { background: #090d16; }
  `]
})
export class InterviewPrepComponent implements OnInit {
  sessionId: string = '';
  session = signal<InterviewSession | undefined>(undefined);
  isTestingAudio = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private interviewService: InterviewService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId = id;
      const found = this.interviewService.getSessionById(id);
      this.session.set(found);
    }
  }

  testSpeakerAudio(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (this.isTestingAudio()) {
        window.speechSynthesis.cancel();
        this.isTestingAudio.set(false);
        return;
      }

      this.isTestingAudio.set(true);
      const testMsg = new SpeechSynthesisUtterance("Crew AI Interview System sound test. Your computer speakers are working perfectly.");
      testMsg.onend = () => this.isTestingAudio.set(false);
      testMsg.onerror = () => this.isTestingAudio.set(false);
      window.speechSynthesis.speak(testMsg);
    } else {
      alert("Browser speech synthesis is not supported in this environment.");
    }
  }

  startInterview(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.router.navigate(['/interview/active', this.sessionId]);
  }
}
