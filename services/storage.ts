
import { Product, Customer, Invoice, AppSettings } from '../types';

// API Base URL - Uses environment variable for production, localhost for development
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

class ApiStorageService {
  private apiUrl = API_BASE;

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token && options.method !== 'POST' && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, clear it
        localStorage.removeItem('authToken');
        throw new Error('Authentication required');
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // --- Auth ---
  async verifyPassword(input: string): Promise<boolean> {
    try {
      const response = await this.apiRequest<{ success: boolean, token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: input }),
      });
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async updatePassword(newPassword: string): Promise<boolean> {
    try {
      await this.apiRequest('/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      return true;
    } catch (error) {
      console.error('Update password failed:', error);
      return false;
    }
  }

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await this.apiRequest<AppSettings>('/settings');
      return settings;
    } catch (error) {
      console.error('Get settings failed:', error);
      // Return default if API fails
      return {
        pharmacyName: "MediCare Plus Pharmacy",
        address: "Shop 12, Wellness Plaza, Andheri East, Mumbai 400069",
        gstin: "27ABCDE1234F1Z5",
        dlNumber: "MH-MZ1-123456",
        phone: "9876543210",
        email: "billing@medicareplus.com",
        bankName: "HDFC Bank",
        accountNumber: "50100123456789",
        ifsc: "HDFC0001234",
        terms: "Goods once sold will not be taken back. Keep in cool dry place.",
        state: "Maharashtra",
        signatureImage: ""
      };
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await this.apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Save settings failed:', error);
      throw error;
    }
  }

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    try {
      const products = await this.apiRequest<Array<Product & { _id: string }>>('/products');
      // Map _id to id for frontend compatibility
      return products.map(p => ({
        ...p,
        id: p._id,
      }));
    } catch (error) {
      console.error('Get products failed:', error);
      return [];
    }
  }

  async saveProduct(product: Product): Promise<void> {
    try {
      const { id, ...productData } = product;
      if (id) {
        await this.apiRequest(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(productData),
        });
      } else {
        await this.apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(productData),
        });
      }
    } catch (error) {
      console.error('Save product failed:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.apiRequest(`/products/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete product failed:', error);
      throw error;
    }
  }

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    try {
      const customers = await this.apiRequest<Array<Customer & { _id: string }>>('/customers');
      return customers.map(c => ({
        ...c,
        id: c._id,
      }));
    } catch (error) {
      console.error('Get customers failed:', error);
      return [];
    }
  }

  async saveCustomer(customer: Customer): Promise<void> {
    try {
      const { id, ...customerData } = customer;
      if (id) {
        await this.apiRequest(`/customers/${id}`, {
          method: 'PUT',
          body: JSON.stringify(customerData),
        });
      } else {
        await this.apiRequest('/customers', {
          method: 'POST',
          body: JSON.stringify(customerData),
        });
      }
    } catch (error) {
      console.error('Save customer failed:', error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await this.apiRequest(`/customers/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete customer failed:', error);
      throw error;
    }
  }

  // --- Invoices ---
  async getInvoices(): Promise<Invoice[]> {
    try {
      const invoices = await this.apiRequest<Array<Invoice & { _id: string }>>('/invoices');
      return invoices.map(i => ({
        ...i,
        id: i._id,
      }));
    } catch (error) {
      console.error('Get invoices failed:', error);
      return [];
    }
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    try {
      const { id, ...invoiceData } = invoice;
      if (id) {
        await this.apiRequest(`/invoices/${id}`, {
          method: 'PUT',
          body: JSON.stringify(invoiceData),
        });
      } else {
        await this.apiRequest('/invoices', {
          method: 'POST',
          body: JSON.stringify(invoiceData),
        });
      }
    } catch (error) {
      console.error('Save invoice failed:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await this.apiRequest(`/invoices/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete invoice failed:', error);
      throw error;
    }
  }

  async getNextInvoiceNumber(): Promise<string> {
    // Get all invoices and find the highest number
    const invoices = await this.getInvoices();
    if (invoices.length === 0) return 'INV-001';

    const sorted = [...invoices].sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
    const lastInv = sorted[0].invoiceNumber;

    try {
      const numPart = lastInv.split('-')[1];
      const nextNum = parseInt(numPart) + 1;
      return `INV-${String(nextNum).padStart(3, '0')}`;
    } catch {
      return `INV-${Date.now()}`;
    }
  }

  // --- Backup & Restore ---
  async createBackup(): Promise<string> {
    try {
      const data = await this.apiRequest('/backup');
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      // For restore, we need to import data via API endpoints
      // This would require separate endpoints for bulk import
      // For now, return false
      console.warn('Restore not implemented yet');
      return false;
    } catch (e) {
      console.error('Restore failed:', e);
      return false;
    }
  }

  async exportInvoicesCSV(): Promise<string> {
    const invoices = await this.getInvoices();

    // Header Row
    let csvContent = "Invoice No,Date,Customer Name,Customer GST,Payment Mode,Item Name,Batch,HSN,Expiry,Quantity,Rate,GST Rate,Tax Amount,Total Amount\n";

    // Data Rows (Flattened: One row per item)
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const row = [
          inv.invoiceNumber,
          inv.date,
          `"${inv.customerName}"`, // Quote strings with commas
          inv.customerGst || '',
          inv.paymentMode,
          `"${item.name}"`,
          item.batchNumber,
          item.hsnCode,
          item.expiryDate,
          item.quantity,
          item.rate,
          item.gstRate + '%',
          item.taxAmount.toFixed(2),
          item.totalAmount.toFixed(2)
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    return csvContent;
  }

  // Logout
  logout(): void {
    localStorage.removeItem('authToken');
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const db = new ApiStorageService();
