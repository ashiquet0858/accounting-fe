import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  styles: [`
    .greeting { margin-bottom: 1.25rem; }
    .greeting-name { font-size: 1.35rem; font-weight: 800; color: var(--text-1); letter-spacing: -.03em; }
    .greeting-sub  { font-size: .8rem; color: var(--text-3); margin-top: .15rem; font-weight: 500; }

    /* Quick actions */
    .quick-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: .6rem;
      margin-bottom: 1.25rem;
    }
    .quick-btn {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: .4rem; padding: .9rem .5rem; border-radius: var(--radius-lg);
      border: none; cursor: pointer; background: var(--surface);
      box-shadow: var(--shadow-sm); transition: transform .15s;
      -webkit-tap-highlight-color: transparent;
      &:active { transform: scale(.94); }
      .qb-icon {
        width: 2.6rem; height: 2.6rem; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        i { font-size: 1.1rem; }
      }
      span { font-size: .68rem; font-weight: 700; color: var(--text-2); }
    }

    /* Chart */
    .chart-wrap {
      background: var(--surface); border-radius: var(--radius-lg);
      padding: .875rem 1rem; box-shadow: var(--shadow-sm); margin-bottom: 1rem;
    }
    .chart-title {
      font-size: .68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .07em; color: var(--text-3); margin-bottom: .75rem;
    }
    .chart-bars {
      display: flex; align-items: flex-end; gap: .3rem; height: 80px;
    }
    .bar-col {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: .2rem;
    }
    .bar {
      width: 100%; border-radius: 6px 6px 0 0;
      background: var(--primary-light);
      transition: height .4s cubic-bezier(.4,0,.2,1);
      min-height: 2px;
      &.has-data { background: var(--primary); }
    }
    .bar-lbl { font-size: .55rem; color: var(--text-3); font-weight: 600; }

    /* Top items */
    .top-item-row {
      display: flex; align-items: center; gap: .6rem; margin-bottom: .6rem;
      &:last-child { margin-bottom: 0; }
    }
    .rank {
      width: 1.4rem; height: 1.4rem; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: .65rem; font-weight: 800; flex-shrink: 0;
    }
    .bar-track {
      flex: 1; height: .45rem; background: var(--surface-3); border-radius: 99px; overflow: hidden;
    }
    .bar-fill {
      height: 100%; border-radius: 99px; background: var(--primary);
      transition: width .5s cubic-bezier(.4,0,.2,1);
    }

    /* Bill receipt dialog */
    .receipt-body { padding: .25rem 0; }
  `],
  template: `
    <!-- Greeting -->
    <div class="greeting">
      <div class="greeting-name">{{ greeting }}, {{ username }} 👋</div>
      <div class="greeting-sub">{{ today | date:"EEEE, d MMM yyyy" }} · {{ timeStr() }}</div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-grid">
      <button class="quick-btn" (click)="router.navigate(['/billing'])">
        <div class="qb-icon" style="background:#EEF0FF"><i class="pi pi-receipt" style="color:#6C63FF"></i></div>
        <span>New Bill</span>
      </button>
      <button class="quick-btn" (click)="router.navigate(['/bills'])">
        <div class="qb-icon" style="background:#EDFDF5"><i class="pi pi-list" style="color:#22C55E"></i></div>
        <span>History</span>
      </button>
      <button class="quick-btn" (click)="router.navigate(['/menu'])">
        <div class="qb-icon" style="background:#FFFBEB"><i class="pi pi-book" style="color:#F59E0B"></i></div>
        <span>Menu</span>
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid" style="margin-bottom:1rem">
      @if (loading()) {
        @for (_ of [1,2,3,4]; track $index) {
          <div class="stat-card">
            <div class="skeleton" style="width:2.4rem;height:2.4rem;border-radius:10px;margin-bottom:.6rem"></div>
            <div class="skeleton" style="height:1.4rem;width:70%;margin-bottom:.3rem"></div>
            <div class="skeleton" style="height:.65rem;width:50%"></div>
          </div>
        }
      } @else {
        @for (s of stats(); track s.label) {
          <div class="stat-card">
            <div class="stat-icon" [style.background]="s.bg">
              <i [class]="s.icon" [style.color]="s.color"></i>
            </div>
            <div class="stat-value" [style.color]="s.color">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        }
      }
    </div>

    <!-- Hourly Sales Chart -->
    <div class="chart-wrap">
      <div class="chart-title">Today's Sales · by hour</div>
      @if (loading()) {
        <div class="chart-bars">
          @for (_ of [1,2,3,4,5,6,7,8,9,10,11,12]; track $index) {
            <div class="bar-col">
              <div class="skeleton" [style.height.px]="20 + $index * 4" style="width:100%;border-radius:4px"></div>
            </div>
          }
        </div>
      } @else {
        <div class="chart-bars">
          @for (h of hourlySales(); track h.hour) {
            <div class="bar-col">
              <div class="bar" [class.has-data]="h.total > 0"
                [style.height.px]="h.total > 0 ? (4 + (h.total / maxHourly()) * 72) : 2"></div>
              <span class="bar-lbl">{{ h.hour }}</span>
            </div>
          }
        </div>
      }
    </div>

    <!-- Top Selling Items -->
    <div class="chart-wrap">
      <div class="chart-title">Top Selling Items · this month</div>
      @if (loading()) {
        @for (_ of [1,2,3]; track $index) {
          <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem">
            <div class="skeleton" style="width:1.4rem;height:1.4rem;border-radius:6px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:.75rem;width:55%;margin-bottom:.3rem"></div>
              <div class="skeleton" style="height:.4rem;width:100%;border-radius:99px"></div>
            </div>
            <div class="skeleton" style="height:.75rem;width:1.5rem"></div>
          </div>
        }
      } @else if (topItems().length === 0) {
        <div style="text-align:center;padding:1rem;color:var(--text-3);font-size:.82rem">No data yet</div>
      } @else {
        @for (item of topItems(); track item.name; let i = $index) {
          <div class="top-item-row">
            <div class="rank" [style.background]="rankBg(i)" [style.color]="rankColor(i)">
              {{ i + 1 }}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:.82rem;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.3rem">
                {{ item.name }}
              </div>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="item.pct"></div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:.5rem">
              <div style="font-size:.78rem;font-weight:800;color:var(--primary)">×{{ item.qty }}</div>
              <div style="font-size:.65rem;color:var(--text-3)">₹{{ item.revenue }}</div>
            </div>
          </div>
        }
      }
    </div>

    <!-- Recent Bills -->
    <div class="section-label">Recent Bills</div>

    @if (loading()) {
      @for (_ of [1,2,3]; track $index) {
        <div class="bill-card" style="cursor:default">
          <div style="display:flex;justify-content:space-between;margin-bottom:.4rem">
            <div class="skeleton" style="height:.85rem;width:38%"></div>
            <div class="skeleton" style="height:.85rem;width:22%"></div>
          </div>
          <div class="skeleton" style="height:.72rem;width:55%"></div>
        </div>
      }
    } @else if (recentBills().length === 0) {
      <div style="text-align:center;padding:2rem 1rem;color:var(--text-3)">
        <i class="pi pi-inbox" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4"></i>
        <div style="font-size:.88rem;font-weight:600">No bills today yet</div>
      </div>
    } @else {
      @for (bill of recentBills(); track bill.id) {
        <div class="bill-card" (click)="router.navigate(['/bills', bill.id])">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem">
            <div style="display:flex;align-items:center;gap:.5rem">
              <div style="width:2rem;height:2rem;border-radius:8px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="pi pi-receipt" style="font-size:.75rem;color:var(--primary)"></i>
              </div>
              <strong style="font-size:.88rem;color:var(--text-1)">{{ bill.bill_number }}</strong>
            </div>
            <span style="font-size:.95rem;font-weight:800;color:var(--primary)">₹{{ bill.total_amount }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-left:2.5rem">
            <span style="font-size:.78rem;color:var(--text-2)">{{ bill.customer?.name }} · {{ bill.customer?.mobile }}</span>
            <span style="font-size:.72rem;color:var(--text-3)">{{ bill.created_at | date:'HH:mm' }}</span>
          </div>
          <div style="padding-left:2.5rem;margin-top:.2rem;display:flex;gap:.3rem;flex-wrap:wrap">
            @for (item of bill.items?.slice(0,3); track item.id) {
              <span style="font-size:.65rem;background:var(--surface-3);color:var(--text-2);padding:.1rem .4rem;border-radius:5px;font-weight:600">
                {{ item.item_name }}
              </span>
            }
            @if (bill.items?.length > 3) {
              <span style="font-size:.65rem;color:var(--text-3)">+{{ bill.items.length - 3 }} more</span>
            }
          </div>
        </div>
      }
    }

  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  router = inject(Router);
  private api = inject(ApiService);

  today        = new Date();
  loading      = signal(true);
  stats        = signal<any[]>([]);
  recentBills  = signal<any[]>([]);
  topItems     = signal<any[]>([]);
  hourlySales  = signal<any[]>([]);
  timeStr = signal('');

  maxHourly = computed(() =>
    Math.max(...this.hourlySales().map(h => h.total), 1)
  );

  get greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get username() {
    try { return JSON.parse(localStorage.getItem('user') || '{}').username ?? 'there'; }
    catch { return 'there'; }
  }

  private clockTimer: any;

  rankBg(i: number)    { return ['#FEF3C7','#F3F4F6','#FEF3C7'][i] ?? 'var(--surface-3)'; }
  rankColor(i: number) { return ['#D97706','#6B7280','#D97706'][i] ?? 'var(--text-3)'; }

  ngOnInit() {
    this.tick();
    this.clockTimer = setInterval(() => this.tick(), 1000);

    this.api.getDashboardStats().subscribe({
      next: d => {
        this.stats.set([
          { label: "Today's Sales",  value: '₹' + d.today_sales, icon: 'pi pi-indian-rupee', color: '#22C55E', bg: '#EDFDF5' },
          { label: 'Bills Today',    value: d.today_bills,        icon: 'pi pi-receipt',      color: '#6C63FF', bg: '#EEF0FF' },
          { label: 'Monthly Sales',  value: '₹' + d.month_sales, icon: 'pi pi-chart-line',   color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'This Month',     value: d.month_bills,        icon: 'pi pi-calendar',     color: '#EF4444', bg: '#FEF2F2' },
        ]);
        this.recentBills.set(d.recent_bills ?? []);
        this.topItems.set(d.top_items ?? []);
        this.hourlySales.set(d.hourly_sales ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy() { clearInterval(this.clockTimer); }

  private tick() {
    const now = new Date();
    this.timeStr.set(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

}
