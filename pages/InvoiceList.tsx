
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/storage';
import { Invoice, AppSettings } from '../types';
import { generateInvoicePDF } from '../services/invoiceGenerator';
import { Search, Printer, Eye, Trash2, Edit, FileText, X, ArrowUpDown } from 'lucide-react';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load data
    const loadData = async () => {
      const [inv, settingsData] = await Promise.all([
        db.getInvoices(),
        db.getSettings()
      ]);
      setInvoices(inv);
      setSettings(settingsData);
    };
    loadData();
  }, []);

  const handlePrint = (inv: Invoice) => {
    generateInvoicePDF(inv, settings);
  };

  const handleView = (inv: Invoice) => {
    const url = generateInvoicePDF(inv, settings, true);
    if (typeof url === 'string') {
       setPreviewUrl(url);
    }
  };

  const handleEdit = (inv: Invoice) => {
    navigate('/billing', { state: { invoice: inv } });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice permanently?")) {
      try {
        await db.deleteInvoice(id);
        const updatedInvoices = await db.getInvoices(); // Refresh list
        setInvoices(updatedInvoices);
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerGst?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Invoice History</h2>
          <p className="text-slate-500">Manage and view all your generated bills.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
           <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Total Value</p>
              <p className="text-lg font-bold text-slate-700">₹{totalRevenue.toLocaleString()}</p>
           </div>
           <div className="h-8 w-px bg-slate-200"></div>
           <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Count</p>
              <p className="text-lg font-bold text-slate-700">{filteredInvoices.length}</p>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute top-3 left-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Invoice #, Customer Name or GSTIN..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
             onClick={() => navigate('/billing')}
             className="w-full sm:w-auto px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-sky-600 transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
          >
             <FileText size={18} /> Create New
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4 text-center">Total Qty</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-primary">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{inv.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{inv.customerName}</div>
                    {inv.customerGst && <div className="text-xs text-slate-400 mt-0.5">GST: {inv.customerGst}</div>}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                     {inv.items.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      inv.paymentMode === 'Cash' ? 'bg-green-50 text-green-600 border-green-100' : 
                      inv.paymentMode === 'Credit' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {inv.paymentMode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">
                    ₹{inv.grandTotal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleView(inv)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Preview">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handlePrint(inv)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Print">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <FileText size={32} className="text-slate-300" />
                       <p>No invoices found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* PDF Preview Modal */}
       {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

export default InvoiceList;
