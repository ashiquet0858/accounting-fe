import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-table-form',
  standalone: true,
  imports: [FormsModule, InputTextModule, InputNumberModule, ButtonModule, ToastModule],
  providers: [MessageService],
  styles: [`
    .back-btn {
      display:flex; align-items:center; gap:.5rem;
      background:none; border:none; cursor:pointer;
      font-size:.9rem; font-weight:700; color:var(--text-2); padding:0; margin-bottom:1.25rem;
    }
  `],
  template: `
    <p-toast />

    <button class="back-btn" (click)="back()">
      <i class="pi pi-arrow-left" style="font-size:.85rem"></i> Tables
    </button>

    <div class="page-header"><h2>{{ editId ? 'Edit Table' : 'Add Table' }}</h2></div>

    <div class="mob-section">
      <div class="field" style="margin-bottom:.875rem">
        <label>Table Name *</label>
        <input pInputText [(ngModel)]="name" placeholder="e.g. Table 1, VIP, Garden" style="width:100%" />
      </div>
      <div class="field">
        <label>Capacity (seats)</label>
        <p-inputNumber [(ngModel)]="capacity" [min]="1" [max]="20" styleClass="w-full" />
      </div>
    </div>

    <p-button [label]="editId ? 'Update Table' : 'Add Table'" icon="pi pi-check"
      styleClass="w-full" style="display:block;margin-top:1rem"
      [loading]="saving()" (onClick)="save()" />
  `
})
export class TableFormComponent implements OnInit {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private api    = inject(ApiService);
  private msg    = inject(MessageService);

  editId: number | null = null;
  saving = signal(false);
  name     = '';
  capacity = 4;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.api.getTables().subscribe(tables => {
        const t = tables.find((t: any) => t.id === this.editId);
        if (t) { this.name = t.name; this.capacity = t.capacity; }
      });
    }
  }

  back() { this.router.navigate(['/tables']); }

  save() {
    if (!this.name.trim()) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Table name is required' }); return;
    }
    this.saving.set(true);
    const op = this.editId
      ? this.api.updateTable(this.editId, { name: this.name, capacity: this.capacity })
      : this.api.createTable({ name: this.name, capacity: this.capacity });
    op.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Saved', detail: this.editId ? 'Table updated' : 'Table added' });
        setTimeout(() => this.router.navigate(['/tables']), 600);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Error', detail: 'Save failed' }); this.saving.set(false); }
    });
  }
}
