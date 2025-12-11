
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../services/storage';
import { Product, Customer, Invoice, InvoiceItem, AppSettings, GST_RATES } from '../types';
import { generateInvoicePDF } from '../services/invoiceGenerator';
import { Search, Plus, Trash2, Printer, History, User, MapPin, Phone, CreditCard, ChevronDown, ChevronUp, Save, X, Building2, Eye, Edit } from 'lucide-react';

interface Props {
  settings: AppSettings;
}

const Invoicing: React.FC<Props> = ({ settings }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Master Data (for suggestions)
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  
  // Invoice State
  const [invoiceId, setInvoiceId] = useState<string | null>(null); // For edit mode
  const [invNumber, setInvNumber] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Customer State (Inline)
  const [custMobile, setCustMobile] = useState('');
  const [custName, setCustName] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custGst, setCustGst] = useState('');
  const [custState, setCustState] = useState('Maharashtra'); // Default state
  const [existingCustId, setExistingCustId] = useState<string | null>(null);

  // Line Items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // UI State
  const [productSearch, setProductSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<any>('Cash');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  
  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializePage = async () => {
      await refreshMasterData();

      // Check for Edit Mode
      if (location.state && location.state.invoice) {
        await loadInvoiceForEdit(location.state.invoice);
        // Clear state so reload doesn't re-trigger
        window.history.replaceState({}, document.title);
      } else {
        try {
          const nextNum = await db.getNextInvoiceNumber();
          setInvNumber(nextNum);
        } catch (error) {
          console.error('Error getting invoice number:', error);
          setInvNumber('INV-001'); // fallback
        }
      }
    };

    initializePage();
  }, [location.state]);

  const refreshMasterData = async () => {
    try {
      const products = await db.getProducts();
      const customers = await db.getCustomers();
      setAllProducts(products);
      setAllCustomers(customers);
    } catch (error) {
      console.error('Error loading master data:', error);
      setAllProducts([]); // fallback
      setAllCustomers([]); // fallback
    }
  };

  const loadInvoiceForEdit = async (invoice: Invoice) => {
    setInvoiceId(invoice.id);
    setInvNumber(invoice.invoiceNumber);
    setInvDate(invoice.date);
    setCustName(invoice.customerName);
    setCustGst(invoice.customerGst || '');
    setItems(invoice.items);
    setPaymentMode(invoice.paymentMode);
    setExistingCustId(invoice.customerId);

    // Try to find customer details to fill address/mobile/state
    try {
      const customers = await db.getCustomers();
      const cust = customers.find(c => c.id === invoice.customerId);
      if (cust) {
        setCustMobile(cust.mobile);
        setCustAddress(cust.address || '');
        setCustState(cust.state);
      }
    } catch (error) {
      console.error('Error loading customer for edit:', error);
    }
  };

  // --- Customer Logic ---
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustMobile(val);

    // Auto-lookup customer by mobile if provided
    if (val.length >= 3) {
      const found = allCustomers.find(c => c.mobile === val);
      if (found) {
        setCustName(found.name);
        setCustAddress(found.address || '');
        setCustGst(found.gstin || '');
        setCustState(found.state);
        setExistingCustId(found.id);
      }
    }
  };

  // --- Product Logic ---
  
  // 1. Suggestion Filter
  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 5); // Limit to 5 suggestions

  // 2. Add Item (Existing or New)
  const addLineItem = (product?: Product) => {
    const newItem: InvoiceItem = {
      id: product ? product.id : `temp_${Date.now()}`,
      name: product ? product.name : productSearch, // Use search term as name if new
      category: product?.category || 'Tablet',
      brand: product?.brand || '',
      batchNumber: product?.batchNumber || '',
      expiryDate: product?.expiryDate || '',
      packSize: product?.packSize || '',
      hsnCode: product?.hsnCode || '',
      rate: product?.rate || 0,
      gstRate: product?.gstRate || 12, // Default 12%
      stock: product?.stock || 0,
      minStock: product?.minStock || 0,
      quantity: 1,
      discountPercent: 0,
      taxAmount: 0,
      totalAmount: 0
    };
    
    calculateLineItem(newItem);
    setItems([...items, newItem]);
    
    // Reset search
    setProductSearch('');
    setShowSuggestions(false);
  };

  const calculateLineItem = (item: InvoiceItem) => {
    const baseAmount = item.rate * item.quantity;
    const discountAmount = 0; // Discount removed
    const taxableValue = baseAmount - discountAmount;
    const taxVal = (taxableValue * item.gstRate) / 100;
    
    item.taxAmount = taxVal;
    item.totalAmount = taxableValue + taxVal;
    return item;
  };

  const updateRow = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    
    (item as any)[field] = value;
    
    // Auto-calculate if financial fields change
    if (['quantity', 'rate', 'discountPercent', 'gstRate'].includes(field)) {
      calculateLineItem(item);
    }
    
    setItems(newItems);
  };

  const removeRow = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // --- Totals Calculation ---
  const subTotal = items.reduce((acc, i) => acc + (i.rate * i.quantity), 0);
  const totalTax = items.reduce((acc, i) => acc + i.taxAmount, 0);
  const netTotal = subTotal + totalTax;
  const roundOff = Math.round(netTotal) - netTotal;
  const grandTotal = Math.round(netTotal);

  // --- Save & Print Logic ---
  const handleSaveAndPrint = () => {
    if (!custName) {
      alert("Please enter Customer / Company Name");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    // 1. Smart Save Customer
    let customerId = existingCustId;
    
    const customerData: Customer = {
      id: existingCustId || `c${Date.now()}`,
      name: custName,
      mobile: custMobile, // Can be empty
      address: custAddress,
      gstin: custGst,
      state: custState,
      email: '' // Optional
    };

    if (existingCustId) {
      db.saveCustomer(customerData);
    } else {
      db.saveCustomer(customerData);
      customerId = customerData.id;
    }

    // 2. Smart Save Products (Catalog Learning)
    const processedItems = items.map(item => {
      const productToSave: Product = {
        id: item.id.startsWith('temp_') ? Date.now().toString() + Math.random() : item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        packSize: item.packSize,
        hsnCode: item.hsnCode,
        rate: Number(item.rate),
        gstRate: Number(item.gstRate),
        stock: item.stock,
        minStock: item.minStock
      };

      db.saveProduct(productToSave);
      return { ...item, id: productToSave.id };
    });

    // 3. Save Invoice
    const invoice: Invoice = {
      id: invoiceId || Date.now().toString(),
      invoiceNumber: invNumber,
      date: invDate,
      customerId: customerId!,
      customerName: custName,
      customerGst: custGst,
      items: processedItems,
      subTotal,
      totalDiscount: 0,
      totalTax,
      roundOff,
      grandTotal,
      paymentMode
    };

    db.saveInvoice(invoice);
    
    // 4. Generate PDF
    generateInvoicePDF(invoice, settings);

    // 5. Reset UI
    alert("Invoice Saved!");
    resetForm();
  };

  const resetForm = async () => {
    setItems([]);
    setCustName('');
    setCustMobile('');
    setCustAddress('');
    setCustGst('');
    setExistingCustId(null);
    setInvoiceId(null);
    try {
      const nextNum = await db.getNextInvoiceNumber();
      setInvNumber(nextNum);
    } catch (error) {
      console.error('Error resetting form:', error);
      setInvNumber('INV-001');
    }
    refreshMasterData();
  };

  const handleView = (inv: Invoice) => {
    const url = generateInvoicePDF(inv, settings, true);
    if (typeof url === 'string') {
       setPreviewUrl(url);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this invoice?")) {
      try {
        await db.deleteInvoice(id);
        const updatedInvoices = await db.getInvoices();
        setRecentInvoices(updatedInvoices);
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleEdit = (inv: Invoice) => {
    loadInvoiceForEdit(inv);
    setShowHistoryModal(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-20 md:pb-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
           <h2 className="text-xl font-bold text-slate-800">
             {invoiceId ? 'Edit Invoice' : 'New Invoice'} <span className="text-primary">{invNumber}</span>
           </h2>
           <p className="text-xs text-slate-500">B2B & B2C Billing. Master data saves automatically.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-slate-500 mr-2 uppercase">Date:</span>
                <input 
                  type="date" 
                  value={invDate} 
                  onChange={(e) => setInvDate(e.target.value)} 
                  className="bg-transparent border-none outline-none text-sm font-semibold text-slate-700 w-32"
                />
             </div>
             {invoiceId && (
               <button onClick={resetForm} className="p-2 px-4 text-xs font-bold bg-slate-800 text-white rounded-lg">
                 CANCEL EDIT
               </button>
             )}
             <button onClick={async () => { const invs = await db.getInvoices(); setRecentInvoices(invs); setShowHistoryModal(true); }} className="p-2 text-slate-500 hover:text-primary bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors" title="History">
                <History size={20} />
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        
        {/* Left Col: Inputs & Table */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* 1. Inline Customer Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
               <User size={16} /> Customer / Company Details
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                   <input 
                     placeholder="Company / Customer Name *" 
                     value={custName}
                     onChange={(e) => setCustName(e.target.value)}
                     className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                   />
                </div>
                <div className="md:col-span-3">
                   <div className="relative">
                      <Phone className="absolute top-3 left-3 text-slate-400" size={16} />
                      <input 
                        placeholder="Mobile (Optional)" 
                        value={custMobile}
                        onChange={handleMobileChange}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                      />
                   </div>
                </div>
                 <div className="md:col-span-4">
                   <div className="relative">
                      <Building2 className="absolute top-3 left-3 text-slate-400" size={16} />
                      <input 
                        placeholder="GST Number" 
                        value={custGst}
                        onChange={(e) => setCustGst(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all uppercase"
                      />
                   </div>
                </div>
                <div className="md:col-span-8 flex gap-2">
                   <div className="relative flex-1">
                      <MapPin className="absolute top-3 left-3 text-slate-400" size={16} />
                       <input 
                        placeholder="Address / City" 
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                      />
                   </div>
                </div>
                <div className="md:col-span-4">
                  <input 
                     placeholder="State" 
                     value={custState}
                     onChange={(e) => setCustState(e.target.value)}
                     className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                   />
                </div>
             </div>
          </div>

          {/* 2. Product Search & Add */}
          <div className="relative z-20">
            <div className="flex gap-2">
               <div className="relative flex-1">
                  <Search className="absolute top-3.5 left-4 text-slate-400" size={20} />
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Type product name to search or add new..." 
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl shadow-sm border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-lg"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && productSearch) {
                          addLineItem(); // Add as new item
                       }
                    }}
                  />
                  {showSuggestions && productSearch && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl mt-2 border border-slate-100 overflow-hidden z-50">
                       {filteredProducts.length > 0 ? (
                         filteredProducts.map(p => (
                           <div 
                             key={p.id} 
                             className="p-3 hover:bg-sky-50 cursor-pointer border-b border-slate-50 flex justify-between items-center"
                             onClick={() => addLineItem(p)}
                           >
                              <div>
                                 <p className="font-bold text-slate-700">{p.name}</p>
                                 <p className="text-xs text-slate-500">Batch: {p.batchNumber} | Exp: {p.expiryDate}</p>
                              </div>
                              <div className="text-right">
                                 <p className="font-bold text-primary">₹{p.rate}</p>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div 
                           className="p-3 hover:bg-sky-50 cursor-pointer text-primary font-medium flex items-center gap-2"
                           onClick={() => addLineItem()}
                         >
                            <Plus size={16} /> Use "{productSearch}" as new item
                         </div>
                       )}
                    </div>
                  )}
               </div>
               <button 
                onClick={() => addLineItem()}
                className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200"
               >
                 Add
               </button>
            </div>
          </div>

          {/* 3. Editable Items Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-[300px]">
             <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                      <tr>
                         <th className="p-3 w-10 text-center">#</th>
                         <th className="p-3 min-w-[180px]">Product Name</th>
                         <th className="p-3 w-24">Batch</th>
                         <th className="p-3 w-24">Exp</th>
                         <th className="p-3 w-20 text-center">Rate</th>
                         <th className="p-3 w-16 text-center">Qty</th>
                         <th className="p-3 w-16 text-center">GST%</th>
                         <th className="p-3 w-24 text-right">Total</th>
                         <th className="p-3 w-10"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm">
                      {items.map((item, idx) => (
                        <tr key={idx} className={`hover:bg-slate-50/50 group ${focusedRowIndex === idx ? 'bg-blue-50/30' : ''}`}>
                           <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                           <td className="p-2">
                              <input 
                                className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none font-medium text-slate-700 placeholder-slate-300"
                                value={item.name}
                                placeholder="Item Name"
                                onChange={(e) => updateRow(idx, 'name', e.target.value)}
                                onFocus={() => setFocusedRowIndex(idx)}
                              />
                           </td>
                           <td className="p-2">
                              <input 
                                className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-slate-600 text-xs placeholder-slate-300"
                                value={item.batchNumber}
                                placeholder="Batch"
                                onChange={(e) => updateRow(idx, 'batchNumber', e.target.value)}
                                onFocus={() => setFocusedRowIndex(idx)}
                              />
                           </td>
                           <td className="p-2">
                              <input 
                                className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-slate-600 text-xs placeholder-slate-300"
                                value={item.expiryDate}
                                placeholder="MM/YY"
                                onChange={(e) => updateRow(idx, 'expiryDate', e.target.value)}
                                onFocus={() => setFocusedRowIndex(idx)}
                              />
                           </td>
                           <td className="p-2">
                              <input 
                                type="number"
                                className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-center font-semibold text-slate-700"
                                value={item.rate}
                                onChange={(e) => updateRow(idx, 'rate', parseFloat(e.target.value))}
                                onFocus={() => setFocusedRowIndex(idx)}
                              />
                           </td>
                           <td className="p-2">
                              <input 
                                type="number"
                                className="w-full bg-white border border-slate-200 rounded-md py-1 text-center font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                value={item.quantity}
                                onChange={(e) => updateRow(idx, 'quantity', parseFloat(e.target.value))}
                                onFocus={() => setFocusedRowIndex(idx)}
                              />
                           </td>
                           <td className="p-2 text-center">
                              <input 
                                type="number"
                                className="w-12 text-center bg-transparent border-b border-slate-200 focus:border-primary outline-none text-xs text-slate-500"
                                value={item.gstRate}
                                placeholder="GST"
                                onChange={(e) => updateRow(idx, 'gstRate', parseFloat(e.target.value))}
                              />
                           </td>
                           <td className="p-3 text-right font-bold text-slate-800">
                              ₹{item.totalAmount.toFixed(2)}
                           </td>
                           <td className="p-2 text-center">
                              <button onClick={() => removeRow(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                           <td colSpan={9} className="py-20 text-center text-slate-400">
                              No items added. Use the search bar to add products.
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
             {/* Total Strip */}
             <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-8 text-sm">
                <div className="text-slate-500">Items: <span className="font-bold text-slate-700">{items.length}</span></div>
                <div className="text-slate-500">Qty: <span className="font-bold text-slate-700">{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
             </div>
          </div>

        </div>

        {/* Right Col: Summary & Actions */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between h-fit sticky top-6">
           <div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-200">
                 <CreditCard size={20} /> Payment Details
              </h3>
              
              <div className="space-y-4 mb-8">
                 <div className="flex justify-between text-slate-400 text-sm">
                    <span>Sub Total</span>
                    <span>₹{subTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-slate-400 text-sm">
                    <span>Tax (GST)</span>
                    <span>+ ₹{totalTax.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-slate-400 text-sm">
                    <span>Round Off</span>
                    <span>{roundOff.toFixed(2)}</span>
                 </div>
                 <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
                    <span className="text-slate-300 font-medium">Grand Total</span>
                    <span className="text-3xl font-bold">₹{grandTotal.toFixed(2)}</span>
                 </div>
              </div>

              <div className="mb-8">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">Payment Mode</label>
                 <div className="grid grid-cols-2 gap-3">
                    {['Cash', 'UPI', 'Card', 'Credit'].map(mode => (
                       <button 
                         key={mode}
                         onClick={() => setPaymentMode(mode)}
                         className={`py-2 px-3 rounded-xl text-sm font-bold transition-all border ${paymentMode === mode ? 'bg-primary border-primary text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'}`}
                       >
                         {mode}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
           
           <button 
             onClick={handleSaveAndPrint}
             className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
           >
              <Printer size={20} /> {invoiceId ? 'UPDATE INVOICE' : 'SAVE & PRINT'}
           </button>
        </div>

      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b">
                 <h3 className="font-bold text-lg">Recent Invoices</h3>
                 <button onClick={() => setShowHistoryModal(false)}><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                       <tr>
                          <th className="p-4">Invoice #</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4 text-center">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {recentInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                             <td className="p-4 font-bold text-primary">{inv.invoiceNumber}</td>
                             <td className="p-4 text-slate-500">{inv.date}</td>
                             <td className="p-4">{inv.customerName}</td>
                             <td className="p-4 text-right font-bold">₹{inv.grandTotal}</td>
                             <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleView(inv)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg" title="View"><Eye size={16} /></button>
                                  <button onClick={() => handleEdit(inv)} className="text-green-600 hover:bg-green-50 p-2 rounded-lg" title="Edit"><Edit size={16} /></button>
                                  <button onClick={() => generateInvoicePDF(inv, settings)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg" title="Print"><Printer size={16} /></button>
                                  <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Preview Modal for Invoice Page */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
             <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-bold text-lg text-slate-800">Invoice Preview</h3>
                <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-500" />
                </button>
             </div>
             <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
                <iframe 
                  src={previewUrl} 
                  className="w-full h-full rounded-lg border border-slate-200 bg-white" 
                  title="PDF Preview"
                />
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Invoicing;
