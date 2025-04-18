import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isPasswordVisible = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      login_name: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/timesheet']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      const { login_name, password } = this.loginForm.value;

      const user = {
        login_name: login_name,
        password: password
      };

      const usr = { data: this.authService.encrypt(JSON.stringify(user)) };

      this.authService.login(usr).subscribe({
        next: () => {
          this.router.navigate(['/timesheet']);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage.set(
            error.error?.message || 
            error.message || 
            'Invalid credentials. Please check your login name and password.'
          );
          this.isLoading.set(false);
        }
      });
    }
  }

  get login_name() {
    return this.loginForm.get('login_name');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility() {
    this.isPasswordVisible.set(!this.isPasswordVisible());
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.isPasswordVisible() ? 'text' : 'password';
    }
  }
} 