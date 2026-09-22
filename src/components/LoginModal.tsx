import React, { useState } from 'react';
import { Footprints, ShieldCheck, UserCheck, Key, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginModal: React.FC = () => {
  const { login, shopSettings } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    const res = login(selectedRole, usernameInput.trim(), passwordInput.trim());
    if (!res.success) {
      setErrorMessage(res.message || 'Login failed. Please check your credentials.');
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
              autoFocus
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder={`Enter ${selectedRole} username`}
              className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] focus:border-[#6D5DFB] focus:outline-none rounded-xl px-4 py-3 text-sm font-medium transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] focus:border-[#6D5DFB] focus:outline-none rounded-xl pl-4 pr-11 py-3 text-sm font-medium transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E1B4B] p-1.5 rounded-lg hover:bg-[#EEEBFF]/50 transition"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <span>Login to {selectedRole === 'admin' ? 'Admin Panel' : 'Staff Billing'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
