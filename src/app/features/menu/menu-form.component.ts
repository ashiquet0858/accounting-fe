import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

const CATEGORIES = ['Tea', 'Coffee', 'Juice', 'Snacks', 'Food', 'Dessert', 'Beverages', 'Other'];

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
  selector: 'app-menu-form',
  standalone: true,
  imports: [FormsModule, InputTextModule, InputNumberModule, SelectModule, ToastModule],
  providers: [MessageService],
  styles: [`
    .form-page { display: flex; flex-direction: column; }

    .form-header {
      display: flex; align-items: center; gap: .75rem;
      margin-bottom: 1.5rem;
    }
    .back-btn {
      width: 2.4rem; height: 2.4rem; border-radius: 12px;
      border: none; background: var(--surface); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-1); font-size: 1rem;
      box-shadow: var(--shadow-sm);
      transition: transform .15s;
      flex-shrink: 0;
      &:active { transform: scale(.92); }
    }
    .form-title { font-size: 1.2rem; font-weight: 800; color: var(--text-1); letter-spacing: -.03em; }

    .cat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: .5rem;
      margin-bottom: .25rem;
    }
    .cat-chip {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: .3rem; padding: .6rem .25rem; border-radius: 12px;
      cursor: pointer; border: 2px solid transparent;
      transition: border-color .15s, transform .15s;
      i { font-size: 1rem; }
      span { font-size: .62rem; font-weight: 700; }
      &:active { transform: scale(.94); }
      &.selected { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(108,99,255,.15); }
    }

    .price-row { display: flex; flex-direction: column; gap: .75rem; }

    .save-btn {
      width: 100%; height: 3rem; border-radius: 14px;
      border: none; background: var(--primary); color: #fff;
      font-size: .95rem; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 16px rgba(108,99,255,.4);
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      transition: transform .15s, box-shadow .15s;
      margin-top: 1rem;
      &:active { transform: scale(.97); box-shadow: 0 2px 8px rgba(108,99,255,.3); }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }

    .preview-card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: .875rem 1rem;
      box-shadow: var(--shadow-sm);
      display: flex; align-items: center; gap: .75rem;
      margin-bottom: 1rem;
      border: 1.5px dashed var(--border);
    }
  `],
  template: `
    <p-toast />
    <div class="form-page">

      <!-- Header -->
      <div class="form-header">
        <button class="back-btn" (click)="back()">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div>
          <div class="form-title">{{ editId ? 'Edit Item' : 'Add Item' }}</div>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:.1rem">
            {{ editId ? 'Update menu item details' : 'Create a new menu item' }}
          </div>
        </div>
      </div>

      <!-- Live preview -->
      @if (form.name || form.category) {
        <div class="preview-card">
          <div style="width:2.4rem;height:2.4rem;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"
            [style.background]="form.category ? catStyle(form.category).bg : 'var(--surface-3)'">
            <i [class]="form.category ? catStyle(form.category).icon : 'pi pi-tag'"
               [style.color]="form.category ? catStyle(form.category).color : 'var(--text-3)'"
               style="font-size:.85rem"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.9rem;font-weight:700;color:var(--text-1)">{{ form.name || 'Item name…' }}</div>
            <div style="font-size:.75rem;color:var(--text-3);margin-top:.15rem">
              @if (form.category) { <span>{{ form.category }}</span> }
              @if (form.gst) { <span> · GST {{ form.gst }}%</span> }
            </div>
          </div>
          @if (form.price) {
            <strong style="color:var(--primary);font-size:.95rem;flex-shrink:0">₹{{ form.price }}</strong>
          }
        </div>
      }

      <!-- Item Name -->
      <div class="mob-section" style="margin-bottom:.75rem">
        <div class="mob-section-title">Item Name</div>
        <input pInputText [(ngModel)]="form.name" placeholder="e.g. Masala Tea"
          style="width:100%;font-size:1rem" />
      </div>

      <!-- Category -->
      <div class="mob-section" style="margin-bottom:.75rem">
        <div class="mob-section-title">Category</div>
        <div class="cat-grid">
          @for (cat of categories; track cat) {
            <div class="cat-chip"
              [class.selected]="form.category === cat"
              [style.background]="catStyle(cat).bg"
              [style.color]="catStyle(cat).color"
              (click)="form.category = cat">
              <i [class]="catStyle(cat).icon"></i>
              <span>{{ cat }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Price + GST -->
      <div class="mob-section" style="margin-bottom:1.25rem">
        <div class="mob-section-title">Pricing</div>
        <div class="price-row">
          <div class="field">
            <label>GST (%)</label>
            <p-inputNumber [(ngModel)]="form.gst" [min]="0" [max]="100"
              suffix="%" placeholder="0" styleClass="w-full" />
          </div>
          <div class="field">
            <label>Price (₹) *</label>
            <p-inputNumber [(ngModel)]="form.price" mode="currency" currency="INR"
              locale="en-IN" placeholder="0.00" styleClass="w-full" />
          </div>
        </div>
      </div>

      <!-- Save -->
      <button class="save-btn" [disabled]="saving()" (click)="save()">
        @if (saving()) {
          <i class="pi pi-spin pi-spinner"></i> Saving…
        } @else {
          <i class="pi pi-check"></i> {{ editId ? 'Update Item' : 'Add to Menu' }}
        }
      </button>

    </div>
  `
})
export class MenuFormComponent implements OnInit {
  private api    = inject(ApiService);
  private msg    = inject(MessageService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  editId: number | null = null;
  saving = signal(false);
  categories = CATEGORIES;
  form = { name: '', category: '', price: 0, gst: 0 };

  catStyle(cat: string) { return CAT_STYLE[cat] ?? CAT_STYLE['Other']; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.api.getMenuItems().subscribe(items => {
        const item = items.find((i: any) => i.id === this.editId);
        if (item) this.form = { name: item.name, category: item.category, price: item.price, gst: item.gst ?? 0 };
      });
    }
  }

  back() { this.router.navigate(['/menu']); }

  save() {
    if (!this.form.name || !this.form.category || !this.form.price) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Name, category and price are required' });
      return;
    }
    this.saving.set(true);
    const op = this.editId
      ? this.api.updateMenuItem(this.editId, this.form)
      : this.api.createMenuItem(this.form);
    op.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Saved', detail: this.editId ? 'Item updated' : 'Item added' });
        setTimeout(() => this.router.navigate(['/menu']), 600);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Operation failed' }); this.saving.set(false); }
    });
  }
}
