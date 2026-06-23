import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  available: { label: 'Available', bg: '#EDFDF5', color: '#15803D', dot: '#22C55E' },
  occupied:  { label: 'Occupied',  bg: '#EEF0FF', color: '#4338CA', dot: '#6C63FF' },
  reserved:  { label: 'Reserved',  bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
};

const ORDER_STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pending',   bg: '#FFF7ED', color: '#C2410C' },
  preparing: { label: 'Preparing', bg: '#FFFBEB', color: '#B45309' },
  ready:     { label: 'Ready',     bg: '#F0FDF4', color: '#15803D' },
  served:    { label: 'Served',    bg: '#EEF0FF', color: '#4338CA' },
};

@Component({
  selector: 'app-table-detail',
  standalone: true,
  imports: [FormsModule, InputNumberModule, SelectModule, ButtonModule, ToastModule],
  providers: [MessageService],
  styles: [`
    .back-btn {
      display:flex; align-items:center; gap:.5rem;
      background:none; border:none; cursor:pointer;
      font-size:.9rem; font-weight:700; color:var(--text-2); padding:0; margin-bottom:1.25rem;
    }
    .status-btn {
      display:flex; align-items:center; gap:.6rem;
      padding:.75rem 1rem; border-radius:12px; border:1.5px solid;
      cursor:pointer; font-weight:600; font-size:.88rem; width:100%;
      transition:all .15s; &:active { transform:scale(.98); }
    }
    .status-dot { width:.55rem; height:.55rem; border-radius:50%; flex-shrink:0; }
    .order-action {
      flex:1; border:none; border-radius:8px; padding:.5rem;
      font-size:.78rem; font-weight:700; cursor:pointer;
    }
    .cart-item {
      display:flex; align-items:center; gap:.5rem;
      padding:.55rem 0; border-bottom:1px solid var(--border);
      &:last-child { border-bottom:none; }
    }
    .qty-ctrl {
      display:flex; align-items:center; background:var(--primary-light);
      border-radius:8px; overflow:hidden; flex-shrink:0;
      button {
        border:none; background:none; width:1.9rem; height:1.9rem;
        cursor:pointer; color:var(--primary); display:flex; align-items:center; justify-content:center;
      }
      span { min-width:1.4rem; text-align:center; font-size:.85rem; font-weight:800; }
    }
  `],
  template: `
    <p-toast />

    <button class="back-btn" (click)="router.navigate(['/tables'])">
      <i class="pi pi-arrow-left" style="font-size:.85rem"></i> Tables
    </button>

    @if (loading()) {
      <div class="skeleton" style="height:5rem;border-radius:16px"></div>
    } @else if (table()) {
      <!-- Table header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;color:var(--text-1)">{{ table()!.name }}</h2>
          <div style="font-size:.8rem;color:var(--text-3);margin-top:.15rem">
            <i class="pi pi-users" style="font-size:.7rem"></i> {{ table()!.capacity }} seats
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem">
          @if (isAdmin) {
            <button (click)="router.navigate(['/tables/edit', table()!.id])"
              style="border:none;background:var(--surface-3);color:var(--text-2);border-radius:10px;width:2.2rem;height:2.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">
              <i class="pi pi-pencil" style="font-size:.85rem"></i>
            </button>
          }
        </div>
      </div>

      <!-- Table status -->
      <div class="mob-section" style="margin-bottom:.75rem">
        <div class="mob-section-title">Table Status</div>
        <div style="display:flex;flex-direction:column;gap:.4rem">
          @for (s of statuses; track s.key) {
            <button class="status-btn"
              [style.border-color]="table()!.status === s.key ? s.cfg.dot : 'var(--border)'"
              [style.background]="table()!.status === s.key ? s.cfg.bg : 'var(--surface-2)'"
              [style.color]="table()!.status === s.key ? s.cfg.color : 'var(--text-2)'"
              (click)="changeTableStatus(s.key)">
              <div class="status-dot" [style.background]="s.cfg.dot"></div>
              {{ s.cfg.label }}
              @if (table()!.status === s.key) {
                <i class="pi pi-check" style="margin-left:auto;font-size:.8rem"></i>
              }
            </button>
          }
        </div>
      </div>

      <!-- Active order -->
      @if (activeOrder()) {
        <div class="mob-section" style="margin-bottom:.75rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
            <div class="mob-section-title" style="margin-bottom:0">Active Order</div>
            <div style="display:flex;align-items:center;gap:.4rem">
              <span style="font-size:.7rem;font-weight:700;padding:.15rem .5rem;border-radius:99px"
                [style.background]="orderStatusCfg(activeOrder()!.status).bg"
                [style.color]="orderStatusCfg(activeOrder()!.status).color">
                {{ orderStatusCfg(activeOrder()!.status).label }}
              </span>
              @if (['pending','preparing'].includes(activeOrder()!.status)) {
                <button (click)="router.navigate(['/bills', activeOrder()!.id, 'edit'])"
                  style="border:none;background:var(--primary-light);color:var(--primary);border-radius:8px;padding:.3rem .6rem;font-size:.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:.25rem">
                  <i class="pi pi-pencil"></i> Edit
                </button>
              }
            </div>
          </div>
          @for (item of activeOrder()!.items; track item.id) {
            <div style="display:flex;justify-content:space-between;font-size:.82rem;padding:.2rem 0;border-bottom:1px solid var(--border)">
              <span>{{ item.item_name }} ×{{ item.quantity }}</span>
              <span style="font-weight:600">₹{{ item.subtotal }}</span>
            </div>
          }
          <div style="font-size:.9rem;font-weight:800;color:var(--primary);text-align:right;margin-top:.4rem">
            Total ₹{{ activeOrder()!.total_amount }}
          </div>
          <!-- Order status actions -->
          <div style="display:flex;gap:.4rem;margin-top:.75rem">
            @if (activeOrder()!.status === 'pending') {
              <button class="order-action" (click)="setOrderStatus('preparing')"
                style="background:#FFF7ED;color:#C2410C">
                <i class="pi pi-fire"></i> Preparing
              </button>
              <button (click)="setOrderStatus('cancelled')"
                style="border:none;background:var(--danger-bg);color:var(--danger);border-radius:8px;padding:.5rem .75rem;font-size:.78rem;cursor:pointer">
                <i class="pi pi-times"></i>
              </button>
            }
            @if (activeOrder()!.status === 'preparing') {
              <button class="order-action" (click)="setOrderStatus('ready')"
                style="background:#F0FDF4;color:#15803D">
                <i class="pi pi-check"></i> Mark Ready
              </button>
            }
            @if (activeOrder()!.status === 'ready') {
              <button class="order-action" (click)="setOrderStatus('served')"
                style="background:#EEF0FF;color:#4338CA">
                <i class="pi pi-send"></i> Mark Served
              </button>
            }
            @if (activeOrder()!.status === 'served') {
              <button class="order-action"
                (click)="router.navigate(['/bills', activeOrder()!.id, 'finalize'])"
                style="background:var(--primary);color:#fff">
                <i class="pi pi-wallet"></i> Collect Payment
              </button>
            }
          </div>
        </div>
      } @else {
        <!-- New order form -->
        <div class="mob-section">
          <div class="mob-section-title">Take Order</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.5rem">
            <div class="field" style="margin-bottom:0">
              <label>Category</label>
              <p-select [(ngModel)]="selectedCat" [options]="catOptions()" placeholder="All"
                (onChange)="filterMenu()" styleClass="w-full" />
            </div>
            <div class="field" style="margin-bottom:0">
              <label>Qty</label>
              <p-inputNumber [(ngModel)]="qty" [min]="1" [max]="99" styleClass="w-full" />
            </div>
          </div>
          <div style="margin-bottom:.75rem">
            <p-select [(ngModel)]="selectedItem" [options]="filteredMenu()" optionLabel="name"
              placeholder="Select item" [filter]="true" filterBy="name" styleClass="w-full">
              <ng-template let-item pTemplate="item">
                <div style="display:flex;justify-content:space-between;width:100%">
                  <span style="font-weight:600">{{ item.name }}</span>
                  <span style="font-size:.8rem;color:var(--primary)">₹{{ item.price }}</span>
                </div>
              </ng-template>
            </p-select>
          </div>
          <p-button label="Add Item" icon="pi pi-plus" styleClass="w-full" severity="secondary"
            [disabled]="!selectedItem" (onClick)="addItem()" />

          @if (cart().length > 0) {
            <div style="margin-top:.875rem">
              <div class="mob-section-title" style="margin-bottom:.4rem">Items</div>
              @for (item of cart(); track item.menu_item_id; let i = $index) {
                <div class="cart-item">
                  <div style="flex:1;min-width:0">
                    <div style="font-size:.85rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ item.item_name }}</div>
                    <div style="font-size:.72rem;color:var(--text-3)">₹{{ item.unit_price }}</div>
                  </div>
                  <div class="qty-ctrl">
                    <button (click)="changeQty(i,-1)"><i class="pi pi-minus" style="font-size:.65rem"></i></button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="changeQty(i, 1)"><i class="pi pi-plus" style="font-size:.65rem"></i></button>
                  </div>
                  <button (click)="removeItem(i)"
                    style="border:none;background:var(--danger-bg);color:var(--danger);border-radius:8px;width:1.9rem;height:1.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="pi pi-trash" style="font-size:.75rem"></i>
                  </button>
                </div>
              }
              <div style="display:flex;justify-content:space-between;padding:.6rem 0 0;font-weight:800;font-size:.95rem">
                <span>Total</span>
                <span style="color:var(--primary)">₹{{ cartTotal() }}</span>
              </div>
              <p-button label="Send to Kitchen" icon="pi pi-send" severity="success" styleClass="w-full"
                style="display:block;margin-top:.875rem" [loading]="savingOrder()" (onClick)="placeOrder()" />
            </div>
          }
        </div>
      }
    }
  `
})
export class TableDetailComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private api   = inject(ApiService);
  private msg   = inject(MessageService);
  isAdmin = inject(AuthService).isAdmin();

  table       = signal<any>(null);
  activeOrder = signal<any>(null);
  loading     = signal(true);
  savingOrder = signal(false);

  menuAll: any[] = [];
  filteredMenu = signal<any[]>([]);
  catOptions   = signal<string[]>([]);
  selectedCat  = '';
  selectedItem: any = null;
  qty  = 1;
  cart = signal<any[]>([]);

  statuses = Object.entries(STATUS_CFG).map(([key, cfg]) => ({ key, cfg }));
  statusCfg(s: string)      { return STATUS_CFG[s] ?? STATUS_CFG['available']; }
  orderStatusCfg(s: string) { return ORDER_STATUS_CFG[s] ?? ORDER_STATUS_CFG['pending']; }
  cartTotal() { return this.cart().reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2); }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.loadTable(id);
    this.api.getMenuItems().subscribe(items => {
      this.menuAll = items;
      const cats = [...new Set(items.map((i: any) => i.category))];
      this.catOptions.set(['', ...cats]);
      this.filteredMenu.set(items);
    });
  }

  loadTable(id: number) {
    this.loading.set(true);
    this.api.getTables().subscribe({
      next: tables => {
        const t = tables.find((t: any) => t.id === id);
        this.table.set(t ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    // load active orders for this table
    this.api.getBills({ status: 'pending,preparing,ready,served', table_id: id }).subscribe({
      next: bills => this.activeOrder.set(bills[0] ?? null),
      error: () => {}
    });
  }

  changeTableStatus(status: string) {
    this.api.updateTableStatus(this.table()!.id, status).subscribe({
      next: t => { this.table.set(t); this.msg.add({ severity: 'success', summary: 'Updated', detail: `Status → ${STATUS_CFG[status].label}` }); },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Update failed' })
    });
  }

  setOrderStatus(status: string) {
    this.api.updateBillStatus(this.activeOrder()!.id, status).subscribe({
      next: updated => {
        this.activeOrder.set(updated);
        if (status === 'cancelled') { this.activeOrder.set(null); this.changeTableStatus('available'); }
        this.msg.add({ severity: 'success', summary: 'Updated', detail: `Order → ${this.orderStatusCfg(status).label}` });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Update failed' })
    });
  }

  filterMenu() {
    this.filteredMenu.set(this.selectedCat ? this.menuAll.filter(i => i.category === this.selectedCat) : [...this.menuAll]);
    this.selectedItem = null;
  }

  addItem() {
    if (!this.selectedItem) return;
    const c = [...this.cart()];
    const ex = c.find(i => i.menu_item_id === this.selectedItem.id);
    if (ex) { ex.quantity += this.qty; }
    else { c.push({ menu_item_id: +this.selectedItem.id, item_name: this.selectedItem.name, unit_price: +this.selectedItem.price, gst_rate: +(this.selectedItem.gst ?? 0), quantity: +this.qty }); }
    this.cart.set(c); this.selectedItem = null; this.qty = 1;
  }

  changeQty(i: number, d: number) {
    const c = [...this.cart()];
    c[i] = { ...c[i], quantity: Math.max(1, c[i].quantity + d) };
    this.cart.set(c);
  }

  removeItem(i: number) { this.cart.set(this.cart().filter((_, idx) => idx !== i)); }

  placeOrder() {
    if (!this.cart().length) return;
    this.savingOrder.set(true);
    this.api.createDraftBill({
      table_id: this.table()!.id,
      items: this.cart().map(i => ({ menu_item_id: i.menu_item_id, item_name: i.item_name, unit_price: i.unit_price, gst_rate: i.gst_rate, quantity: i.quantity }))
    }).subscribe({
      next: bill => {
        this.activeOrder.set(bill);
        this.cart.set([]);
        this.savingOrder.set(false);
        this.changeTableStatus('occupied');
        this.msg.add({ severity: 'success', summary: 'Order Placed', detail: `${bill.bill_number} sent to kitchen` });
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to place order' }); this.savingOrder.set(false); }
    });
  }
}
