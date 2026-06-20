import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [DatePipe, ButtonModule, ToastModule],
  providers: [MessageService],
  styles: [`
    .back-btn {
      display:flex; align-items:center; gap:.5rem;
      background:none; border:none; cursor:pointer;
      font-size:.9rem; font-weight:700; color:var(--text-2);
      padding:0; margin-bottom:1.25rem;
      -webkit-tap-highlight-color:transparent;
    }
  `],
  template: `
    <p-toast />

    <button class="back-btn" (click)="back()">
      <i class="pi pi-arrow-left" style="font-size:.85rem"></i> Back
    </button>

    @if (loading()) {
      <div style="display:flex;flex-direction:column;gap:.75rem">
        @for (_ of [1,2,3,4]; track $index) {
          <div class="skeleton" style="height:3.5rem;border-radius:12px"></div>
        }
      </div>
    } @else if (bill()) {
      <div class="bill-receipt">
        <!-- Brand header -->
        <div class="receipt-header">
          <div style="width:3.5rem;height:3.5rem;border-radius:16px;background:linear-gradient(135deg,#FFD84D,#FF9F43);display:flex;align-items:center;justify-content:center;margin:0 auto .75rem;box-shadow:0 6px 16px rgba(255,216,77,.35)">
            <i class="pi pi-coffee" style="font-size:1.4rem;color:#fff"></i>
          </div>
          <div class="receipt-title">Burfi Billing</div>
          <div style="color:var(--text-3);font-size:.78rem;margin-top:.2rem">
            {{ bill()!.created_at | date:'dd/MM/yyyy HH:mm' }}
          </div>
        </div>

        <hr class="receipt-divider" />

        <!-- Info rows -->
        <div class="receipt-row"><span style="color:var(--text-2)">Bill No</span><strong>{{ bill()!.bill_number }}</strong></div>
        @if (bill()!.table_name) {
          <div class="receipt-row">
            <span style="color:var(--text-2)">Table</span>
            <span style="font-weight:700;color:var(--primary)">
              <i class="pi pi-table" style="font-size:.72rem;margin-right:.2rem"></i>{{ bill()!.table_name }}
            </span>
          </div>
        }
        @if (bill()!.customer?.name) {
          <div class="receipt-row"><span style="color:var(--text-2)">Customer</span><span>{{ bill()!.customer.name }}</span></div>
          <div class="receipt-row"><span style="color:var(--text-2)">Mobile</span><span>{{ bill()!.customer.mobile }}</span></div>
        }
        @if (bill()!.created_by) {
          <div class="receipt-row">
            <span style="color:var(--text-2)">Billed by</span>
            <span style="font-weight:700;color:var(--primary)">
              <i class="pi pi-user" style="font-size:.7rem;margin-right:.2rem"></i>{{ bill()!.created_by }}
            </span>
          </div>
        }

        <!-- Status chip -->
        <div class="receipt-row">
          <span style="color:var(--text-2)">Status</span>
          <span style="font-size:.75rem;font-weight:700;padding:.2rem .6rem;border-radius:99px"
            [style.background]="statusBg(bill()!.status)"
            [style.color]="statusColor(bill()!.status)">
            {{ statusLabel(bill()!.status) }}
          </span>
        </div>

        <hr class="receipt-divider" />

        <!-- Items -->
        @for (item of bill()!.items; track item.id) {
          <div class="receipt-row">
            <span>{{ item.item_name }} ×{{ item.quantity }}
              <span style="color:var(--text-3);font-size:.78rem"> &#64; ₹{{ item.unit_price }}</span>
            </span>
            <span style="font-weight:600">₹{{ item.subtotal }}</span>
          </div>
        }

        <hr class="receipt-divider" />

        <div class="receipt-row"><span style="color:var(--text-2)">Subtotal</span><span>₹{{ subtotal() }}</span></div>
        <div class="receipt-row"><span style="color:var(--text-3)">GST</span><span style="color:var(--text-3)">₹{{ bill()!.gst_amount }}</span></div>
        <div class="receipt-row receipt-total" style="margin-top:.25rem">
          <span>Total</span>
          <strong style="color:var(--primary);font-size:1.15rem">₹{{ bill()!.total_amount }}</strong>
        </div>

        <!-- Actions -->
        @if (bill()!.status === 'served') {
          <hr class="receipt-divider" style="margin-top:1rem" />
          <p-button label="Collect Payment" icon="pi pi-wallet" severity="success" styleClass="w-full"
            style="display:block;margin-top:.5rem"
            (onClick)="router.navigate(['/bills', bill()!.id, 'finalize'])" />
        }

        @if (bill()!.status === 'paid' && bill()!.customer) {
          <hr class="receipt-divider" style="margin-top:1rem" />
          <p-button label="Send on WhatsApp" icon="pi pi-whatsapp" severity="success" styleClass="w-full"
            style="display:block;margin-top:.5rem"
            (onClick)="sendWhatsApp()" />
        }
      </div>
    } @else {
      <div style="text-align:center;padding:3rem;color:var(--text-3)">
        <i class="pi pi-file" style="font-size:3rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
        <div style="font-weight:600">Bill not found</div>
      </div>
    }
  `
})
export class BillDetailComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private api   = inject(ApiService);
  private msg   = inject(MessageService);

  bill    = signal<any>(null);
  loading = signal(true);

  subtotal() {
    const b = this.bill();
    if (!b?.items) return '0.00';
    return b.items.reduce((s: number, i: any) => s + Number(i.subtotal), 0).toFixed(2);
  }

  private readonly STATUS: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: 'Pending',   bg: '#FFF7ED', color: '#C2410C' },
    preparing: { label: 'Preparing', bg: '#FFFBEB', color: '#B45309' },
    ready:     { label: 'Ready',     bg: '#F0FDF4', color: '#15803D' },
    served:    { label: 'Served',    bg: '#EEF0FF', color: '#4338CA' },
    paid:      { label: 'Paid',      bg: '#EDFDF5', color: '#15803D' },
    cancelled: { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626' },
  };
  statusLabel(s: string) { return this.STATUS[s]?.label ?? s; }
  statusBg(s: string)    { return this.STATUS[s]?.bg ?? '#F3F4F6'; }
  statusColor(s: string) { return this.STATUS[s]?.color ?? '#374151'; }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.api.getBill(id).subscribe({
      next: b  => { this.bill.set(b); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  back() { window.history.back(); }

  sendWhatsApp() {
    const b = this.bill();
    if (!b) return;
    this.api.getBillWhatsApp(b.id).subscribe(text => {
      window.open(`https://wa.me/91${b.customer?.mobile?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    });
  }
}
