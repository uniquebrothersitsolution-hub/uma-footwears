import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BillingPOS } from './components/BillingPOS';
import { AdminInventory } from './components/AdminInventory';
import { SalesHistory } from './components/SalesHistory';
import { AdminSettings } from './components/AdminSettings';
import { LoginModal } from './components/LoginModal';
import { PrintBillModal } from './components/PrintBillModal';
import { SaleTransaction } from './types';
import { StorageService } from './services/storage';
import { subscribeToRealtimeChanges } from './services/supabaseClient';

export const App: React.FC = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'history' | 'settings'>('pos');
  const [printingTransaction, setPrintingTransaction] = useState<SaleTransaction | null>(null);

  // Sync latest inventory, bills, and settings from Supabase Cloud on mount & realtime updates
  useEffect(() => {
    // Initial sync
    StorageService.syncWithCloud().catch(err => console.log('Initial cloud sync notice:', err));

    // Realtime subscription across all devices
    const unsubscribeRealtime = subscribeToRealtimeChanges((table) => {
      console.log(`Live change detected on ${table}, auto-syncing...`);
      StorageService.syncWithCloud().catch(err => console.error('Realtime sync error:', err));
    });

    // Auto-sync when window gains focus (e.g. user returns to this browser tab)
    const handleFocus = () => {
      StorageService.syncWithCloud().catch(() => {});
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // When a user logs in, pull the latest cloud entries immediately
  useEffect(() => {
    if (userRole) {
      StorageService.syncWithCloud().catch(err => console.log('Login cloud sync notice:', err));
    }
  }, [userRole]);

  if (!userRole) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1E1B4B] flex flex-col font-sans">
      
      {/* Navigation Header */}
      <div className="no-print">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
        {activeTab === 'pos' && (
          <BillingPOS onPrintBill={(tx) => setPrintingTransaction(tx)} />
        )}

        {activeTab === 'inventory' && (
          <AdminInventory />
        )}

        {activeTab === 'history' && (
          <SalesHistory onPrintBill={(tx) => setPrintingTransaction(tx)} />
        )}

        {activeTab === 'settings' && userRole === 'admin' && (
          <AdminSettings />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#E7E5EF] text-center text-xs text-[#64748B] font-medium no-print">
        UMA FOOTWEARS Billing & Inventory Management System &copy; {new Date().getFullYear()}
      </footer>

      {/* Print Receipt Modal */}
      {printingTransaction && (
        <PrintBillModal
          transaction={printingTransaction}
          onClose={() => setPrintingTransaction(null)}
        />
      )}

    </div>
  );
};

export default App;
