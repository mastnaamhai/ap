
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/storage';
import { Invoice, Product, AppSettings } from '../types';
import { generateInvoicePDF } from '../services/invoiceGenerator';
import { AlertTriangle, Activity, RefreshCw, IndianRupee, TrendingUp, TrendingDown, Clock, Printer, FileText, Eye, Trash2, Edit, X, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
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
  });
  const [loading, setLoading] = useState(true);
  
  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, prods, settings] = await Promise.all([
        db.getInvoices(),
        db.getProducts(),
        db.getSettings()
      ]);
      setInvoices(inv);
      setProducts(prods);
      setSettings(settings);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Still set defaults for offline viewing
      setInvoices([]);
      setProducts([]);
      setSettings({
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
      });
    }
    setLoading(false);
  };

  const getExpiringItems = () => {
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + 90); // 3 months
    return products.filter(p => new Date(p.expiryDate) <= warningDate);
  };

  const calculateSalesData = () => {
    const data: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dailyTotal = invoices
        .filter(inv => inv.date === dateStr)
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
      data.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), sales: dailyTotal });
    }
    return data;
  };

  const handlePrintInvoice = (inv: Invoice) => {
    generateInvoicePDF(inv, settings);
  };

  const handleViewInvoice = (inv: Invoice) => {
    const url = generateInvoicePDF(inv, settings, true);
    if (typeof url === 'string') {
       setPreviewUrl(url);
    }
  };

  const handleEditInvoice = (inv: Invoice) => {
    navigate('/billing', { state: { invoice: inv } });
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      db.deleteInvoice(id);
      loadData();
    }
  };

  if (loading && invoices.length === 0) return (
    <div className="flex items-center justify-center h-full text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw size={24} className="animate-spin text-primary" />
        <p>Loading Dashboard...</p>
      </div>
    </div>
  );

  const expiring = getExpiringItems();
  const totalRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Business Overview</h2>
          <p className="text-slate-500">Welcome back, here's what's happening today.</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          icon={IndianRupee} 
          color="blue"
          trend="+12% from last week"
          trendUp={true}
        />
        <StatCard 
          title="Total Invoices" 
          value={invoices.length.toString()} 
          icon={Activity} 
          color="indigo"
          trend="Total bills generated"
        />
        <StatCard 
          title="Expiring Batches" 
          value={expiring.length.toString()} 
          icon={Clock} 
          color="rose" 
          alert={expiring.length > 0}
          trend="Within next 3 months"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts and Recent Invoices */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Sales Trend</h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Last 7 Days</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChartComponent data={calculateSalesData()} />
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Invoices Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-slate-400" />
                Recent Invoices
              </h3>
              <button onClick={() => navigate('/invoices')} className="text-primary text-sm font-bold hover:text-sky-700 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-center">Total Qty</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.slice(0, 5).map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{inv.customerName}</td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {inv.items.reduce((s, i) => s + i.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">₹{inv.grandTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleViewInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="View / Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handlePrintInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            title="Print / Download"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">No invoices generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Alerts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[600px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" /> 
            Action Required
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {expiring.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-3">
                  <Activity size={24} />
                </div>
                <p>Everything looks good!</p>
              </div>
            )}
            {expiring.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100 hover:shadow-sm transition-shadow">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-rose-700 font-medium">Exp: {p.expiryDate}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-white text-rose-600 border border-rose-200 rounded-md">Discard</span>
              </div>
            ))}
          </div>
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

const StatCard = ({ title, value, icon: Icon, color, alert, trend, trendUp }: any) => {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    rose: "bg-rose-50 text-rose-600"
  };

  const ringClass = alert ? "ring-2 ring-red-100 border-red-200" : "border-slate-100 hover:border-slate-300";

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${ringClass}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-slate-100 text-slate-600'}`}>
          <Icon size={24} />
        </div>
        {alert && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium">
          {trendUp === true && <TrendingUp size={14} className="text-green-500" />}
          {trendUp === false && <TrendingDown size={14} className="text-red-500" />}
          <span className="text-slate-400">{trend}</span>
        </div>
      )}
    </div>
  );
};

const AreaChartComponent = ({ data }: { data: any[] }) => (
  <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
    <Tooltip 
      cursor={{ fill: '#f8fafc' }}
      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
    />
    <Bar dataKey="sales" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={40} />
  </BarChart>
);

export default Dashboard;
