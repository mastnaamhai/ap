import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { Customer } from '../types';
import { Search, UserPlus, Phone, MapPin, Trash2 } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await db.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newCustomer: Customer = {
      id: 'c' + Date.now(),
      name: formData.get('name') as string,
      mobile: formData.get('mobile') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      gstin: formData.get('gstin') as string,
      state: formData.get('state') as string,
    };

    try {
      await db.saveCustomer(newCustomer);
      const updatedCustomers = await db.getCustomers();
      setCustomers(updatedCustomers);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Failed to save customer. Please try again.');
    }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-sky-600"
        >
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg mb-4 max-w-md border border-slate-200">
          <Search size={20} className="text-slate-400" />
          <input 
            className="bg-transparent outline-none w-full"
            placeholder="Search by name or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow bg-slate-50 group">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">{c.name}</h3>
                <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">{c.state}</span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} /> {c.mobile}
                </div>
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} /> {c.address}
                  </div>
                )}
                {c.gstin && <div className="text-xs text-primary font-mono mt-2">GSTIN: {c.gstin}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Customer</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input name="name" placeholder="Full Name *" required className="w-full p-2 border rounded" />
              <input name="mobile" placeholder="Mobile Number *" required className="w-full p-2 border rounded" />
              <input name="email" placeholder="Email" className="w-full p-2 border rounded" />
              <input name="address" placeholder="Address" className="w-full p-2 border rounded" />
              <input name="state" placeholder="State *" required defaultValue="Maharashtra" className="w-full p-2 border rounded" />
              <input name="gstin" placeholder="GSTIN (Optional)" className="w-full p-2 border rounded" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
