import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastModule } from 'primeng/toast';
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
  imports: [DatePipe, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="page-header">
      <h2>Team</h2>
      <button class="fab" (click)="router.navigate(['/users/add'])">
        <i class="pi pi-plus"></i>
      </button>
    </div>

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
      @for (u of users(); track u.id) {
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
  `
})
export class UsersComponent implements OnInit {
  router  = inject(Router);
  private api     = inject(ApiService);
  private msg     = inject(MessageService);
  private confirm = inject(ConfirmationService);

  users   = signal<any[]>([]);
  loading = signal(true);

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
