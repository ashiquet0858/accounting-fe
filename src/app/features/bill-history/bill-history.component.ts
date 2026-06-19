import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-bill-history',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, DatePickerModule, DialogModule, ToastModule, DatePipe],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-header"><h2>Bill History</h2></div>

    <!-- Filters -->
    <div class="m-card" style="padding:.875rem">
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

    <!-- Bill Cards -->
    @if (loading()) {
      @for (_ of [1,2,3,4]; track $index) {
        <div class="bill-card" style="cursor:default">
          <div style="display:flex;justify-content:space-between;margin-bottom:.4rem">
            <div class="skeleton" style="height:.85rem;width:40%"></div>
            <div class="skeleton" style="height:.85rem;width:20%"></div>
          </div>
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
        <div class="bill-card" (click)="viewBill(bill)">
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

    <!-- Detail Dialog -->
    <p-dialog [(visible)]="detailVisible" header="Receipt" [modal]="true"
      [style]="{width:'95vw','max-width':'420px'}" [draggable]="false">
      @if (selectedBill()) {
        <div class="bill-receipt">
          <div class="receipt-header">
            <div style="width:3rem;height:3rem;border-radius:14px;background:linear-gradient(135deg,#FFD84D,#FF9F43);display:flex;align-items:center;justify-content:center;margin:0 auto .75rem;box-shadow:0 4px 12px rgba(255,216,77,.4)">
              <i class="pi pi-coffee" style="font-size:1.25rem;color:#fff"></i>
            </div>
            <div class="receipt-title">Burfi Billing</div>
            <div style="color:var(--text-3);font-size:.78rem;margin-top:.2rem">
              {{ selectedBill().created_at | date:'dd/MM/yyyy HH:mm' }}
            </div>
          </div>

          <hr class="receipt-divider" />
          <div class="receipt-row"><span style="color:var(--text-2)">Bill No</span><strong>{{ selectedBill().bill_number }}</strong></div>
          @if (selectedBill().created_by) {
            <div class="receipt-row">
              <span style="color:var(--text-2)">Billed by</span>
              <span style="font-weight:700;color:var(--primary)">
                <i class="pi pi-user" style="font-size:.72rem;margin-right:.2rem"></i>{{ selectedBill().created_by }}
              </span>
            </div>
          }
          <div class="receipt-row"><span style="color:var(--text-2)">Customer</span><span>{{ selectedBill().customer?.name }}</span></div>
          <div class="receipt-row"><span style="color:var(--text-2)">Mobile</span><span>{{ selectedBill().customer?.mobile }}</span></div>

          <hr class="receipt-divider" />
          @for (item of selectedBill().items; track item.id) {
            <div class="receipt-row">
              <span>{{ item.item_name }} ×{{ item.quantity }} <span style="color:var(--text-3);font-size:.78rem">&#64; ₹{{ item.unit_price }}</span></span>
              <span style="font-weight:600">₹{{ item.subtotal }}</span>
            </div>
          }

          <hr class="receipt-divider" />
          <div class="receipt-row"><span style="color:var(--text-2)">Subtotal</span><span>₹{{ billSubtotal() }}</span></div>
          <div class="receipt-row"><span style="color:var(--text-3)">GST</span><span style="color:var(--text-3)">₹{{ selectedBill().gst_amount }}</span></div>
          <div class="receipt-row receipt-total" style="margin-top:.25rem">
            <span>Total</span>
            <strong style="color:var(--primary);font-size:1.1rem">₹{{ selectedBill().total_amount }}</strong>
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <div style="display:flex;gap:.5rem;width:100%">
          <p-button label="WhatsApp" icon="pi pi-whatsapp" severity="success" styleClass="flex-1"
            (onClick)="sendWhatsApp(selectedBill())" />
          <p-button label="Close" [outlined]="true" styleClass="flex-1" (onClick)="detailVisible=false" />
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class BillHistoryComponent implements OnInit {
  private api = inject(ApiService);
  private msg = inject(MessageService);

  bills = signal<any[]>([]);
  loading = signal(true);
  detailVisible = false;
  selectedBill = signal<any>(null);
  filterDate: Date | null = null;
  filters = { bill_number: '', customer_name: '', mobile: '', date: '' };

  billSubtotal(): string {
    const b = this.selectedBill();
    if (!b?.items) return '0.00';
    return b.items.reduce((s: number, i: any) => s + Number(i.subtotal), 0).toFixed(2);
  }

  ngOnInit() { this.search(); }

  search() {
    this.loading.set(true);
    this.api.getBills(this.filters).subscribe({
      next: v => { this.bills.set(v); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  clearFilters() {
    this.filters = { bill_number: '', customer_name: '', mobile: '', date: '' };
    this.filterDate = null;
    this.search();
  }

  viewBill(bill: any) {
    this.api.getBill(bill.id).subscribe(b => { this.selectedBill.set(b); this.detailVisible = true; });
  }

  sendWhatsApp(bill: any) {
    if (!bill) return;
    this.api.getBillWhatsApp(bill.id).subscribe(text => {
      window.open(`https://wa.me/91${bill.customer?.mobile?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    });
  }
}
