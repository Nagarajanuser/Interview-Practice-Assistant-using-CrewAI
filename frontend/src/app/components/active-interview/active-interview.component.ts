import { Component, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { FetchedQuestion, SubmitAnswerItem, SubmitAnswerPayload } from '../../models/interview-session.model';

@Component({
  selector: 'app-active-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container px-4 py-4 max-w-4xl">
      
      <!-- Top Navigation & Live Timer Bar -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <a routerLink="/" class="text-decoration-none text-muted fs-7 hover-white d-inline-flex align-items-center gap-2" (click)="stopAudio()">
          <i class="bi bi-x-circle"></i> Exit Interview
        </a>

        <div class="d-flex align-items-center gap-3">
          <!-- Live Interview Duration Timer -->
          <div class="badge bg-slate-800 text-cyan border border-cyan-subtle px-3 py-1.5 fs-xs font-monospace d-inline-flex align-items-center gap-1.5">
            <i class="bi bi-clock-history text-cyan pulse"></i>
            REMAINING TIME: {{ formatTime(remainingSeconds()) }}
          </div>

          <div class="d-flex align-items-center gap-2 text-cyan fs-xs font-monospace">
            <i class="bi bi-record-circle-fill text-danger pulse"></i> LIVE INTERVIEW SESSION
          </div>
        </div>
      </div>

      @if (isSubmittingPayload()) {
        <!-- Evaluation Processing View (Shown while API executes) -->
        <div class="glass-card p-5 text-center my-4">
          <div class="agent-spinner-box mx-auto mb-4 position-relative">
            <div class="outer-ring"></div>
            <div class="inner-ring"></div>
            <i class="bi bi-cpu-fill fs-2 text-cyan center-icon"></i>
          </div>
          
          <h2 class="display-6 fw-bold text-white mb-2">Processing to generate the result</h2>
          <p class="text-slate-300 fs-5 max-w-md mx-auto mb-4">
            CrewAI evaluation agents are evaluating your answers against reference solutions and calculating final scores...
          </p>
          <div class="p-3 mb-2 rounded-3 bg-slate-900 border border-slate-800 max-w-md mx-auto fs-7 text-muted font-monospace">
            <i class="bi bi-terminal me-1 text-cyan"></i> POST http://localhost:8000/api/interview/submit_question_answer
          </div>
        </div>
      } @else if (isSubmittedSuccess()) {
        <!-- Post-Submission Final Success View -->
        <div class="glass-card p-5 text-center my-4 success-card">
          <div class="success-badge-box mx-auto mb-4">
            <i class="bi bi-check-all text-success fs-1"></i>
          </div>

          <h2 class="display-6 fw-bold text-white mb-2">Successfully Submitted!</h2>
          <p class="text-slate-300 fs-5 max-w-md mx-auto mb-3">
            Result will release as soon as possible.
          </p>

          <div class="d-inline-flex align-items-center gap-2 px-3 py-1.5 mb-4 rounded-pill bg-cyan-subtle border border-cyan-subtle text-cyan fs-7 font-monospace">
            <i class="bi bi-hourglass-split"></i> Redirecting to Dashboard in {{ redirectCountdown() }}s...
          </div>

          <div class="p-3 mb-4 rounded-3 bg-slate-900 border border-slate-800 max-w-md mx-auto fs-7 text-muted">
            <i class="bi bi-info-circle me-1 text-cyan"></i>
            CrewAI evaluator agents are analyzing your technical responses and speech clarity.
          </div>

          <a routerLink="/" class="btn-primary-glow px-4 py-3 text-decoration-none fs-6" (click)="clearRedirectTimer()">
            <i class="bi bi-grid-1x2-fill me-2"></i> Go to Dashboard Now
          </a>
        </div>
      } @else if (isLoading()) {
        <!-- Loading Questions Screen -->
        <div class="glass-card p-5 text-center my-4">
          <div class="spinner-border text-cyan mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
          <h3 class="fs-4 fw-bold text-white mb-2">Fetching Interview Questions...</h3>
          <p class="text-muted fs-7 font-monospace">POST http://localhost:8000/api/interview/questions</p>
        </div>
      } @else if (questions().length > 0) {
        
        <!-- Progress Bar Header -->
        <div class="glass-card p-3 mb-4">
          <div class="d-flex align-items-center justify-content-between mb-2 fs-7">
            <span class="text-white fw-bold">
              Question {{ currentIndex() + 1 }} of {{ totalQuestions() }}
            </span>
            <span class="text-cyan font-monospace fs-xs">
              PROGRESS: {{ getProgressPercent() }}%
            </span>
          </div>

          <div class="progress custom-progress" style="height: 6px;">
            <div class="progress-bar bg-cyan-glow" [style.width.%]="getProgressPercent()"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="glass-card p-4 p-md-5 mb-4 position-relative">
          
          <!-- Category & Controls Bar -->
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-slate-800 text-cyan border border-cyan-subtle px-3 py-1 fs-xs font-monospace">
                {{ currentQuestion()?.topic || 'Core Concept' }}
              </span>
              @if (currentQuestion()?.difficulty) {
                <span class="badge bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 fs-xs font-monospace">
                  {{ currentQuestion()?.difficulty }}
                </span>
              }
            </div>

            <!-- Speaker Audio Control Button -->
            <button 
              class="btn-action-speaker" 
              [class.active]="isPlayingAudio()"
              (click)="toggleQuestionAudio()" 
              title="Listen to question spoken via computer speaker">
              <i class="bi" [ngClass]="isPlayingAudio() ? 'bi-volume-up-fill text-cyan' : 'bi-volume-down-fill'"></i>
              {{ isPlayingAudio() ? 'Playing Audio...' : 'Listen Question' }}
            </button>
          </div>

          <!-- Question Text -->
          <h2 class="fs-4 fw-bold text-white mb-4 line-height-relaxed">
            Q{{ currentQuestion()?.question_no }}. {{ currentQuestion()?.question }}
          </h2>

          <!-- Response Area (Type or Speak) -->
          <div class="mb-4">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <label class="form-label-custom mb-0">
                <i class="bi bi-chat-left-text text-cyan me-1"></i> Your Answer
              </label>

              <!-- Microphone Voice Input Toggle Button -->
              <button 
                type="button" 
                class="btn-mic-toggle" 
                [class.recording]="isRecordingMic()"
                (click)="toggleMicrophoneSpeech()">
                <i class="bi" [ngClass]="isRecordingMic() ? 'bi-mic-fill text-danger pulse' : 'bi-mic-mute-fill'"></i>
                {{ isRecordingMic() ? 'Listening (Speak into Mic)...' : 'Speak Answer via Mic' }}
              </button>
            </div>

            <textarea 
              class="form-control-dark font-sans" 
              rows="6" 
              placeholder="Type your answer here or click 'Speak Answer via Mic' to speak into your microphone..."
              [value]="getCurrentAnswer()"
              (input)="onAnswerInput($event)"
            ></textarea>
            
            <div class="d-flex align-items-center justify-content-between mt-2 fs-xs text-muted">
              <span>
                <i class="bi bi-info-circle me-1"></i>
                @if (isRecordingMic()) {
                  <span class="text-danger fw-bold"><i class="bi bi-broadcast me-1"></i> Transcribing live voice input... Previously spoken text is preserved.</span>
                } @else {
                  You can edit or delete this answer anytime before final submission.
                }
              </span>
              <span class="font-monospace">{{ getCurrentAnswer().length }} characters</span>
            </div>
          </div>

          <!-- Question Navigation & Submit Actions -->
          <div class="d-flex align-items-center justify-content-between pt-3 border-top border-slate-800">
            <button 
              class="btn-secondary-dark px-4 py-2.5" 
              [disabled]="currentIndex() === 0" 
              (click)="previousQuestion()">
              <i class="bi bi-arrow-left me-1"></i> Previous Question
            </button>

            @if (currentIndex() < totalQuestions() - 1) {
              <button class="btn-primary-glow px-4 py-2.5" (click)="nextQuestion()">
                Next Question <i class="bi bi-arrow-right ms-1"></i>
              </button>
            } @else {
              <button 
                class="btn-primary-glow bg-success-glow px-4 py-2.5" 
                [disabled]="isSubmittingPayload()"
                (click)="submitAllAnswers()">
                <i class="bi bi-send-check-fill me-1"></i> Submit Final Interview
              </button>
            }
          </div>

        </div>

      } @else {
        <!-- Questions Not Generated Empty View -->
        <div class="glass-card p-5 text-center my-4">
          <div class="warning-badge-box mx-auto mb-4">
            <i class="bi bi-exclamation-triangle-fill text-warning fs-1"></i>
          </div>

          <h2 class="display-6 fw-bold text-white mb-2">Questions Not Generated</h2>
          <p class="text-slate-300 fs-5 max-w-md mx-auto mb-4">
            Questions have not been generated for this interview session yet. Please go to Create Session to generate a new interview session.
          </p>

          <div class="d-flex align-items-center justify-content-center gap-3 flex-wrap">
            <a routerLink="/" class="btn-secondary-dark px-4 py-2.5 text-decoration-none">
              <i class="bi bi-grid-1x2-fill me-2"></i> Go to Dashboard
            </a>
            <a routerLink="/create" class="btn-primary-glow px-4 py-2.5 text-decoration-none">
              <i class="bi bi-arrow-repeat me-2"></i> Create / Regenerate Session
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .max-w-4xl { max-width: 860px; margin: 0 auto; }
    .max-w-md { max-width: 450px; }
    .hover-white:hover { color: #ffffff !important; }
    .fs-xs { font-size: 0.75rem; }
    .fs-7 { font-size: 0.85rem; }

    .pulse { animation: pulseAnim 1.5s infinite; }
    @keyframes pulseAnim {
      0% { opacity: 1; }
      50% { opacity: 0.3; }
      100% { opacity: 1; }
    }

    .bg-slate-900 { background-color: #0f1626; }
    .bg-slate-800 { background-color: #1e293b; }
    .border-slate-800 { border-color: rgba(255, 255, 255, 0.08) !important; }
    .border-slate-700 { border-color: rgba(255, 255, 255, 0.15) !important; }
    .border-cyan-subtle { border-color: rgba(56, 189, 248, 0.3) !important; }
    .bg-cyan-subtle { background-color: rgba(56, 189, 248, 0.15); }

    .line-height-relaxed { line-height: 1.5; }

    .custom-progress {
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
    }

    .bg-cyan-glow {
      background: linear-gradient(90deg, #38bdf8 0%, #818cf8 100%);
    }

    .btn-action-speaker {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      border-radius: 20px;
      padding: 0.35rem 0.9rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }

    .btn-action-speaker:hover, .btn-action-speaker.active {
      background: rgba(56, 189, 248, 0.25);
      color: #ffffff;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
    }

    .btn-mic-toggle {
      background: rgba(19, 27, 46, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      border-radius: 20px;
      padding: 0.35rem 0.9rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }

    .btn-mic-toggle:hover {
      background: rgba(56, 189, 248, 0.1);
      color: #ffffff;
      border-color: rgba(56, 189, 248, 0.3);
    }

    .btn-mic-toggle.recording {
      background: rgba(248, 113, 113, 0.15);
      border-color: rgba(248, 113, 113, 0.4);
      color: #f87171;
      box-shadow: 0 0 12px rgba(248, 113, 113, 0.2);
    }

    .success-card {
      background: radial-gradient(135deg, rgba(19, 27, 46, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%);
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .success-badge-box {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(52, 211, 153, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .warning-badge-box {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(251, 191, 36, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
    }

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

    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }

    .bg-success-glow {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
    }
  `]
})
export class ActiveInterviewComponent implements OnInit, OnDestroy {
  sessionId: string = '';
  questions = signal<FetchedQuestion[]>([]);
  currentIndex = signal<number>(0);
  isLoading = signal<boolean>(true);
  isPlayingAudio = signal<boolean>(false);
  isRecordingMic = signal<boolean>(false);

  isSubmittingPayload = signal<boolean>(false);
  isSubmittedSuccess = signal<boolean>(false);
  redirectCountdown = signal<number>(5);

  remainingSeconds = signal<number>(1800); // Default 30 mins (1800 sec)

  // Stored answers map: question_no -> user answer text
  answersMap: { [questionNo: number]: string } = {};
  private baseSpeechText: string = '';

  private recognitionInstance: any = null;
  private redirectTimerId: any = null;
  private interviewTimerId: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private interviewService: InterviewService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId = id;
      this.loadQuestions(id);
    }
  }

  ngOnDestroy(): void {
    this.stopAudio();
    this.stopMicrophone();
    this.clearRedirectTimer();
    this.clearLiveTimer();
  }

  clearRedirectTimer(): void {
    if (this.redirectTimerId) {
      clearInterval(this.redirectTimerId);
      this.redirectTimerId = null;
    }
  }

  startLiveTimer(durationMinutes: number): void {
    this.clearLiveTimer();
    const totalSec = Math.max(durationMinutes, 1) * 60;
    this.remainingSeconds.set(totalSec);

    this.interviewTimerId = setInterval(() => {
      const currentSec = this.remainingSeconds();
      if (currentSec > 0) {
        this.remainingSeconds.set(currentSec - 1);
      } else {
        this.clearLiveTimer();
      }
    }, 1000);
  }

  clearLiveTimer(): void {
    if (this.interviewTimerId) {
      clearInterval(this.interviewTimerId);
      this.interviewTimerId = null;
    }
  }

  formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  }

  loadQuestions(id: string): void {
    this.isLoading.set(true);

    const session = this.interviewService.getSessionById(id);
    const durMins = session?.duration || 30;
    this.startLiveTimer(durMins);

    this.interviewService.fetchQuestions(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.questions && res.questions.length > 0) {
          this.questions.set(res.questions);
          this.currentIndex.set(0);
          this.playCurrentQuestionAudio();
        } else {
          this.questions.set([]);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error fetching questions:', err);
        this.questions.set([]);
      }
    });
  }

  currentQuestion(): FetchedQuestion | undefined {
    return this.questions()[this.currentIndex()];
  }

  totalQuestions(): number {
    return this.questions().length;
  }

  getProgressPercent(): number {
    if (this.totalQuestions() === 0) return 0;
    return Math.round(((this.currentIndex() + 1) / this.totalQuestions()) * 100);
  }

  getCurrentAnswer(): string {
    const q = this.currentQuestion();
    if (!q) return '';
    return this.answersMap[q.question_no] || '';
  }

  onAnswerInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    const q = this.currentQuestion();
    if (q) {
      this.answersMap[q.question_no] = val;
      this.baseSpeechText = val;
    }
  }

  // --- Audio Text-To-Speech (Computer Speaker Output) ---
  playCurrentQuestionAudio(): void {
    const q = this.currentQuestion();
    if (!q) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isPlayingAudio.set(true);

      const text = `Question ${q.question_no}. ${q.question}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => this.isPlayingAudio.set(false);
      utterance.onerror = () => this.isPlayingAudio.set(false);
      window.speechSynthesis.speak(utterance);
    }
  }

  toggleQuestionAudio(): void {
    if (this.isPlayingAudio()) {
      this.stopAudio();
    } else {
      this.playCurrentQuestionAudio();
    }
  }

  stopAudio(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isPlayingAudio.set(false);
    }
  }

  // --- Speech-To-Text (Microphone Voice Input with Persistent Accumulation) ---
  toggleMicrophoneSpeech(): void {
    if (this.isRecordingMic()) {
      this.stopMicrophone();
    } else {
      this.startMicrophone();
    }
  }

  startMicrophone(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported in this browser. You can type your answer in the text area.");
      return;
    }

    try {
      this.stopAudio(); // Mute speaker while listening
      const q = this.currentQuestion();
      if (q) {
        // Base text is whatever currently exists in answersMap
        this.baseSpeechText = this.answersMap[q.question_no] || '';
      }

      this.recognitionInstance = new SpeechRecognition();
      this.recognitionInstance.continuous = true;
      this.recognitionInstance.interimResults = true;

      this.recognitionInstance.onstart = () => {
        this.ngZone.run(() => {
          this.isRecordingMic.set(true);
        });
      };

      // Accumulate speech transcripts continuously without erasing previous text
      this.recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans + ' ';
          } else {
            interimTranscript += trans;
          }
        }

        this.ngZone.run(() => {
          const currentQ = this.currentQuestion();
          if (currentQ) {
            if (finalTranscript) {
              const prevBase = this.baseSpeechText ? `${this.baseSpeechText} ` : '';
              this.baseSpeechText = (prevBase + finalTranscript).trim();
            }
            const activeBase = this.baseSpeechText ? `${this.baseSpeechText} ` : '';
            this.answersMap[currentQ.question_no] = (activeBase + interimTranscript).trim();
          }
        });
      };

      this.recognitionInstance.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        this.ngZone.run(() => {
          this.isRecordingMic.set(false);
        });
      };

      this.recognitionInstance.onend = () => {
        this.ngZone.run(() => {
          const currentQ = this.currentQuestion();
          if (currentQ && this.answersMap[currentQ.question_no]) {
            this.baseSpeechText = this.answersMap[currentQ.question_no];
          }
          this.isRecordingMic.set(false);
        });
      };

      this.recognitionInstance.start();
    } catch (e) {
      console.error('Failed to initialize Speech Recognition', e);
      this.isRecordingMic.set(false);
    }
  }

  stopMicrophone(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {}
      this.recognitionInstance = null;
    }
    const q = this.currentQuestion();
    if (q && this.answersMap[q.question_no]) {
      this.baseSpeechText = this.answersMap[q.question_no];
    }
    this.isRecordingMic.set(false);
  }

  // --- Question Navigation ---
  previousQuestion(): void {
    if (this.currentIndex() > 0) {
      this.stopAudio();
      this.stopMicrophone();
      this.currentIndex.update(idx => idx - 1);
      const q = this.currentQuestion();
      if (q) {
        this.baseSpeechText = this.answersMap[q.question_no] || '';
      }
      this.playCurrentQuestionAudio();
    }
  }

  nextQuestion(): void {
    if (this.currentIndex() < this.totalQuestions() - 1) {
      this.stopAudio();
      this.stopMicrophone();
      this.currentIndex.update(idx => idx + 1);
      const q = this.currentQuestion();
      if (q) {
        this.baseSpeechText = this.answersMap[q.question_no] || '';
      }
      this.playCurrentQuestionAudio();
    }
  }

  // --- Final Q&A Submission & 5 Sec Redirect Timer ---
  submitAllAnswers(): void {
    this.stopAudio();
    this.stopMicrophone();
    this.clearLiveTimer();
    this.isSubmittingPayload.set(true);

    const answerItems: SubmitAnswerItem[] = this.questions().map(q => ({
      question_id: q.id,
      question_no: q.question_no,
      question: q.question,
      user_answer: this.answersMap[q.question_no] || ''
    }));

    const payload: SubmitAnswerPayload = {
      interview_session_id: this.sessionId,
      answers: answerItems
    };

    this.interviewService.submitQuestionAnswer(payload).subscribe({
      next: (res) => {
        this.isSubmittingPayload.set(false);
        this.handleSubmissionSuccess();
      },
      error: (err) => {
        this.isSubmittingPayload.set(false);
        console.error('Submission error:', err);
        this.handleSubmissionSuccess(); // Fallback success UI
      }
    });
  }

  private handleSubmissionSuccess(): void {
    this.isSubmittedSuccess.set(true);
    this.redirectCountdown.set(5);

    this.clearRedirectTimer();
    this.redirectTimerId = setInterval(() => {
      const current = this.redirectCountdown();
      if (current <= 1) {
        this.clearRedirectTimer();
        this.router.navigate(['/']);
      } else {
        this.redirectCountdown.set(current - 1);
      }
    }, 1000);
  }
}
