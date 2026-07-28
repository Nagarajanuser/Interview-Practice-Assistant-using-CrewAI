import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreateSessionComponent } from './components/create-session/create-session.component';
import { SessionDetailComponent } from './components/session-detail/session-detail.component';
import { InterviewPrepComponent } from './components/interview-prep/interview-prep.component';
import { ActiveInterviewComponent } from './components/active-interview/active-interview.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'create', component: CreateSessionComponent },
  { path: 'session/:id', component: SessionDetailComponent },
  { path: 'interview/prep/:id', component: InterviewPrepComponent },
  { path: 'interview/active/:id', component: ActiveInterviewComponent },
  { path: '**', redirectTo: '' }
];


