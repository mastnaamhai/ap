
export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  batchNumber: string;
  expiryDate: string;
  packSize: string;
  hsnCode: string;
  rate: number; // Selling Price excluding tax
  gstRate: number; // 5, 12, 18, 28
  stock: number;
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  gstin?: string; // Optional for B2C
  state: string; // Used for IGST vs CGST/SGST logic
}

export interface InvoiceItem extends Product {
  quantity: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number; // (Rate * Qty) - Disc + Tax
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerGst?: string; // Added to store snapshot of GST at time of invoice
  items: InvoiceItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  notes?: string;
}

export interface AppSettings {
  pharmacyName: string;
  address: string;
  gstin: string;
  dlNumber: string; // Drug License
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  terms: string;
  state: string; // Pharmacy State
  signatureImage?: string; // Base64 string for the signature
}

export const CATEGORIES = ['Tablet', 'Syrup', 'Injection', 'Surgical', 'Equipment', 'Consumable'];
export const GST_RATES = [0, 5, 12, 18, 28];
