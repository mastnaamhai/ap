
import React, { useState } from 'react';
import { Lock, Stethoscope, ArrowRight } from 'lucide-react';
import { db } from '../services/storage';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await db.verifyPassword(password);
    if (success) {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Side - Brand */}
        <div className="bg-primary p-8 md:p-12 text-white flex flex-col justify-center items-start w-full md:w-1/2 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
             <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <Stethoscope size={32} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">ActiMed LifeScience</h1>
            <p className="text-sky-100 text-lg mb-8">Advanced Life Sciences & Pharmacy Management</p>
            <div className="space-y-4 text-sky-50 text-sm hidden sm:block">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                 <span>Secure Inventory Tracking</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                 <span>GST Compliant Billing</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                 <span>Detailed Sales Reports</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-white relative">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-8">Please enter your credentials to access.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-slate-50 text-base"
                  placeholder="Enter password"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2 animate-pulse border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-200"
            >
              <span>Login to Dashboard</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <p className="absolute bottom-6 left-0 w-full text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} ActiMed LifeScience. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
