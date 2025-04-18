import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'timesheet',
    loadComponent: () => import('./timesheet/timesheet.component').then(m => m.TimesheetComponent),
    canActivate: [() => {
      const authService = inject(AuthService);
      return authService.isAuthenticated();
    }]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
