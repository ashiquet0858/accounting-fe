import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule],
  styles: [`
    .login-bg {
      min-height: 100dvh;
      background: linear-gradient(160deg, #1a1a3e 0%, #2d2d7e 50%, #6C63FF 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 1.5rem;
      position: relative; overflow: hidden;
    }
    .login-bg::before {
      content: '';
      position: absolute; top: -80px; right: -80px;
      width: 260px; height: 260px; border-radius: 50%;
      background: rgba(108,99,255,.25);
    }
    .login-bg::after {
      content: '';
      position: absolute; bottom: -60px; left: -60px;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(255,216,77,.12);
    }
    .login-card {
      width: 100%; max-width: 380px;
      background: rgba(255,255,255,.06);
      border: 1.5px solid rgba(255,255,255,.12);
      border-radius: 28px;
      padding: 2rem 1.75rem;
      position: relative; z-index: 1;
    }
    .brand { text-align: center; margin-bottom: 2rem; }
    .brand-icon {
      width: 4.5rem; height: 4.5rem; border-radius: 22px;
      background: linear-gradient(135deg, #FFD84D, #FF9F43);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: 0 8px 24px rgba(255,216,77,.4);
      i { font-size: 2rem; color: #fff; }
    }
    .brand h1 { font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -.03em; }
    .brand p  { font-size: 0.85rem; color: rgba(255,255,255,.5); margin-top: .25rem; }
    .f-label  { display: block; font-size: .72rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: .06em; color: rgba(255,255,255,.5); margin-bottom: .35rem; }
    .f-wrap   { margin-bottom: 1rem; }
    .error-pill {
      background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.3);
      border-radius: 10px; padding: .6rem .875rem;
      font-size: .82rem; color: #fca5a5;
      display: flex; align-items: center; gap: .5rem; margin-bottom: 1rem;
    }
    .hint { text-align: center; margin-top: 1.25rem; font-size: .78rem; color: rgba(255,255,255,.3); }
    .hint span { color: rgba(255,255,255,.5); font-weight: 600; }
    .dark-input,
    .dark-input input {
      background: rgba(255,255,255,.08) !important;
      border-color: rgba(255,255,255,.18) !important;
      color: #fff !important;
    }
    .dark-input::placeholder,
    .dark-input input::placeholder { color: rgba(255,255,255,.35) !important; }
  `],
  template: `
    <div class="login-bg">
      <div class="login-card">
        <div class="brand">
          <div class="brand-icon"><i class="pi pi-coffee"></i></div>
          <h1>Burfi Billing</h1>
          <p>Sign in to continue</p>
        </div>

        @if (error()) {
          <div class="error-pill">
            <i class="pi pi-exclamation-circle"></i> {{ error() }}
          </div>
        }

        <div class="f-wrap">
          <label class="f-label">Username</label>
          <input pInputText [(ngModel)]="username" placeholder="Enter username"
            (keyup.enter)="login()" class="dark-input" style="width:100%" />
        </div>

        <div class="f-wrap">
          <label class="f-label">Password</label>
          <p-password [(ngModel)]="password" [feedback]="false" [toggleMask]="true"
            placeholder="Enter password" (keyup.enter)="login()"
            inputStyleClass="w-full dark-input"
            styleClass="w-full" />
        </div>

        <p-button label="Sign In" icon="pi pi-sign-in" styleClass="w-full"
          [loading]="loading()" (onClick)="login()"
          [style]="{'height':'2.9rem','font-size':'0.95rem','border-radius':'12px'}" />

        <div class="hint">Default: <span>admin / admin123</span></div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  login() {
    if (!this.username || !this.password) { this.error.set('Please enter credentials'); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.error.set('Invalid username or password'); this.loading.set(false); }
    });
  }
}
