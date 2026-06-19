import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

const SWIPE_THRESHOLD = 50;

// Tab definitions — admin sees all, staff sees only first 3
const ALL_TABS = [
  { route: '/dashboard', icon: 'pi pi-home',    lbl: 'Home',    adminOnly: true },
  { route: '/billing',   icon: 'pi pi-receipt', lbl: 'Bill'    },
  { route: '/bills',     icon: 'pi pi-list',    lbl: 'History' },
  { route: '/customers', icon: 'pi pi-users',   lbl: 'People'  },
  { route: '/menu',      icon: 'pi pi-book',    lbl: 'Menu',    adminOnly: true },
  { route: '/users',     icon: 'pi pi-shield',  lbl: 'Team',    adminOnly: true },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-shell">
      <header class="top-header">
        <div class="header-left">
          <i class="pi pi-coffee"></i>
          <span>Burfi Billing</span>
        </div>
        <div class="header-right">
          <div class="user-chip">
            <div class="avatar">{{ initial }}</div>
            {{ user?.username }}
          </div>
          <!-- Role badge -->
          <span style="font-size:.6rem;font-weight:800;padding:.2rem .5rem;border-radius:20px;letter-spacing:.04em"
            [style.background]="isAdmin ? 'rgba(255,216,77,.2)' : 'rgba(255,255,255,.12)'"
            [style.color]="isAdmin ? '#FFD84D' : 'rgba(255,255,255,.7)'">
            {{ isAdmin ? 'ADMIN' : 'STAFF' }}
          </span>
          <button class="logout-btn" (click)="logout($event)" title="Logout">
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </header>

      <main class="content-area"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)">
        <router-outlet />
      </main>
    </div>

    <nav class="bottom-nav">
      @for (tab of tabs; track tab.route) {
        <a [class.active]="active(tab.route)" (click)="navTo(tab.route)">
          <div class="nav-icon-wrap">
            <i [class]="tab.icon"></i>
            <span class="lbl">{{ tab.lbl }}</span>
          </div>
        </a>
      }
    </nav>
  `
})
export class LayoutComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  user    = this.auth.getUser();
  isAdmin = this.auth.isAdmin();
  tabs    = ALL_TABS.filter(t => !t.adminOnly || this.isAdmin);

  get initial() { return (this.user?.username?.[0] ?? 'A').toUpperCase(); }
  logout(e: Event) { e.preventDefault(); this.auth.logout(); }

  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.currentUrl.set(e.urlAfterRedirects));
  }

  active(route: string): boolean {
    return this.currentUrl().startsWith(route);
  }

  navTo(route: string) {
    const routes = this.tabs.map(t => t.route);
    const from = routes.findIndex(r => this.router.url.startsWith(r));
    const to   = routes.indexOf(route);
    if (from === to || to === -1) return;
    this.go(route, to > from ? 'left' : 'right');
  }

  private tx = 0;
  private ty = 0;

  onTouchStart(e: TouchEvent) {
    this.tx = e.touches[0].clientX;
    this.ty = e.touches[0].clientY;
  }

  onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.tx;
    const dy = e.changedTouches[0].clientY - this.ty;
    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < SWIPE_THRESHOLD) return;

    const routes = this.tabs.map(t => t.route);
    const isSubPage = !routes.some(r => this.router.url === r || this.router.url === r + '/');
    if (isSubPage) return;

    const cur  = routes.findIndex(r => this.router.url.startsWith(r));
    if (cur === -1) return;
    const next = dx < 0 ? Math.min(cur + 1, routes.length - 1) : Math.max(cur - 1, 0);
    if (next !== cur) this.go(routes[next], dx < 0 ? 'left' : 'right');
  }

  private go(route: string, dir: 'left' | 'right') {
    const html = document.documentElement;
    html.dataset['vtDir'] = dir;
    const navigate = () => this.router.navigate([route]);
    if ('startViewTransition' in document) {
      const vt = (document as any).startViewTransition(navigate);
      vt.finished.finally(() => delete html.dataset['vtDir']);
    } else {
      navigate();
      delete html.dataset['vtDir'];
    }
  }
}
