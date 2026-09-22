import React, { useState } from 'react';
import { Footprints, ShieldCheck, UserCheck, Key, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginModal: React.FC = () => {
  const { login, shopSettings } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [usernameInput, setUsernameInput] = useState<string>('staff');
  const [passwordInput, setPasswordInput] = useState<string>('123');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'admin') {
      setUsernameInput('admin');
      setPasswordInput('123');
    } else {
      setUsernameInput('staff');
      setPasswordInput('123');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = login(selectedRole, usernameInput, passwordInput);
    if (!res.success) {
      setErrorMessage(res.message || 'Login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-[#E7E5EF] rounded-3xl max-w-md w-full p-8 shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-[#EEEBFF] text-[#6D5DFB] rounded-2xl mb-1">
            <Footprints className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B]">
            {shopSettings.shopName || 'UMA FOOTWEARS'}
          </h1>
          <p className="text-xs text-[#64748B]">Sales POS & Inventory Access System</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F7F8FC] border border-[#E7E5EF] rounded-2xl">
          <button
            type="button"
            onClick={() => handleRoleChange('staff')}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
              selectedRole === 'staff'
                ? 'bg-[#6D5DFB] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#1E1B4B]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Staff Access</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
              selectedRole === 'admin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#1E1B4B]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Access</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#EF4444] font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] focus:border-[#6D5DFB] focus:outline-none rounded-xl px-4 py-3 text-sm font-medium transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] focus:border-[#6D5DFB] focus:outline-none rounded-xl px-4 py-3 text-sm font-medium transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <span>Login to {selectedRole === 'admin' ? 'Admin Panel' : 'Staff Billing'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Footer */}
        <div className="pt-4 border-t border-[#E7E5EF] text-center space-y-2">
          <p className="text-[11px] text-[#64748B] font-semibold flex items-center justify-center space-x-1">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            <span>Default Test Credentials</span>
          </p>
          <div className="flex justify-center space-x-3 text-xs font-mono">
            <button
              onClick={() => handleRoleChange('staff')}
              className="px-2.5 py-1 bg-[#F7F8FC] border border-[#E7E5EF] rounded-lg text-[#22C55E] hover:bg-emerald-50 font-bold"
            >
              Staff: staff / 123
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className="px-2.5 py-1 bg-[#F7F8FC] border border-[#E7E5EF] rounded-lg text-[#F59E0B] hover:bg-amber-50 font-bold"
            >
              Admin: admin / 123
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
