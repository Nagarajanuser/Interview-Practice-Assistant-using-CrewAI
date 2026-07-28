import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header-nav">
      <div class="container-fluid px-4 h-100 d-flex align-items-center justify-content-between">
        
        <!-- Brand Logo & Title -->
        <a routerLink="/" class="brand-link d-flex align-items-center gap-3 text-decoration-none">
          <div class="logo-box d-flex align-items-center justify-content-center">
            <i class="bi bi-robot text-cyan fs-4"></i>
          </div>
          <div>
            <div class="brand-title">CrewAI <span class="gradient-text">Interview Assistant</span></div>
            <div class="brand-sub">Autonomous Multi-Agent Evaluator</div>
          </div>
        </a>

        <!-- Navigation Links -->
        <nav class="d-none d-md-flex align-items-center gap-2">
          <a routerLink="/" 
             routerLinkActive="active" 
             [routerLinkActiveOptions]="{exact: true}" 
             class="nav-item-custom text-decoration-none">
            <i class="bi bi-grid-1x2-fill me-1"></i> Dashboard
          </a>
          <a routerLink="/create" 
             routerLinkActive="active" 
             class="nav-item-custom text-decoration-none">
            <i class="bi bi-plus-circle-fill me-1"></i> New Session
          </a>
        </nav>

        <!-- Status Indicator & Actions -->
        <div class="d-flex align-items-center gap-3">
          <div class="crew-status-badge d-none d-sm-flex align-items-center gap-2 px-3 py-1">
            <span class="pulse-dot"></span>
            <span class="status-text">CrewAI Orchestrator Online</span>
          </div>

          <a routerLink="/create" class="btn-primary-glow text-decoration-none">
            <i class="bi bi-lightning-charge-fill me-1"></i> Start Practice
          </a>
        </div>

      </div>
    </header>
  `,
  styles: [`
    .header-nav {
      height: 72px;
      background: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .logo-box {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
    }

    .text-cyan {
      color: #38bdf8;
    }

    .brand-title {
      color: #f8fafc;
      font-weight: 700;
      font-size: 1.1rem;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .brand-sub {
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-item-custom {
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.9rem;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .nav-item-custom:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-item-custom.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    .crew-status-badge {
      background: rgba(19, 27, 46, 0.8);
      border: 1px solid rgba(52, 211, 153, 0.3);
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #34d399;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #34d399;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(52, 211, 153, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
      }
    }
  `]
})
export class HeaderComponent {}
