import React from 'react';
import { ShoppingBag, Package, History, Settings, LogOut, ShieldCheck, UserCheck, Footprints } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'pos' | 'inventory' | 'history' | 'settings';
  setActiveTab: (tab: 'pos' | 'inventory' | 'history' | 'settings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { userRole, username, logout, shopSettings } = useAuth();

  return (
    <header className="bg-white border-b border-[#E7E5EF] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pos')}>
            <div className="p-2.5 bg-[#6D5DFB] rounded-xl shadow-sm text-white flex items-center justify-center">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1E1B4B]">
                {shopSettings.shopName || 'UMA FOOTWEARS'}
              </h1>
              <p className="text-xs text-[#6D5DFB] font-semibold tracking-wide">Sales & Billing CMS</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#F7F8FC] p-1.5 rounded-xl border border-[#E7E5EF]">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'pos'
                  ? 'bg-[#6D5DFB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEEBFF]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Billing (POS)</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'inventory'
                  ? 'bg-[#6D5DFB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEEBFF]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-[#6D5DFB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEEBFF]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Sales Ledger</span>
            </button>

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'settings'
                    ? 'bg-[#6D5DFB] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEEBFF]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Admin Settings</span>
              </button>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-3">
            
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 bg-[#EEEBFF] border border-[#E7E5EF] rounded-xl">
              {userRole === 'admin' ? (
                <div className="p-1 bg-[#F59E0B]/15 text-[#F59E0B] rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 bg-[#22C55E]/15 text-[#22C55E] rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-[#1E1B4B] capitalize">{username || userRole}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider">
                  {userRole === 'admin' ? (
                    <span className="text-[#F59E0B]">Admin Mode</span>
                  ) : (
                    <span className="text-[#22C55E]">Staff Mode</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 border border-[#E7E5EF] hover:border-[#EF4444]/30 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#E7E5EF]">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center py-1 text-xs font-medium ${
              activeTab === 'pos' ? 'text-[#6D5DFB] font-bold' : 'text-[#64748B]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mb-0.5" />
            Billing
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center py-1 text-xs font-medium ${
              activeTab === 'inventory' ? 'text-[#6D5DFB] font-bold' : 'text-[#64748B]'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 text-xs font-medium ${
              activeTab === 'history' ? 'text-[#6D5DFB] font-bold' : 'text-[#64748B]'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            Sales
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center py-1 text-xs font-medium ${
                activeTab === 'settings' ? 'text-[#6D5DFB] font-bold' : 'text-[#64748B]'
              }`}
            >
              <Settings className="w-4 h-4 mb-0.5" />
              Admin
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
