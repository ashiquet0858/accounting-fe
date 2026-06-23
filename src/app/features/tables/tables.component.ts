import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
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
  selector: 'app-tables',
  standalone: true,
  imports: [FormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  styles: [`
    .floor-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: .75rem;
    }
    .table-card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: 1rem;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: transform .15s;
      border: 2px solid transparent;
      &:active { transform: scale(.97); }
    }
    .status-dot { width: .55rem; height: .55rem; border-radius: 50%; flex-shrink: 0; }
    .status-chip {
      font-size: .65rem; font-weight: 700; padding: .2rem .5rem;
      border-radius: 99px; display: inline-flex; align-items: center; gap: .3rem;
    }
    .capacity-badge {
      font-size: .7rem; color: var(--text-3); font-weight: 600;
      display: flex; align-items: center; gap: .25rem;
    }
    .cart-item {
      display: flex; align-items: center; gap: .5rem;
      padding: .5rem 0; border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    .qty-ctrl {
      display: flex; align-items: center; gap: .35rem;
      button {
        border: 1px solid var(--border); background: var(--surface-2);
        border-radius: 6px; width: 1.5rem; height: 1.5rem;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      span { font-size: .85rem; font-weight: 700; min-width: 1.2rem; text-align: center; }
    }
    .order-status-btn {
      flex: 1; border: none; border-radius: 8px; padding: .45rem .5rem;
      font-size: .78rem; font-weight: 700; cursor: pointer;
    }
  `],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="page-header">
      <h2>Tables</h2>
      @if (isAdmin) {
        <button class="fab" (click)="router.navigate(['/tables/add'])"><i class="pi pi-plus"></i></button>
      }
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:.6rem;margin-bottom:1rem;flex-wrap:wrap">
      @for (s of statuses; track s.key) {
        <div style="display:flex;align-items:center;gap:.35rem;font-size:.72rem;font-weight:600"
          [style.color]="s.cfg.color">
          <div class="status-dot" [style.background]="s.cfg.dot"></div>
          {{ s.cfg.label }}
        </div>
      }
    </div>

    @if (loading()) {
      <div class="floor-grid">
        @for (_ of [1,2,3,4,5,6]; track $index) {
          <div class="table-card">
            <div class="skeleton" style="height:1rem;width:50%;margin-bottom:.5rem"></div>
            <div class="skeleton" style="height:.75rem;width:35%"></div>
          </div>
        }
      </div>
    } @else if (tables().length === 0) {
      <div style="text-align:center;padding:3rem;color:var(--text-3)">
        <i class="pi pi-table" style="font-size:3rem;display:block;margin-bottom:.75rem;opacity:.3"></i>
        <div style="font-weight:600;font-size:.9rem">No tables yet</div>
        @if (isAdmin) {
          <div style="font-size:.8rem;margin-top:.25rem">Tap + to add your first table</div>
        }
      </div>
    } @else {
      <div class="floor-grid">
        @for (table of tables(); track table.id) {
          <div class="table-card" [style.border-color]="statusCfg(table.status).dot"
            (click)="router.navigate(['/tables', table.id])">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
              <div style="font-size:1rem;font-weight:800;color:var(--text-1)">{{ table.name }}</div>
              @if (isAdmin) {
                <button (click)="$event.stopPropagation(); router.navigate(['/tables/edit', table.id])"
                  style="border:none;background:var(--surface-3);color:var(--text-2);border-radius:7px;width:1.75rem;height:1.75rem;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center">
                  <i class="pi pi-pencil"></i>
                </button>
              }
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div class="status-chip"
                [style.background]="statusCfg(table.status).bg"
                [style.color]="statusCfg(table.status).color">
                <div class="status-dot" [style.background]="statusCfg(table.status).dot"></div>
                {{ statusCfg(table.status).label }}
              </div>
              <div class="capacity-badge">
                <i class="pi pi-users" style="font-size:.65rem"></i>{{ table.capacity }}
              </div>
            </div>
            <!-- show active order status if any -->
            @if (tableActiveOrder(table.id)) {
              <div style="margin-top:.4rem;font-size:.68rem;font-weight:700;padding:.15rem .5rem;border-radius:99px;display:inline-block"
                [style.background]="orderStatusCfg(tableActiveOrder(table.id)!.status).bg"
                [style.color]="orderStatusCfg(tableActiveOrder(table.id)!.status).color">
                Order: {{ orderStatusCfg(tableActiveOrder(table.id)!.status).label }}
              </div>
            }
          </div>
        }
      </div>
    }

  `
})
export class TablesComponent implements OnInit {
  router  = inject(Router);
  private api     = inject(ApiService);
  private msg     = inject(MessageService);
  private confirm = inject(ConfirmationService);
  isAdmin = inject(AuthService).isAdmin();

  tables        = signal<any[]>([]);
  loading       = signal(true);
  selectedTable = signal<any>(null);
  activeOrder   = signal<any>(null);
  detailVisible = false;
  formVisible   = false;
  editTable: any = null;
  saving = false;
  form = { name: '', capacity: 4 };

  // order taking
  menuItems      = signal<any[]>([]);
  filteredMenu   = signal<any[]>([]);
  categoryOptions = signal<string[]>([]);
  selectedMenuItem: any = null;
  selectedCategory = '';
  qty = 1;
  cart = signal<any[]>([]);
  placingOrder = signal(false);

  // active orders map: tableId -> order
  activeOrders = signal<Record<number, any>>({});

  statuses = Object.entries(STATUS_CFG).map(([key, cfg]) => ({ key, cfg }));
  statusCfg(s: string) { return STATUS_CFG[s] ?? STATUS_CFG['available']; }
  orderStatusCfg(s: string) { return ORDER_STATUS_CFG[s] ?? ORDER_STATUS_CFG['pending']; }
  tableActiveOrder(tableId: number) { return this.activeOrders()[tableId] ?? null; }

  cartTotal() {
    return this.cart().reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2);
  }

  ngOnInit() {
    this.load();
    this.api.getMenuItems().subscribe(items => {
      this.menuItems.set(items);
      this.filteredMenu.set(items);
      const cats = [...new Set(items.map((i: any) => i.category))];
      this.categoryOptions.set(['', ...cats]);
    });
    this.loadActiveOrders();
  }

  load() {
    this.loading.set(true);
    this.api.getTables().subscribe({
      next: v => { this.tables.set(v); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadActiveOrders() {
    this.api.getBills({ status: 'pending,preparing,ready,served' }).subscribe({
      next: orders => {
        const map: Record<number, any> = {};
        for (const o of orders) {
          if (o.table_id) map[o.table_id] = o;
        }
        this.activeOrders.set(map);
      },
      error: () => {}
    });
  }

  openDetail(table: any) {
    this.selectedTable.set(table);
    this.detailVisible = true;
    this.resetOrder();
    // load active order for this table
    this.api.getBills({ status: 'pending,preparing,ready,served', table_id: table.id }).subscribe({
      next: orders => this.activeOrder.set(orders[0] ?? null),
      error: () => {}
    });
  }

  resetOrder() {
    this.cart.set([]);
    this.selectedMenuItem = null;
    this.selectedCategory = '';
    this.qty = 1;
    this.activeOrder.set(null);
    this.filteredMenu.set(this.menuItems());
  }

  filterMenuItems() {
    this.filteredMenu.set(this.selectedCategory
      ? this.menuItems().filter(i => i.category === this.selectedCategory)
      : this.menuItems());
    this.selectedMenuItem = null;
  }

  addItem() {
    if (!this.selectedMenuItem) return;
    const current = [...this.cart()];
    const existing = current.find(i => i.menu_item_id === this.selectedMenuItem.id);
    if (existing) { existing.quantity += this.qty; }
    else {
      current.push({
        menu_item_id: +this.selectedMenuItem.id,
        item_name: this.selectedMenuItem.name,
        unit_price: +this.selectedMenuItem.price,
        gst_rate: +(this.selectedMenuItem.gst ?? 0),
        quantity: +this.qty
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

  placeOrder() {
    const table = this.selectedTable();
    if (!table || this.cart().length === 0) return;
    this.placingOrder.set(true);
    this.api.createDraftBill({
      table_id: table.id,
      items: this.cart()
    }).subscribe({
      next: order => {
        this.msg.add({ severity: 'success', summary: 'Order Placed', detail: `${table.name} — order sent to kitchen` });
        this.activeOrder.set(order);
        this.activeOrders.update(m => ({ ...m, [table.id]: order }));
        this.api.updateTableStatus(table.id, 'occupied').subscribe({
          next: updated => this.tables.update(ts => ts.map(t => t.id === updated.id ? updated : t)),
          error: () => {}
        });
        this.cart.set([]);
        this.placingOrder.set(false);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to place order' }); this.placingOrder.set(false); }
    });
  }

  setOrderStatus(status: string) {
    const order = this.activeOrder();
    if (!order) return;
    this.api.updateBillStatus(order.id, status).subscribe({
      next: updated => {
        this.activeOrder.set(status === 'cancelled' ? null : updated);
        this.activeOrders.update(m => {
          const next = { ...m };
          if (status === 'cancelled') delete next[order.table_id];
          else next[order.table_id] = updated;
          return next;
        });
        if (status === 'cancelled') {
          this.api.updateTableStatus(this.selectedTable().id, 'available').subscribe({
            next: updated => { this.tables.update(ts => ts.map(t => t.id === updated.id ? updated : t)); this.selectedTable.set(updated); },
            error: () => {}
          });
        }
        this.msg.add({ severity: 'success', summary: 'Updated', detail: `Order → ${this.orderStatusCfg(status).label}` });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Update failed' })
    });
  }

  changeTableStatus(status: string) {
    const table = this.selectedTable();
    this.api.updateTableStatus(table.id, status).subscribe({
      next: updated => {
        this.tables.update(ts => ts.map(t => t.id === updated.id ? updated : t));
        this.selectedTable.set(updated);
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Status update failed' })
    });
  }

  openAdd() { this.editTable = null; this.form = { name: '', capacity: 4 }; this.formVisible = true; }

  openEdit(table: any) {
    this.editTable = table;
    this.form = { name: table.name, capacity: table.capacity };
    this.formVisible = true;
  }

  save() {
    if (!this.form.name.trim()) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Table name is required' });
      return;
    }
    this.saving = true;
    const op = this.editTable
      ? this.api.updateTable(this.editTable.id, this.form)
      : this.api.createTable(this.form);
    op.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Saved', detail: this.editTable ? 'Table updated' : 'Table added' });
        this.formVisible = false; this.saving = false; this.load();
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Save failed' }); this.saving = false; }
    });
  }

  confirmDelete(table: any) {
    this.confirm.confirm({
      message: `Remove "${table.name}"?`, header: 'Confirm', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteTable(table.id).subscribe({
          next: () => { this.msg.add({ severity: 'success', summary: 'Removed', detail: 'Table removed' }); this.load(); },
          error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' })
        });
      }
    });
  }
}
