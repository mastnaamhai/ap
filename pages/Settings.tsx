
import React, { useState, useRef } from 'react';
import { db } from '../services/storage';
import { AppSettings } from '../types';
import { Save, Upload, Building2, Landmark, FileText, PenTool, X, Shield, Download, FileSpreadsheet, HardDrive } from 'lucide-react';

const SettingsPage = ({ onSave }: { onSave: () => void }) => {
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit to 500KB
        alert("File size is too large. Please upload an image under 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, signatureImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSignature = () => {
    setSettings({ ...settings, signatureImage: '' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(settings);
    onSave();
    alert('Settings Saved Successfully');
  };

  // --- Password Management ---
  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match!");
      return;
    }
    if (passwords.new.length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }
    if (!db.verifyPassword(passwords.current)) {
      alert("Current password is incorrect.");
      return;
    }
    db.updatePassword(passwords.new);
    alert("Password updated successfully!");
    setPasswords({ current: '', new: '', confirm: '' });
  };

  // --- Data Management ---
  const handleDownloadBackup = async () => {
    try {
      const jsonStr = await db.createBackup();
      const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `actimed_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Failed to create backup. Please try again.');
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: This will overwrite all current data (Invoices, Products, Customers). Are you sure?")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = db.restoreBackup(content);
      if (success) {
        alert("Data restored successfully! The page will now reload.");
        window.location.reload();
      } else {
        alert("Failed to restore. Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await db.exportInvoicesCSV();
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-slate-500">Manage your pharmacy profile, security, and data.</p>
        </div>
        <button 
          onClick={handleSave} 
          className="hidden md:flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-sky-600 shadow-md transition-all font-medium active:scale-95"
        >
          <Save size={18} /> Save Profile
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Company Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Pharmacy Profile</h3>
          </div>
          
          <div className="space-y-4">
            <InputField label="Pharmacy Name" name="pharmacyName" value={settings.pharmacyName} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Phone Number" name="phone" value={settings.phone} onChange={handleChange} />
              <InputField label="GSTIN" name="gstin" value={settings.gstin} onChange={handleChange} />
            </div>
            <InputField label="Drug License (DL) No" name="dlNumber" value={settings.dlNumber} onChange={handleChange} />
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Address</label>
              <textarea 
                name="address" 
                rows={3}
                value={settings.address} 
                onChange={handleChange} 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700 resize-none bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Branding & Signature */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PenTool size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Branding & Signature</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">Authorized Signature</label>
              <div className="flex flex-col gap-4">
                {settings.signatureImage ? (
                  <div className="relative w-full h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                    <img src={settings.signatureImage} alt="Signature" className="h-full object-contain p-2" />
                    <button 
                      type="button"
                      onClick={removeSignature}
                      className="absolute top-2 right-2 p-1.5 bg-white shadow-md rounded-full text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center text-slate-400 gap-2"
                  >
                    <Upload size={24} />
                    <span className="text-sm font-medium">Click to upload signature</span>
                    <span className="text-xs text-slate-400">(Max 500KB, PNG/JPG)</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security / Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Security</h3>
          </div>
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1.5">Current Password</label>
               <input 
                 type="password"
                 value={passwords.current} 
                 onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                 className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
               />
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1.5">New Password</label>
               <input 
                 type="password"
                 value={passwords.new} 
                 onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                 className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
               />
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
               <input 
                 type="password"
                 value={passwords.confirm} 
                 onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                 className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
               />
             </div>
             <button 
               type="button" 
               onClick={handlePasswordChange}
               className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
             >
               Update Password
             </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <HardDrive size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Data Management</h3>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
               <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                 <Download size={16} /> Backup & Restore
               </h4>
               <p className="text-xs text-slate-500 mb-4">Save a complete copy of your data or restore from a previous file.</p>
               <div className="flex gap-3">
                 <button 
                   type="button"
                   onClick={handleDownloadBackup}
                   className="flex-1 py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700"
                 >
                   Download JSON
                 </button>
                 <button 
                   type="button"
                   onClick={() => backupInputRef.current?.click()}
                   className="flex-1 py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700"
                 >
                   Restore JSON
                 </button>
                 <input 
                  type="file" 
                  ref={backupInputRef} 
                  onChange={handleRestoreBackup} 
                  accept=".json" 
                  className="hidden" 
                />
               </div>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
               <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                 <FileSpreadsheet size={16} className="text-green-600" /> Export Reports
               </h4>
               <p className="text-xs text-slate-500 mb-4">Download a detailed sales report for Excel/Accounting.</p>
               <button 
                 type="button"
                 onClick={handleExportCSV}
                 className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
               >
                 Export Invoices to .CSV
               </button>
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Landmark size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Bank Details</h3>
          </div>
          <div className="space-y-4">
             <InputField label="Bank Name" name="bankName" value={settings.bankName} onChange={handleChange} />
             <InputField label="Account Number" name="accountNumber" value={settings.accountNumber} onChange={handleChange} />
             <InputField label="IFSC Code" name="ifsc" value={settings.ifsc} onChange={handleChange} />
          </div>
        </div>

        {/* Invoice Terms */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Legal & Terms</h3>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Terms & Conditions</label>
            <textarea 
              name="terms" 
              rows={5} 
              value={settings.terms} 
              onChange={handleChange} 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700 resize-none bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Mobile Save Button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-10">
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform">
            <Save size={20} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange }: { label: string, name: string, value: string, onChange: (e: any) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
    <input 
      name={name} 
      value={value} 
      onChange={onChange} 
      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
    />
  </div>
);

export default SettingsPage;
