import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

const CAT_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  Tea:       { bg: '#FEF3C7', color: '#92400E', icon: 'pi pi-sun' },
  Coffee:    { bg: '#F5F0EB', color: '#78350F', icon: 'pi pi-coffee' },
  Juice:     { bg: '#DCFCE7', color: '#14532D', icon: 'pi pi-heart' },
  Snacks:    { bg: '#F3E8FF', color: '#6B21A8', icon: 'pi pi-star' },
  Food:      { bg: '#DBEAFE', color: '#1E3A8A', icon: 'pi pi-box' },
  Dessert:   { bg: '#FCE7F3', color: '#831843', icon: 'pi pi-gift' },
  Beverages: { bg: '#CFFAFE', color: '#164E63', icon: 'pi pi-bolt' },
  Other:     { bg: '#F3F4F6', color: '#374151', icon: 'pi pi-tag' },
};

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [FormsModule, ToastModule, ConfirmDialogModule, IconFieldModule, InputIconModule, InputTextModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="page-header">
      <h2>Menu</h2>
      @if (isAdmin) {
        <button class="fab" (click)="router.navigate(['/menu/add'])">
          <i class="pi pi-plus"></i>
        </button>
      }
    </div>

    <div style="margin-bottom:.75rem">
      <p-iconfield styleClass="w-full">
        <p-inputicon styleClass="pi pi-search" />
        <input pInputText [(ngModel)]="filterText" (ngModelChange)="applyFilter()"
          placeholder="Search items…" style="width:100%" />
      </p-iconfield>
    </div>

    @if (loading()) {
      @for (_ of [1,2,3,4,5]; track $index) {
        <div class="menu-item-card">
          <div class="skeleton" style="width:2.4rem;height:2.4rem;border-radius:10px;flex-shrink:0"></div>
          <div style="flex:1">
            <div class="skeleton" style="height:.85rem;width:55%;margin-bottom:.4rem"></div>
            <div class="skeleton" style="height:.7rem;width:35%"></div>
          </div>
          <div class="skeleton" style="height:.85rem;width:20%"></div>
        </div>
      }
    } @else if (filtered().length === 0) {
      <div style="text-align:center;padding:2.5rem;color:var(--text-3)">
        <i class="pi pi-box" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
        <div style="font-size:.88rem;font-weight:600">No items found</div>
      </div>
    } @else {
      @for (item of filtered(); track item.id) {
        <div class="menu-item-card" [style.cursor]="isAdmin ? 'pointer' : 'default'"
          (click)="isAdmin && router.navigate(['/menu/edit', item.id])">
          <div style="width:2.4rem;height:2.4rem;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"
            [style.background]="catStyle(item.category).bg">
            <i [class]="catStyle(item.category).icon" style="font-size:.85rem"
               [style.color]="catStyle(item.category).color"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.9rem;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              {{ item.name }}
            </div>
            <div style="margin-top:.2rem;display:flex;align-items:center;gap:.4rem">
              <span class="chip" [style.background]="catStyle(item.category).bg" [style.color]="catStyle(item.category).color">
                {{ item.category }}
              </span>
              <span style="font-size:.7rem;color:var(--text-3)">GST {{ item.gst ?? 0 }}%</span>
            </div>
          </div>
          <strong style="color:var(--primary);font-size:.95rem;flex-shrink:0;margin-right:.5rem">₹{{ item.price }}</strong>
          @if (isAdmin) {
            <button (click)="$event.stopPropagation(); confirmDelete(item)"
              style="border:none;background:var(--danger-bg);color:var(--danger);border-radius:9px;width:2rem;height:2rem;cursor:pointer;font-size:.8rem;display:flex;align-items:center;justify-content:center">
              <i class="pi pi-trash"></i>
            </button>
          }
        </div>
      }
    }
  `
})
export class MenuComponent implements OnInit {
  router  = inject(Router);
  isAdmin = inject(AuthService).isAdmin();
  private api     = inject(ApiService);
  private msg     = inject(MessageService);
  private confirm = inject(ConfirmationService);

  items    = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading  = signal(true);
  filterText = '';

  catStyle(cat: string) { return CAT_STYLE[cat] ?? CAT_STYLE['Other']; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getMenuItems().subscribe({
      next: v => { this.items.set(v); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const q = this.filterText.toLowerCase();
    this.filtered.set(q
      ? this.items().filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      : [...this.items()]
    );
  }

  confirmDelete(item: any) {
    this.confirm.confirm({
      message: `Delete "${item.name}"?`, header: 'Confirm', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteMenuItem(item.id).subscribe({
          next: () => { this.msg.add({ severity: 'success', summary: 'Deleted', detail: 'Item removed' }); this.load(); },
          error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' })
        });
      }
    });
  }
}
