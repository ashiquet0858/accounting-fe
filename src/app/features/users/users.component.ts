import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#EEF0FF', color: '#6C63FF' },
  staff: { bg: '#EDFDF5', color: '#22C55E' },
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, DatePipe, InputTextModule, SelectModule, ToastModule,
    DialogModule, ButtonModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="page-header">
      <h2>Team</h2>
      <button class="fab" (click)="openAdd()"><i class="pi pi-plus"></i></button>
    </div>

    <!-- Stats chips -->
    @if (!loading()) {
      <div style="display:flex;gap:.5rem;margin-bottom:.875rem;flex-wrap:wrap">
        <div style="background:var(--primary-light);color:var(--primary);border-radius:20px;padding:.3rem .75rem;font-size:.72rem;font-weight:700">
          <i class="pi pi-users" style="margin-right:.3rem"></i>{{ users().length }} total
        </div>
        <div style="background:#EEF0FF;color:#6C63FF;border-radius:20px;padding:.3rem .75rem;font-size:.72rem;font-weight:700">
          {{ adminCount() }} admin
        </div>
        <div style="background:#EDFDF5;color:#22C55E;border-radius:20px;padding:.3rem .75rem;font-size:.72rem;font-weight:700">
          {{ staffCount() }} staff
        </div>
      </div>
    }

    @if (loading()) {
      @for (_ of [1,2,3]; track $index) {
        <div class="customer-card">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div class="skeleton" style="width:2.5rem;height:2.5rem;border-radius:50%;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:.85rem;width:40%;margin-bottom:.35rem"></div>
              <div class="skeleton" style="height:.7rem;width:25%"></div>
            </div>
          </div>
        </div>
      }
    } @else if (users().length === 0) {
      <div style="text-align:center;padding:2.5rem;color:var(--text-3)">
        <i class="pi pi-users" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
        <div style="font-size:.88rem;font-weight:600">No users yet</div>
      </div>
    } @else {
      @for (u of users(); track u.id; let i = $index) {
        <div class="customer-card">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.95rem;flex-shrink:0"
              [style.background]="u.role === 'admin' ? '#6C63FF' : '#22C55E'">
              {{ u.username.charAt(0).toUpperCase() }}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:.9rem;font-weight:700;color:var(--text-1)">{{ u.username }}</div>
              <div style="margin-top:.2rem">
                <span class="chip" [style.background]="roleStyle(u.role).bg" [style.color]="roleStyle(u.role).color">
                  {{ u.role }}
                </span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem;flex-shrink:0">
              <div style="font-size:.68rem;color:var(--text-3)">{{ u.created_at | date:'dd MMM yy' }}</div>
              @if (u.username !== 'admin') {
                <button (click)="confirmDelete(u)"
                  style="border:none;background:var(--danger-bg);color:var(--danger);border-radius:8px;width:1.75rem;height:1.75rem;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center">
                  <i class="pi pi-trash"></i>
                </button>
              }
            </div>
          </div>
        </div>
      }
    }

    <!-- Add User Dialog -->
    <p-dialog [(visible)]="dialogVisible" header="Add Team Member"
      [modal]="true" [style]="{width:'95vw','max-width':'380px'}" [draggable]="false">
      <div style="display:flex;flex-direction:column;gap:.875rem;padding-top:.25rem">
        <div class="field">
          <label>Username *</label>
          <input pInputText [(ngModel)]="form.username" placeholder="e.g. john" style="width:100%" />
        </div>
        <div class="field">
          <label>Password *</label>
          <input pInputText [(ngModel)]="form.password" type="password"
            placeholder="Min 6 characters" style="width:100%" />
        </div>
        <div class="field">
          <label>Role *</label>
          <p-select [(ngModel)]="form.role" [options]="roleOptions"
            optionLabel="label" optionValue="value" styleClass="w-full" />
        </div>
        <!-- Role description -->
        <div style="border-radius:10px;padding:.75rem;font-size:.78rem;line-height:1.5"
          [style.background]="form.role === 'admin' ? '#EEF0FF' : '#EDFDF5'"
          [style.color]="form.role === 'admin' ? '#4B44CC' : '#15803D'">
          @if (form.role === 'admin') {
            <i class="pi pi-shield" style="margin-right:.4rem"></i>
            <strong>Admin</strong> — Full access: dashboard, billing, history, menu management, customers, team management
          } @else {
            <i class="pi pi-user" style="margin-right:.4rem"></i>
            <strong>Staff</strong> — Limited access: dashboard, billing and bill history only
          }
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div style="display:flex;gap:.5rem;width:100%">
          <p-button label="Cancel" [outlined]="true" styleClass="flex-1" (onClick)="dialogVisible=false" />
          <p-button label="Create" [loading]="saving" styleClass="flex-1" (onClick)="save()" />
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class UsersComponent implements OnInit {
  private api     = inject(ApiService);
  private msg     = inject(MessageService);
  private confirm = inject(ConfirmationService);

  users   = signal<any[]>([]);
  loading = signal(true);
  saving  = false;
  dialogVisible = false;
  form = { username: '', password: '', role: 'staff' };
  roleOptions = [
    { label: 'Staff — billing only', value: 'staff' },
    { label: 'Admin — full access',  value: 'admin' },
  ];

  adminCount = () => this.users().filter(u => u.role === 'admin').length;
  staffCount = () => this.users().filter(u => u.role === 'staff').length;
  roleStyle(role: string) { return ROLE_STYLE[role] ?? ROLE_STYLE['staff']; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: v => { this.users.set(v); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.form = { username: '', password: '', role: 'staff' };
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.username || !this.form.password) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'All fields are required' });
      return;
    }
    if (this.form.password.length < 6) {
      this.msg.add({ severity: 'warn', summary: 'Password', detail: 'Min 6 characters' });
      return;
    }
    this.saving = true;
    this.api.createUser(this.form).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Created', detail: `${this.form.username} added` });
        this.dialogVisible = false;
        this.saving = false;
        this.load();
      },
      error: (e) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message ?? 'Failed to create user' });
        this.saving = false;
      }
    });
  }

  confirmDelete(u: any) {
    this.confirm.confirm({
      message: `Remove "${u.username}"?`, header: 'Confirm', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteUser(u.id).subscribe({
          next: () => { this.msg.add({ severity: 'success', summary: 'Removed', detail: `${u.username} deleted` }); this.load(); },
          error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' })
        });
      }
    });
  }
}
