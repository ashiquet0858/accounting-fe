import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, InputTextModule, SelectModule, ButtonModule, ToastModule],
  providers: [MessageService],
  styles: [`
    .back-btn {
      display:flex; align-items:center; gap:.5rem;
      background:none; border:none; cursor:pointer;
      font-size:.9rem; font-weight:700; color:var(--text-2); padding:0; margin-bottom:1.25rem;
    }
  `],
  template: `
    <p-toast />

    <button class="back-btn" (click)="router.navigate(['/users'])">
      <i class="pi pi-arrow-left" style="font-size:.85rem"></i> Team
    </button>

    <div class="page-header"><h2>Add Team Member</h2></div>

    <div class="mob-section">
      <div class="field" style="margin-bottom:.875rem">
        <label>Username *</label>
        <input pInputText [(ngModel)]="form.username" placeholder="e.g. john"
          style="width:100%" (keyup.enter)="save()" />
      </div>
      <div class="field" style="margin-bottom:.875rem">
        <label>Password *</label>
        <input pInputText [(ngModel)]="form.password" type="password"
          placeholder="Min 6 characters" style="width:100%" (keyup.enter)="save()" />
      </div>
      <div class="field" style="margin-bottom:.875rem">
        <label>Role *</label>
        <p-select [(ngModel)]="form.role" [options]="roleOptions"
          optionLabel="label" optionValue="value" styleClass="w-full" />
      </div>

      <!-- Role description -->
      <div style="border-radius:12px;padding:.875rem;font-size:.82rem;line-height:1.6"
        [style.background]="form.role === 'admin' ? '#EEF0FF' : '#EDFDF5'"
        [style.color]="form.role === 'admin' ? '#4B44CC' : '#15803D'">
        @if (form.role === 'admin') {
          <i class="pi pi-shield" style="margin-right:.4rem"></i>
          <strong>Admin</strong> — Full access: dashboard, billing, history, menu, customers, team
        } @else {
          <i class="pi pi-user" style="margin-right:.4rem"></i>
          <strong>Staff</strong> — Billing, bill history and customers only
        }
      </div>
    </div>

    <p-button label="Create Member" icon="pi pi-check" severity="success"
      styleClass="w-full" style="display:block;margin-top:1rem"
      [loading]="saving()" (onClick)="save()" />
  `
})
export class UserFormComponent {
  router = inject(Router);
  private api = inject(ApiService);
  private msg = inject(MessageService);

  saving = signal(false);
  form = { username: '', password: '', role: 'staff' };
  roleOptions = [
    { label: 'Staff — billing only', value: 'staff' },
    { label: 'Admin — full access',  value: 'admin' },
  ];

  save() {
    if (!this.form.username || !this.form.password) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'All fields are required' }); return;
    }
    if (this.form.password.length < 6) {
      this.msg.add({ severity: 'warn', summary: 'Password', detail: 'Minimum 6 characters' }); return;
    }
    this.saving.set(true);
    this.api.createUser(this.form).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Created', detail: `${this.form.username} added` });
        setTimeout(() => this.router.navigate(['/users']), 600);
      },
      error: e => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message ?? 'Failed to create user' });
        this.saving.set(false);
      }
    });
  }
}
