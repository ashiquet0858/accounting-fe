import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ApiService } from '../../core/services/api.service';

const AVATAR_COLORS = ['#6C63FF','#22C55E','#F59E0B','#EF4444','#0891B2','#DB2777','#9333EA','#14B8A6'];

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule, InputTextModule, IconFieldModule, InputIconModule, DatePipe],
  template: `
    <div class="page-header"><h2>Customers</h2></div>

    <div style="margin-bottom:.75rem">
      <p-iconfield styleClass="w-full">
        <p-inputicon styleClass="pi pi-search" />
        <input pInputText [(ngModel)]="search" (ngModelChange)="onSearch($event)"
          placeholder="Search by name or mobile…" style="width:100%" />
      </p-iconfield>
    </div>

    @if (loading()) {
      @for (_ of [1,2,3,4,5]; track $index) {
        <div class="customer-card">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div class="skeleton" style="width:2.5rem;height:2.5rem;border-radius:50%;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:.85rem;width:45%;margin-bottom:.35rem"></div>
              <div class="skeleton" style="height:.7rem;width:55%"></div>
            </div>
          </div>
        </div>
      }
    } @else if (customers().length === 0) {
      <div style="text-align:center;padding:2.5rem;color:var(--text-3)">
        <i class="pi pi-users" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
        <div style="font-size:.88rem;font-weight:600">No customers found</div>
      </div>
    } @else {
      @for (c of customers(); track c.id; let i = $index) {
        <div class="customer-card">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.95rem;flex-shrink:0;letter-spacing:-.01em"
              [style.background]="avatarColor(i)">
              {{ c.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:.9rem;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                {{ c.name }}
              </div>
              <div style="font-size:.78rem;color:var(--text-2);margin-top:.1rem;display:flex;align-items:center;gap:.35rem">
                <i class="pi pi-phone" style="font-size:.65rem;color:var(--text-3)"></i>{{ c.mobile }}
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:.35rem">
              <div>
                <div style="font-size:.68rem;color:var(--text-3);font-weight:600">Joined</div>
                <div style="font-size:.72rem;color:var(--text-2);font-weight:700">{{ c.created_at | date:'dd MMM yy' }}</div>
              </div>
              <button (click)="newBill(c)"
                style="border:none;background:var(--primary);color:#fff;border-radius:8px;padding:.3rem .65rem;font-size:.7rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:.3rem;box-shadow:0 2px 8px rgba(108,99,255,.3);white-space:nowrap">
                <i class="pi pi-receipt" style="font-size:.7rem"></i> Bill
              </button>
            </div>
          </div>
        </div>
      }
    }
  `
})
export class CustomersComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);
  customers = signal<any[]>([]);
  loading = signal(true);
  search = '';
  private timer: any;

  avatarColor(i: number): string { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

  newBill(c: any) {
    this.router.navigate(['/billing'], {
      state: { customer: { name: c.name, mobile: c.mobile } }
    });
  }

  ngOnInit() { this.load(); }

  load(s?: string) {
    this.loading.set(true);
    this.api.getCustomers(s).subscribe({
      next: v => { this.customers.set(v); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(val: string) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.load(val), 400);
  }
}
