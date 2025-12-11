
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, Settings, FileText, Menu, X, Stethoscope, LogOut, ScrollText } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Invoicing from './pages/Invoicing';
import InvoiceList from './pages/InvoiceList';
import AppSettingsPage from './pages/Settings';
import Login from './pages/Login';
import { db } from './services/storage';
import { AppSettings } from './types';

const App = () => {
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Load settings
      try {
        const loadedSettings = await db.getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.log('Using default settings due to error:', error);
      }

      // Check authentication
      const auth = localStorage.getItem('isAuthenticated');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    initApp();
  }, []);

  const refreshSettings = async () => {
    try {
      const loadedSettings = await db.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.log('Error refreshing settings:', error);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        {/* Sidebar */}
        <Sidebar pharmacyName={settings.pharmacyName} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header pharmacyName={settings.pharmacyName} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto h-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/billing" element={<Invoicing settings={settings} />} />
                <Route path="/invoices" element={<InvoiceList />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/settings" element={<AppSettingsPage onSave={refreshSettings} />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

const Sidebar = ({ pharmacyName, onLogout }: { pharmacyName: string; onLogout: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // For mobile

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'New Billing', path: '/billing' },
    { icon: ScrollText, label: 'All Invoices', path: '/invoices' },
    { icon: Package, label: 'Products', path: '/inventory' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const toggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-3 left-4 z-50">
        <button onClick={toggle} className="p-2.5 bg-white rounded-xl shadow-md text-slate-700 border border-slate-100">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none`}>
        <div className="h-full flex flex-col">
          <div className="p-8 pb-6 flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Stethoscope className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none tracking-tight">ActiMed LifeScience</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide opacity-80">PRO EDITION</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 translate-x-1' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <item.icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-semibold tracking-wide text-sm">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800/50 bg-slate-900">
             <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 mb-2 rounded-xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors font-semibold text-sm"
             >
                <LogOut size={20} />
                <span>Sign Out</span>
             </button>

            <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3 mt-2 border border-slate-700/50">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                A
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-sm font-bold text-white truncate">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity" onClick={toggle}></div>
      )}
    </>
  );
};

const Header = ({ pharmacyName }: { pharmacyName: string }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md h-20 flex items-center justify-end px-8 md:justify-between sticky top-0 z-20">
      <div className="hidden md:block pl-2">
        <h2 className="text-lg font-bold text-slate-700">{pharmacyName}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</span>
          <span className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-200 transition-colors cursor-pointer">
          <Settings size={18} />
        </div>
      </div>
    </header>
  );
};

export default App;
