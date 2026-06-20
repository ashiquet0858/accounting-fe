import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-bill-edit',
  standalone: true,
  imports: [FormsModule, InputNumberModule, SelectModule, ButtonModule, ToastModule],
  providers: [MessageService],
  styles: [`
    .back-btn {
      display:flex; align-items:center; gap:.5rem;
      background:none; border:none; cursor:pointer;
      font-size:.9rem; font-weight:700; color:var(--text-2);
      padding:0; margin-bottom:1.25rem;
    }
    .cart-item {
      display:flex; align-items:center; gap:.6rem;
      padding:.65rem 0; border-bottom:1px solid var(--border);
      &:last-child { border-bottom:none; }
    }
    .qty-ctrl {
      display:flex; align-items:center;
      background:var(--primary-light); border-radius:8px; overflow:hidden; flex-shrink:0;
      button {
        border:none; background:none; width:2rem; height:2rem; font-size:.8rem;
        cursor:pointer; color:var(--primary); display:flex; align-items:center; justify-content:center;
        &:active { background:rgba(108,99,255,.15); }
      }
      span { min-width:1.6rem; text-align:center; font-weight:800; font-size:.88rem; }
    }
  `],
  template: `
    <p-toast />

    <button class="back-btn" (click)="back()">
      <i class="pi pi-arrow-left" style="font-size:.85rem"></i> Back
    </button>

    <div class="page-header"><h2>Edit Order</h2></div>

    @if (loading()) {
      <div class="skeleton" style="height:8rem;border-radius:16px"></div>
    } @else {
      <!-- Order info -->
      <div style="background:var(--primary-light);border-radius:12px;padding:.65rem .875rem;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="pi pi-receipt" style="color:var(--primary)"></i>
        <span style="font-size:.85rem;font-weight:700;color:var(--primary)">{{ bill()?.bill_number }}</span>
        @if (bill()?.table_name) {
          <span style="font-size:.8rem;color:var(--primary);margin-left:auto">
            <i class="pi pi-table" style="font-size:.75rem"></i> {{ bill()?.table_name }}
          </span>
        }
      </div>

      <!-- Add item -->
      <div class="mob-section" style="margin-bottom:.75rem">
        <div class="mob-section-title">Add Item</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.5rem">
          <div class="field" style="margin-bottom:0">
            <label>Category</label>
            <p-select [(ngModel)]="selectedCat" [options]="catOptions()"
              placeholder="All" (onChange)="filterMenu()" styleClass="w-full" />
          </div>
          <div class="field" style="margin-bottom:0">
            <label>Qty</label>
            <p-inputNumber [(ngModel)]="qty" [min]="1" [max]="99" styleClass="w-full" />
          </div>
        </div>
        <div style="margin-bottom:.75rem">
          <p-select [(ngModel)]="selectedItem" [options]="filteredMenu()"
            optionLabel="name" placeholder="Select item" [filter]="true" filterBy="name" styleClass="w-full">
            <ng-template let-item pTemplate="item">
              <div style="display:flex;justify-content:space-between;width:100%">
                <span style="font-weight:600">{{ item.name }}</span>
                <span style="font-size:.8rem;color:var(--primary)">₹{{ item.price }}</span>
              </div>
            </ng-template>
          </p-select>
        </div>
        <p-button label="Add to Order" icon="pi pi-plus" styleClass="w-full" severity="secondary"
          [disabled]="!selectedItem" (onClick)="addItem()" />
      </div>

      <!-- Cart -->
      @if (cart().length > 0) {
        <div class="mob-section" style="margin-bottom:.75rem">
          <div class="mob-section-title">Order Items</div>
          @for (item of cart(); track item.menu_item_id; let i = $index) {
            <div class="cart-item">
              <div style="flex:1;min-width:0">
                <div style="font-size:.88rem;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {{ item.item_name }}
                </div>
                <div style="font-size:.72rem;color:var(--text-3);margin-top:.1rem">
                  ₹{{ item.unit_price }} + {{ item.gst_rate }}% GST
                </div>
              </div>
              <div class="qty-ctrl">
                <button (click)="changeQty(i,-1)"><i class="pi pi-minus" style="font-size:.65rem"></i></button>
                <span>{{ item.quantity }}</span>
                <button (click)="changeQty(i, 1)"><i class="pi pi-plus" style="font-size:.65rem"></i></button>
              </div>
              <button (click)="remove(i)"
                style="border:none;background:var(--danger-bg);color:var(--danger);border-radius:8px;width:2rem;height:2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="pi pi-trash" style="font-size:.8rem"></i>
              </button>
            </div>
          }
        </div>

        <!-- Total bar -->
        <div class="total-bar" style="margin-bottom:1rem">
          <div class="total-row"><span style="color:var(--text-2)">Subtotal</span><span style="font-weight:600">₹{{ subtotal() }}</span></div>
          <div class="total-row grand"><span>Total</span><span style="color:var(--primary)">₹{{ total() }}</span></div>
        </div>

        <p-button label="Save Changes" icon="pi pi-check" severity="success" styleClass="w-full"
          [loading]="saving()" (onClick)="save()" />
      } @else {
        <div style="text-align:center;padding:2rem;color:var(--text-3)">
          <i class="pi pi-shopping-cart" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
          <div style="font-size:.9rem;font-weight:600">No items — add some above</div>
        </div>
      }
    }
  `
})
export class BillEditComponent implements OnInit {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private api    = inject(ApiService);
  private msg    = inject(MessageService);

