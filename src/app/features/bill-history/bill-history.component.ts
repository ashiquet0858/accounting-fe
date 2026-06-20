import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-bill-history',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, DatePickerModule, ToastModule, TabsModule, DatePipe],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-header"><h2>Bills</h2></div>

    <p-tabs [(value)]="activeTab" (valueChange)="onTabChange($event)">
      <p-tablist>
        <p-tab value="paid">History</p-tab>
        <p-tab value="active">
          Orders
          @if (drafts().length > 0) {
            <span style="margin-left:.35rem;background:var(--primary);color:#fff;border-radius:99px;padding:.1rem .45rem;font-size:.65rem;font-weight:700">
              {{ drafts().length }}
            </span>
          }
        </p-tab>
      </p-tablist>

      <p-tabpanels>
        <!-- HISTORY TAB -->
        <p-tabpanel value="paid">
          <!-- Filters -->
          <div class="m-card" style="padding:.875rem;margin-bottom:.75rem">
            <div class="mob-section-title" style="margin-bottom:.6rem">Filter</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.5rem">
              <div>
                <span class="filter-label">Bill No</span>
                <input pInputText [(ngModel)]="filters.bill_number" placeholder="Search…" style="width:100%" />
              </div>
              <div>
                <span class="filter-label">Customer</span>
                <input pInputText [(ngModel)]="filters.customer_name" placeholder="Name…" style="width:100%" />
              </div>
              <div>
                <span class="filter-label">Mobile</span>
                <input pInputText [(ngModel)]="filters.mobile" placeholder="Number…" style="width:100%" />
              </div>
              <div>
                <span class="filter-label">Date</span>
                <p-datepicker [(ngModel)]="filterDate" dateFormat="yy-mm-dd" placeholder="Pick date"
                  [showButtonBar]="true"
                  (onSelect)="filters.date = filterDate?.toISOString().split('T')[0]"
                  (onClear)="filters.date=''" styleClass="w-full" />
              </div>
            </div>
            <div style="display:flex;gap:.5rem">
              <p-button label="Search" icon="pi pi-search" styleClass="flex-1" (onClick)="search()" />
              <p-button label="Clear" [outlined]="true" styleClass="flex-1" (onClick)="clearFilters()" />
            </div>
          </div>

          @if (loading()) {
            @for (_ of [1,2,3,4]; track $index) {
              <div class="bill-card" style="cursor:default">
                <div class="skeleton" style="height:.85rem;width:40%;margin-bottom:.4rem"></div>
                <div class="skeleton" style="height:.72rem;width:60%"></div>
              </div>
            }
          } @else if (bills().length === 0) {
            <div style="text-align:center;padding:2.5rem;color:var(--text-3)">
              <i class="pi pi-file" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
              <div style="font-size:.88rem;font-weight:600">No bills found</div>
            </div>
          } @else {
            @for (bill of bills(); track bill.id) {
              <div class="bill-card" (click)="router.navigate(['/bills', bill.id])">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem">
                  <div style="display:flex;align-items:center;gap:.5rem">
                    <div style="width:2rem;height:2rem;border-radius:8px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <i class="pi pi-receipt" style="font-size:.72rem;color:var(--primary)"></i>
                    </div>
                    <strong style="font-size:.85rem;color:var(--text-1)">{{ bill.bill_number }}</strong>
                  </div>
                  <strong style="font-size:.95rem;color:var(--primary)">₹{{ bill.total_amount }}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-left:2.5rem;margin-bottom:.25rem">
                  <span style="font-size:.78rem;color:var(--text-2)">{{ bill.customer?.name }} · {{ bill.items?.length }} item(s)</span>
                  <button (click)="$event.stopPropagation(); sendWhatsApp(bill)"
                    style="border:none;background:var(--success-bg);color:var(--success);border-radius:7px;padding:.2rem .5rem;font-size:.68rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:.25rem">
                    <i class="pi pi-whatsapp" style="font-size:.7rem"></i>
                  </button>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-left:2.5rem">
                  <span style="font-size:.72rem;color:var(--text-3)">{{ bill.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                  @if (bill.created_by) {
                    <span style="font-size:.72rem;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:.25rem">
                      <i class="pi pi-user" style="font-size:.65rem"></i> {{ bill.created_by }}
                    </span>
                  }
                </div>
              </div>
            }
          }
        </p-tabpanel>

        <!-- ORDERS TAB -->
        <p-tabpanel value="active">
          @if (loadingDrafts()) {
            @for (_ of [1,2,3]; track $index) {
              <div class="bill-card" style="cursor:default">
                <div class="skeleton" style="height:.85rem;width:40%;margin-bottom:.4rem"></div>
                <div class="skeleton" style="height:.72rem;width:60%"></div>
              </div>
            }
          } @else if (drafts().length === 0) {
            <div style="text-align:center;padding:2.5rem;color:var(--text-3)">
              <i class="pi pi-inbox" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
              <div style="font-size:.88rem;font-weight:600">No active orders</div>
            </div>
          } @else {
            @for (bill of drafts(); track bill.id) {
              <div class="bill-card" [style.border-left]="'3px solid ' + statusCfg(bill.status).dot"
                (click)="router.navigate(['/bills', bill.id])">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.4rem">
                  <div>
                    <div style="display:flex;align-items:center;gap:.4rem">
                      <strong style="font-size:.85rem;color:var(--text-1)">{{ bill.bill_number }}</strong>
                      <span style="font-size:.68rem;font-weight:700;padding:.15rem .45rem;border-radius:99px"
                        [style.background]="statusCfg(bill.status).bg"
                        [style.color]="statusCfg(bill.status).color">
                        {{ statusCfg(bill.status).label }}
                      </span>
                    </div>
                    @if (bill.table_name) {
                      <div style="font-size:.72rem;color:var(--text-3);margin-top:.15rem">
                        <i class="pi pi-table" style="font-size:.65rem"></i> {{ bill.table_name }}
                        · {{ bill.items?.length }} item(s) · {{ bill.created_at | date:'HH:mm' }}
                      </div>
                    }
                  </div>
                  <strong style="font-size:.9rem;color:var(--primary);flex-shrink:0">₹{{ bill.total_amount }}</strong>
                </div>

                <!-- Inline quick-action buttons — stop propagation so tap goes to right action -->
                <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.5rem" (click)="$event.stopPropagation()">
                  @if (['pending','preparing'].includes(bill.status)) {
                    <button (click)="router.navigate(['/bills', bill.id, 'edit'])"
                      style="border:none;background:var(--primary-light);color:var(--primary);border-radius:8px;padding:.4rem .65rem;font-size:.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:.25rem">
                      <i class="pi pi-pencil"></i> Edit
                    </button>
                  }
                  @if (bill.status === 'pending') {
                    <button (click)="changeStatus(bill,'preparing')"
                      style="flex:1;border:none;background:#FFF7ED;color:#C2410C;border-radius:8px;padding:.4rem .5rem;font-size:.75rem;font-weight:700;cursor:pointer">
                      <i class="pi pi-fire"></i> Preparing
                    </button>
                    <button (click)="changeStatus(bill,'cancelled')"
                      style="border:none;background:var(--danger-bg);color:var(--danger);border-radius:8px;padding:.4rem .65rem;font-size:.75rem;cursor:pointer">
                      <i class="pi pi-times"></i>
                    </button>
                  }
                  @if (bill.status === 'preparing') {
                    <button (click)="changeStatus(bill,'ready')"
                      style="flex:1;border:none;background:#F0FDF4;color:#15803D;border-radius:8px;padding:.4rem .5rem;font-size:.75rem;font-weight:700;cursor:pointer">
                      <i class="pi pi-check"></i> Ready
                    </button>
                  }
                  @if (bill.status === 'ready') {
                    <button (click)="changeStatus(bill,'served')"
                      style="flex:1;border:none;background:#EEF0FF;color:#4338CA;border-radius:8px;padding:.4rem .5rem;font-size:.75rem;font-weight:700;cursor:pointer">
                      <i class="pi pi-send"></i> Served
                    </button>
                  }
                  @if (bill.status === 'served') {
                    <button (click)="router.navigate(['/bills', bill.id, 'finalize'])"
                      style="flex:1;border:none;background:var(--primary);color:#fff;border-radius:8px;padding:.4rem .5rem;font-size:.75rem;font-weight:700;cursor:pointer">
                      <i class="pi pi-wallet"></i> Collect Payment
                    </button>
                  }
                </div>
              </div>
            }
          }
        </p-tabpanel>
      </p-tabpanels>
    </p-tabs>
  `
})
export class BillHistoryComponent implements OnInit {
  router = inject(Router);
  private api = inject(ApiService);
  private msg = inject(MessageService);

  bills         = signal<any[]>([]);
  loading       = signal(true);
  drafts        = signal<any[]>([]);
  loadingDrafts = signal(false);
  activeTab     = 'paid';
  filterDate: Date | null = null;
  filters = { bill_number: '', customer_name: '', mobile: '', date: '' };

  readonly STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    pending:   { label: 'Pending',   bg: '#FFF7ED', color: '#C2410C', dot: '#FB923C' },
    preparing: { label: 'Preparing', bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
    ready:     { label: 'Ready',     bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
    served:    { label: 'Served',    bg: '#EEF0FF', color: '#4338CA', dot: '#6C63FF' },
    paid:      { label: 'Paid',      bg: '#EDFDF5', color: '#15803D', dot: '#22C55E' },
    cancelled: { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  };
  statusCfg(s: string) { return this.STATUS_CFG[s] ?? this.STATUS_CFG['pending']; }

  ngOnInit() { this.search(); this.loadDrafts(); }

  onTabChange(tab: any) { if (tab === 'active') this.loadDrafts(); }

  search() {
    this.loading.set(true);
    this.api.getBills({ ...this.filters, status: 'paid' }).subscribe({
      next: v => { this.bills.set(v); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  clearFilters() {
    this.filters = { bill_number: '', customer_name: '', mobile: '', date: '' };
    this.filterDate = null;
    this.search();
  }

  loadDrafts() {
    this.loadingDrafts.set(true);
    this.api.getBills({ status: 'pending,preparing,ready,served' }).subscribe({
      next: v => { this.drafts.set(v); this.loadingDrafts.set(false); },
      error: () => this.loadingDrafts.set(false)
    });
  }

  changeStatus(bill: any, status: string) {
    this.api.updateBillStatus(bill.id, status).subscribe({
      next: updated => {
        this.drafts.update(list => list.map(b => b.id === updated.id ? updated : b));
        if (status === 'cancelled') this.drafts.update(list => list.filter(b => b.id !== bill.id));
        this.msg.add({ severity: 'success', summary: 'Updated', detail: `Order → ${this.statusCfg(status).label}` });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Status update failed' })
    });
  }

  sendWhatsApp(bill: any) {
    this.api.getBillWhatsApp(bill.id).subscribe(text => {
      window.open(`https://wa.me/91${bill.customer?.mobile?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    });
  }
}
