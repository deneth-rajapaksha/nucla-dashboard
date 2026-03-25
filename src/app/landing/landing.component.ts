import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ParticlesComponent } from '../particles.component';
import { environment } from '../../environments/environment';
import { AuthService } from '../features/auth/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

type AuthView = 'none' | 'login' | 'signup' | 'forgot';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  authView = signal<AuthView>('none');

  // Forms
  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  forgotForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  signupForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    age: [null as number | null, [Validators.required, Validators.min(1)]],
    email: ['', [Validators.required, Validators.email]],
  });

  // State
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  validationErrors = signal<Record<string, string>>({});

  openAuth(view: AuthView) {
    this.authView.set(view);
    this.resetMessages();
    this.loginForm.reset();
    this.forgotForm.reset();
    this.signupForm.reset();
  }

  closeAuth() {
    this.authView.set('none');
  }

  private resetMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.validationErrors.set({});
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.resetMessages();

    const val = this.loginForm.getRawValue();

    this.authService.login(val).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.token) {
          this.authService.setToken(res.token);
        }
        this.successMessage.set('Logged in successfully!');
        setTimeout(() => this.router.navigateByUrl('/dashboard'), 600);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid username or password');
      }
    });
  }

  async onForgot() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.resetMessages();

    const val = this.forgotForm.getRawValue();

    this.authService.forgotPassword(val).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Temporary password sent to your email.');
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to process forgot password');
      }
    });
  }

  async onSignup() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.resetMessages();

    const val = this.signupForm.getRawValue();
    const payload = {
      ...val,
      age: val.age !== null ? Number(val.age) : undefined
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Welcome to NucLa your tempory password sent to your email.');
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 409) {
          this.errorMessage.set('Username already taken');
        } else if (err.status === 400 && err.error?.validationErrors) {
          this.validationErrors.set(err.error.validationErrors);
          this.errorMessage.set('Validation Failed');
        } else {
          this.errorMessage.set(err.error?.message || 'Registration Failed');
        }
      }
    });
  }
}

