import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-bill-finalize',
  standalone: true,
  imports: [FormsModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  styles: [`
    .back-btn {
      display:flex; align-items:center; gap:.5rem;
      background:none; border:none; cursor:pointer;
      font-size:.9rem; font-weight:700; color:var(--text-2);
      padding:0; margin-bottom:1.25rem;
    }
  `],
  template: `
    <p-toast />

    <button class="back-btn" (click)="back()">
      <i class="pi pi-arrow-left" style="font-size:.85rem"></i> Back
    </button>

    <div class="page-header"><h2>Collect Payment</h2></div>

    @if (loading()) {
      <div class="skeleton" style="height:6rem;border-radius:16px;margin-bottom:.75rem"></div>
    } @else if (bill()) {
      <!-- Order summary -->
      <div class="mob-section" style="margin-bottom:.75rem">
        <div class="mob-section-title">Order Summary</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
          <span style="font-size:.85rem;color:var(--text-2)">{{ bill()!.bill_number }}</span>
          @if (bill()!.table_name) {
            <span style="font-size:.8rem;font-weight:700;color:var(--primary)">
              <i class="pi pi-table" style="font-size:.7rem"></i> {{ bill()!.table_name }}
            </span>
          }
        </div>
        @for (item of bill()!.items; track item.id) {
          <div style="display:flex;justify-content:space-between;font-size:.82rem;padding:.25rem 0;border-bottom:1px solid var(--border)">
            <span>{{ item.item_name }} ×{{ item.quantity }}</span>
            <span style="font-weight:600">₹{{ item.subtotal }}</span>
          </div>
        }
        <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:800;margin-top:.5rem;color:var(--primary)">
          <span>Total</span><span>₹{{ bill()!.total_amount }}</span>
        </div>
      </div>

      <!-- Customer details -->
      <div class="mob-section" style="margin-bottom:1rem">
        <div class="mob-section-title">Customer Details</div>
        <div class="field" style="margin-bottom:.75rem">
          <label>Mobile *</label>
          <div style="display:flex;gap:.5rem">
            <input pInputText [(ngModel)]="mobile" placeholder="10-digit mobile"
              maxlength="10" (blur)="lookup()" style="flex:1;min-width:0" />
            <button (click)="lookup()"
              style="border:none;background:var(--primary-light);color:var(--primary);border-radius:var(--radius-sm);width:2.6rem;cursor:pointer;font-size:.9rem;flex-shrink:0">
              <i class="pi pi-search"></i>
            </button>
          </div>
          @if (customerFound()) {
            <div style="margin-top:.35rem;font-size:.75rem;color:var(--success);font-weight:600;display:flex;align-items:center;gap:.3rem">
              <i class="pi pi-check-circle"></i> Existing customer
            </div>
          }
        </div>
        <div class="field">
          <label>Name *</label>
          <input pInputText [(ngModel)]="name" placeholder="Customer name" style="width:100%" />
        </div>
      </div>

      <p-button label="Finalize &amp; Generate Receipt" icon="pi pi-check" severity="success"
        styleClass="w-full" [loading]="saving()" (onClick)="finalize()" />
    }
  `
})
export class BillFinalizeComponent implements OnInit {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private api    = inject(ApiService);
  private msg    = inject(MessageService);

  bill    = signal<any>(null);
  loading = signal(true);
  saving  = signal(false);
  customerFound = signal(false);
  mobile = '';
  name   = '';

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.api.getBill(id).subscribe({
      next: b  => { this.bill.set(b); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  back() { window.history.back(); }

  lookup() {
    if (this.mobile.length >= 10) {
      this.api.lookupCustomer(this.mobile).subscribe({
        next: c => { if (c) { this.name = c.name; this.customerFound.set(true); } else { this.customerFound.set(false); } },
        error: () => this.customerFound.set(false)
      });
    }
  }

  finalize() {
    if (!this.mobile || !this.name) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Enter customer name and mobile' });
      return;
    }
    this.saving.set(true);
    this.api.finalizeBill(this.bill()!.id, { customer_name: this.name, customer_mobile: this.mobile }).subscribe({
      next: bill => {
        this.msg.add({ severity: 'success', summary: 'Done', detail: `${bill.bill_number} finalized` });
        setTimeout(() => this.router.navigate(['/bills', bill.id]), 600);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to finalize' }); this.saving.set(false); }
    });
  }
}
