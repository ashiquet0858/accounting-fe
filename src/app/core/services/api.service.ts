import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // Menu
  getMenuItems(category?: string) {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<any[]>(`${this.base}/menu`, { params });
  }
  createMenuItem(data: any) { return this.http.post<any>(`${this.base}/menu`, data); }
  updateMenuItem(id: number, data: any) { return this.http.put<any>(`${this.base}/menu/${id}`, data); }
  deleteMenuItem(id: number) { return this.http.delete<any>(`${this.base}/menu/${id}`); }

  // Customers
  getCustomers(search?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<any[]>(`${this.base}/customers`, { params });
  }
  lookupCustomer(mobile: string) {
    return this.http.get<any>(`${this.base}/customers/lookup?mobile=${mobile}`);
  }

  // Billing
  createBill(data: any) { return this.http.post<any>(`${this.base}/bills`, data); }
  getBills(params?: any) {
    let hp = new HttpParams();
    if (params) Object.keys(params).forEach(k => params[k] && (hp = hp.set(k, params[k])));
    return this.http.get<any[]>(`${this.base}/bills`, { params: hp });
  }
  getBill(id: number) { return this.http.get<any>(`${this.base}/bills/${id}`); }
  getBillWhatsApp(id: number) { return this.http.get(`${this.base}/bills/${id}/whatsapp`, { responseType: 'text' }); }

  // Users (admin only)
  getUsers() { return this.http.get<any[]>(`${this.base}/users`); }
  createUser(data: { username: string; password: string; role: string }) {
    return this.http.post<any>(`${this.base}/users`, data);
  }
  deleteUser(id: number) { return this.http.delete<any>(`${this.base}/users/${id}`); }

  // Dashboard
  getDashboardStats() { return this.http.get<any>(`${this.base}/dashboard/stats`); }
}
