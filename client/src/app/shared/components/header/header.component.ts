import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <nav class="navbar">
        <div class="container">
          <div class="navbar-brand">
            <a routerLink="/" class="logo">Workflow Timesheet Aggregator <span style="font-size: 0.8rem; color: #666;">Beta</span></a>
          </div>
          <div class="navbar-menu">
            <span class="nav-item" routerLinkActive="active">Hi, {{ getUserName() }}</span>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .header {
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .navbar {
      padding: 1rem 0;
    }

    .container {
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      text-decoration: none;
    }

    .navbar-menu {
      display: flex;
      gap: 1.5rem;
    }

    .nav-item {
      color: #666;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        color: #333;
        background-color: #f5f5f5;
      }

      &.active {
        color: #1976d2;
        background-color: #e3f2fd;
      }
    }
  `]
})
export class HeaderComponent {

  getUserName() {
    const user = sessionStorage.getItem('loginUserDetails');
    if (user) {
      const userObj = JSON.parse(user);
      return userObj.name;
    } else {
      return 'Ghost';
    }
  }
} 