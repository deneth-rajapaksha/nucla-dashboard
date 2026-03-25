import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService, UserProfile } from './services/profile.service';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isEditing = signal(false);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  isChangingPassword = signal(false);
  passwordErrorMsg = signal<string | null>(null);
  passwordSuccessMsg = signal<string | null>(null);

  originalProfile: UserProfile | null = null;

  profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.pattern(/^[^\s].*[^\s]$/)]],
    lastName: ['', [Validators.required, Validators.pattern(/^[^\s].*[^\s]$/)]],
    age: [null as number | null, [Validators.required, Validators.min(1), Validators.max(120)]]
  });

  passwordForm = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.originalProfile = data;
        this.profileForm.patchValue(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.errorMsg.set('Failed to load profile data. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }

  toggleEditMode(): void {
    if (this.isEditing() && this.originalProfile) {
      // Cancelled, reset form
      this.profileForm.patchValue(this.originalProfile);
      this.errorMsg.set(null);
      this.successMsg.set(null);
    }
    this.isEditing.update(val => !val);
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const formValue = this.profileForm.getRawValue();
    // Age is cast back to number because the form allows null initially
    const payload: UserProfile = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      age: Number(formValue.age)
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (updatedProfile) => {
        this.originalProfile = updatedProfile;
        this.profileForm.patchValue(updatedProfile);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.successMsg.set('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.errorMsg.set('Failed to save changes. Please check your data and try again.');
        this.isSaving.set(false);
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordErrorMsg.set(null);
    this.passwordSuccessMsg.set(null);

    const val = this.passwordForm.getRawValue();
    this.authService.changePassword(val).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordSuccessMsg.set('Password changed successfully!');
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccessMsg.set(null), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.isChangingPassword.set(false);
        this.passwordErrorMsg.set(err.error?.message || 'Failed to change password. Ensure old password is correct.');
      }
    });
  }

  onLogout(): void {
    const doLogout = () => {
      this.authService.clearToken();
      this.router.navigateByUrl('/');
    };
    
    // Call the backend to invalidate the session, then clear local token
    this.authService.logout().subscribe({
      next: doLogout,
      error: doLogout
    });
  }

  // Helper for template validation messages
  hasError(controlName: string, errorName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched) && control.hasError(errorName));
  }

  hasPasswordError(controlName: string, errorName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched) && control.hasError(errorName));
  }
}
