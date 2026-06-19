import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface CartItem {
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  gst_rate: number;
  quantity: number;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToastModule, DatePipe],
  providers: [MessageService],
  template: `
    <p-toast />

    @if (!billCreated()) {
      <div class="page-header"><h2>New Bill</h2></div>

      <!-- Customer -->
      <div class="mob-section">
        <div class="mob-section-title">Customer</div>
        <div class="field" style="margin-bottom:.75rem">
          <label>Mobile *</label>
          <div style="display:flex;gap:.5rem">
            <input pInputText [(ngModel)]="mobile" placeholder="10-digit mobile"
              maxlength="10" (blur)="lookupCustomer()" style="flex:1;min-width:0" />
            <button (click)="lookupCustomer()"
              style="border:none;background:var(--primary-light);color:var(--primary);border-radius:var(--radius-sm);width:2.6rem;cursor:pointer;font-size:.9rem;flex-shrink:0">
              <i class="pi pi-search"></i>
            </button>
          </div>
          @if (customerFound()) {
            <div style="margin-top:.4rem;display:flex;align-items:center;gap:.35rem;font-size:.75rem;color:var(--success);font-weight:600">
              <i class="pi pi-check-circle"></i> Existing customer
            </div>
          }
        </div>
        <div class="field">
          <label>Name *</label>
          <input pInputText [(ngModel)]="customerName" placeholder="Customer name" style="width:100%" />
        </div>
      </div>

      <!-- Item picker -->
      <div class="mob-section">
        <div class="mob-section-title">Add Item</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.6rem">
          <div class="field" style="margin-bottom:0">
            <label>Category</label>
            <p-select [(ngModel)]="selectedCategory" [options]="categoryOptions()"
              placeholder="All" (onChange)="filterMenuItems()" styleClass="w-full" />
          </div>
          <div class="field" style="margin-bottom:0">
            <label>Qty</label>
            <p-inputNumber [(ngModel)]="qty" [min]="1" [max]="99" styleClass="w-full" />
          </div>
        </div>
        <div class="field" style="margin-bottom:.75rem">
          <label>Item</label>
          <p-select [(ngModel)]="selectedMenuItem" [options]="filteredMenu()"
            optionLabel="name" placeholder="Select item" [filter]="true" filterBy="name" styleClass="w-full">
            <ng-template let-item pTemplate="item">
              <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
                <span style="font-weight:600">{{ item.name }}</span>
                <span style="font-size:.8rem;color:var(--primary);font-weight:700">
                  ₹{{ item.price }} <span style="color:var(--text-3);font-weight:400">+{{ item.gst }}%</span>
                </span>
              </div>
            </ng-template>
          </p-select>
        </div>
        <p-button label="Add to Bill" icon="pi pi-plus" styleClass="w-full"
          (onClick)="addItem()" [disabled]="!selectedMenuItem" />
      </div>

      <!-- Cart -->
      @if (cart().length > 0) {
        <div class="mob-section">
          <div class="mob-section-title" style="margin-bottom:.5rem">
            Bill Items
            <span style="float:right;color:var(--primary);font-size:.7rem;cursor:pointer" (click)="clearBill()">Clear all</span>
          </div>
          @for (item of cart(); track item.menu_item_id; let i = $index) {
            <div class="cart-item">
              <div style="flex:1;min-width:0">
                <div style="font-size:.88rem;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {{ item.item_name }}
                </div>
                <div style="font-size:.72rem;color:var(--text-3);margin-top:.1rem">
                  ₹{{ item.unit_price }} + {{ item.gst_rate }}% GST
                  = <span style="color:var(--primary);font-weight:700">₹{{ itemTotal(item) }}</span>
                </div>
              </div>
              <div class="qty-ctrl">
                <button (click)="changeQty(i,-1)"><i class="pi pi-minus" style="font-size:.65rem"></i></button>
                <span>{{ item.quantity }}</span>
                <button (click)="changeQty(i, 1)"><i class="pi pi-plus" style="font-size:.65rem"></i></button>
              </div>
              <button (click)="removeItem(i)"
                style="border:none;background:none;color:var(--danger);cursor:pointer;padding:.25rem;font-size:.95rem;flex-shrink:0">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          }
        </div>

        <div class="total-bar">
          <div class="total-row">
            <span style="color:var(--text-2)">Subtotal</span>
            <span style="font-weight:600">₹{{ subtotal() }}</span>
          </div>
          <div class="total-row">
            <span style="color:var(--text-3)">GST</span>
            <span style="color:var(--text-3)">₹{{ gstTotal() }}</span>
          </div>
          <div class="total-row grand">
            <span>Total</span>
            <span style="color:var(--primary)">₹{{ grandTotal() }}</span>
          </div>
        </div>

        <p-button label="Create Bill" icon="pi pi-check" severity="success" styleClass="w-full"
          style="display:block;margin-top:.75rem"
          [loading]="saving()" (onClick)="createBill()" />
      } @else {
        <div style="text-align:center;padding:2rem;color:var(--text-3)">
          <div style="width:4rem;height:4rem;border-radius:20px;background:var(--surface-3);display:flex;align-items:center;justify-content:center;margin:0 auto .75rem">
            <i class="pi pi-shopping-cart" style="font-size:1.6rem;color:var(--text-3)"></i>
          </div>
          <div style="font-size:.88rem;font-weight:600">No items added yet</div>
          <div style="font-size:.78rem;margin-top:.25rem">Select a category and item above</div>
        </div>
      }
    }

    @if (billCreated()) {
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:.5rem">
          <div style="width:2rem;height:2rem;border-radius:50%;background:var(--success-bg);display:flex;align-items:center;justify-content:center">
            <i class="pi pi-check" style="font-size:.8rem;color:var(--success)"></i>
          </div>
          <h2 style="color:var(--success)">Bill Created!</h2>
        </div>
        <button class="fab" style="background:var(--surface-3);color:var(--primary);box-shadow:none" (click)="newBill()">
          <i class="pi pi-plus"></i>
        </button>
      </div>

      <div class="bill-receipt">
        <div class="receipt-header">
          <div style="width:3.5rem;height:3.5rem;border-radius:16px;background:linear-gradient(135deg,#FFD84D,#FF9F43);display:flex;align-items:center;justify-content:center;margin:0 auto .75rem;box-shadow:0 6px 16px rgba(255,216,77,.35)">
            <i class="pi pi-coffee" style="font-size:1.4rem;color:#fff"></i>
          </div>
          <div class="receipt-title">Burfi Billing</div>
          <div style="color:var(--text-3);font-size:.78rem;margin-top:.2rem">
            {{ createdBill()?.created_at | date:'dd/MM/yyyy HH:mm' }}
          </div>
        </div>

        <hr class="receipt-divider" />
        <div class="receipt-row"><span style="color:var(--text-2)">Bill No</span><strong>{{ createdBill()?.bill_number }}</strong></div>
        <div class="receipt-row"><span style="color:var(--text-2)">Customer</span><span>{{ createdBill()?.customer?.name }}</span></div>
        <div class="receipt-row"><span style="color:var(--text-2)">Mobile</span><span>{{ createdBill()?.customer?.mobile }}</span></div>
        @if (createdBill()?.created_by) {
          <div class="receipt-row">
            <span style="color:var(--text-2)">Billed by</span>
            <span style="font-weight:700;color:var(--primary)">
              <i class="pi pi-user" style="font-size:.72rem;margin-right:.2rem"></i>{{ createdBill()?.created_by }}
            </span>
          </div>
        }

        <hr class="receipt-divider" />
        @for (item of createdBill()?.items; track item.id) {
          <div class="receipt-row">
            <span>{{ item.item_name }} ×{{ item.quantity }}</span>
            <span style="font-weight:600">₹{{ item.subtotal }}</span>
          </div>
        }

        <hr class="receipt-divider" />
        <div class="receipt-row"><span style="color:var(--text-2)">Subtotal</span><span>₹{{ createdBillSubtotal() }}</span></div>
        <div class="receipt-row"><span style="color:var(--text-3)">GST</span><span style="color:var(--text-3)">₹{{ createdBill()?.gst_amount }}</span></div>
        <div class="receipt-row receipt-total" style="margin-top:.25rem">
          <span>Total</span>
          <strong style="color:var(--primary);font-size:1.15rem">₹{{ createdBill()?.total_amount }}</strong>
        </div>

        <hr class="receipt-divider" />
        <div style="display:flex;gap:.5rem;margin-top:.25rem">
          <p-button label="WhatsApp" icon="pi pi-whatsapp" severity="success" styleClass="flex-1"
            (onClick)="sendWhatsApp()" />
          <p-button label="New Bill" icon="pi pi-plus" [outlined]="true" styleClass="flex-1"
            (onClick)="newBill()" />
        </div>
      </div>
    }
  `
})
export class BillingComponent implements OnInit {
  private api = inject(ApiService);
  private msg = inject(MessageService);