  bill         = signal<any>(null);
  loading      = signal(true);
  saving       = signal(false);
  cart         = signal<any[]>([]);
  menuAll: any[] = [];
  filteredMenu = signal<any[]>([]);
  catOptions   = signal<string[]>([]);
  selectedCat  = '';
  selectedItem: any = null;
  qty = 1;

  subtotal() { return this.cart().reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2); }
  total()    { return this.cart().reduce((s, i) => { const sub = i.quantity * i.unit_price; return s + sub + sub * i.gst_rate / 100; }, 0).toFixed(2); }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.api.getBill(id).subscribe({
      next: b => {
        this.bill.set(b);
        this.cart.set(b.items.map((i: any) => ({
          menu_item_id: i.menu_item_id, item_name: i.item_name,
          unit_price: parseFloat(i.unit_price), gst_rate: parseFloat(i.gst_rate ?? 0), quantity: i.quantity,
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.getMenuItems().subscribe(items => {
      this.menuAll = items;
      const cats = [...new Set(items.map((i: any) => i.category))];
      this.catOptions.set(['', ...cats]);
      this.filteredMenu.set(items);
    });
  }

  back() { window.history.back(); }

  filterMenu() {
    this.filteredMenu.set(this.selectedCat ? this.menuAll.filter(i => i.category === this.selectedCat) : [...this.menuAll]);
    this.selectedItem = null;
  }

  addItem() {
    if (!this.selectedItem) return;
    const c = [...this.cart()];
    const ex = c.find(i => i.menu_item_id === this.selectedItem.id);
    if (ex) { ex.quantity += this.qty; }
    else { c.push({ menu_item_id: this.selectedItem.id, item_name: this.selectedItem.name, unit_price: this.selectedItem.price, gst_rate: this.selectedItem.gst ?? 0, quantity: this.qty }); }
    this.cart.set(c);
    this.selectedItem = null; this.qty = 1;
  }

  changeQty(i: number, d: number) {
    const c = [...this.cart()];
    c[i] = { ...c[i], quantity: Math.max(1, c[i].quantity + d) };
    this.cart.set(c);
  }

  remove(i: number) { this.cart.set(this.cart().filter((_, idx) => idx !== i)); }

  save() {
    if (!this.cart().length) return;
    this.saving.set(true);
    this.api.updateBillItems(this.bill()!.id, this.cart().map(i => ({
      menu_item_id: i.menu_item_id, item_name: i.item_name,
      unit_price: i.unit_price, gst_rate: i.gst_rate, quantity: i.quantity,
    }))).subscribe({
      next: bill => {
        this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Order updated' });
        setTimeout(() => this.router.navigate(['/bills', bill.id]), 600);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to update' }); this.saving.set(false); }
    });
  }
}