  mobile = '';
  customerName = '';
  customerFound = signal(false);
  cart = signal<CartItem[]>([]);
  menuItems = signal<any[]>([]);
  filteredMenu = signal<any[]>([]);
  selectedMenuItem: any = null;
  selectedCategory = '';
  categoryOptions = signal<string[]>([]);
  qty = 1;
  saving = signal(false);
  billCreated = signal(false);
  createdBill = signal<any>(null);

  subtotal = computed(() =>
    parseFloat(this.cart().reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2))
  );
  gstTotal = computed(() =>
    parseFloat(this.cart().reduce((s, i) => s + i.quantity * i.unit_price * i.gst_rate / 100, 0).toFixed(2))
  );
  grandTotal = computed(() =>
    parseFloat((this.subtotal() + this.gstTotal()).toFixed(2))
  );
  createdBillSubtotal = computed(() => {
    const b = this.createdBill();
    if (!b?.items) return '0.00';
    return b.items.reduce((s: number, i: any) => s + Number(i.subtotal), 0).toFixed(2);
  });

  itemTotal(item: CartItem): number {
    const sub = item.quantity * item.unit_price;
    return parseFloat((sub + sub * item.gst_rate / 100).toFixed(2));
  }

  ngOnInit() {
    // Pre-fill customer if navigated from Customers page
    const customer = history.state?.customer;
    if (customer) {
      this.mobile = customer.mobile ?? '';
      this.customerName = customer.name ?? '';
      this.customerFound.set(true);
    }

    this.api.getMenuItems().subscribe(items => {
      this.menuItems.set(items);
      this.filteredMenu.set(items);
      const cats = [...new Set(items.map((i: any) => i.category))];
      this.categoryOptions.set(['', ...cats]);
    });
  }

  lookupCustomer() {
    if (this.mobile.length >= 10) {
      this.api.lookupCustomer(this.mobile).subscribe({
        next: c => { if (c) { this.customerName = c.name; this.customerFound.set(true); } else { this.customerFound.set(false); } },
        error: () => this.customerFound.set(false)
      });
    }
  }

  filterMenuItems() {
    this.filteredMenu.set(this.selectedCategory
      ? this.menuItems().filter(i => i.category === this.selectedCategory)
      : this.menuItems()
    );
    this.selectedMenuItem = null;
  }

  addItem() {
    if (!this.selectedMenuItem) return;
    const current = [...this.cart()];
    const existing = current.find(i => i.menu_item_id === this.selectedMenuItem.id);
    if (existing) { existing.quantity += this.qty; }
    else {
      current.push({
        menu_item_id: this.selectedMenuItem.id,
        item_name: this.selectedMenuItem.name,
        unit_price: this.selectedMenuItem.price,
        gst_rate: this.selectedMenuItem.gst ?? 0,
        quantity: this.qty
      });
    }
    this.cart.set(current);
    this.selectedMenuItem = null;
    this.qty = 1;
  }

  changeQty(index: number, delta: number) {
    const c = [...this.cart()];
    c[index] = { ...c[index], quantity: Math.max(1, c[index].quantity + delta) };
    this.cart.set(c);
  }

  removeItem(index: number) { this.cart.set(this.cart().filter((_, i) => i !== index)); }

  clearBill() { this.cart.set([]); this.mobile = ''; this.customerName = ''; this.customerFound.set(false); }

  createBill() {
    if (!this.mobile || !this.customerName) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Customer details are required' }); return;
    }
    if (this.cart().length === 0) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Add at least one item' }); return;
    }
    this.saving.set(true);
    this.api.createBill({
      customer_name: this.customerName,
      customer_mobile: this.mobile,
      items: this.cart().map(i => ({
        menu_item_id: i.menu_item_id, item_name: i.item_name,
        unit_price: i.unit_price, gst_rate: i.gst_rate, quantity: i.quantity
      }))
    }).subscribe({
      next: bill => { this.createdBill.set(bill); this.billCreated.set(true); this.saving.set(false); },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to create bill' }); this.saving.set(false); }
    });
  }

  sendWhatsApp() {
    const bill = this.createdBill();
    if (!bill) return;
    this.api.getBillWhatsApp(bill.id).subscribe(text => {
      window.open(`https://wa.me/91${bill.customer.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    });
  }

  newBill() { this.billCreated.set(false); this.createdBill.set(null); this.clearBill(); }
}
