import React, { useState } from 'react';
import { Settings, Key, Store, Download, Upload, RefreshCw, CheckCircle2, ShieldCheck, UserCheck, HardDrive, FileSpreadsheet, Cloud, Database, ExternalLink, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { ExcelExportModal } from './ExcelExportModal';
import { getSupabaseConfig, saveSupabaseConfig, isSupabaseConfigured, testSupabaseConnection } from '../services/supabaseClient';
import { SupabaseStorageService } from '../services/supabaseStorage';

export const AdminSettings: React.FC = () => {
  const { shopSettings, updateSettings, updateUserAccount } = useAuth();

  // User Credential Forms
  const accounts = StorageService.getAccounts();
  const staffAcc = accounts.find(a => a.role === 'staff') || { username: 'staff', password: '123' };
  const adminAcc = accounts.find(a => a.role === 'admin') || { username: 'admin', password: '123' };

  const [staffUser, setStaffUser] = useState(staffAcc.username);
  const [staffPass, setStaffPass] = useState(staffAcc.password);
  const [showStaffPass, setShowStaffPass] = useState(false);

  const [adminUser, setAdminUser] = useState(adminAcc.username);
  const [adminPass, setAdminPass] = useState(adminAcc.password);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Shop Details Form
  const [shopName, setShopName] = useState(shopSettings.shopName);
  const [tagline, setTagline] = useState(shopSettings.tagline || 'where every steps matters');
  const [address, setAddress] = useState(shopSettings.address);
  const [phone, setPhone] = useState(shopSettings.phone);
  const [gstin, setGstin] = useState(shopSettings.gstin);
  const [footerMessage, setFooterMessage] = useState(shopSettings.footerMessage);

  // Status feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Supabase Cloud Configuration State
  const currentCloud = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentCloud.url);
  const [supabaseKey, setSupabaseKey] = useState(currentCloud.key);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleUpdateStaffCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser.trim() || !staffPass.trim()) return;
    updateUserAccount('staff', staffUser.trim(), staffPass.trim());
    showNotification('Staff credentials updated successfully!');
  };

  const handleUpdateAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim() || !adminPass.trim()) return;
    updateUserAccount('admin', adminUser.trim(), adminPass.trim());
    showNotification('Admin credentials updated successfully!');
  };

  const handleUpdateShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName: shopName.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      gstin: gstin.trim(),
      footerMessage: footerMessage.trim()
    });
    showNotification('Shop details and bill header updated!');
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    showNotification('Supabase configuration saved!');
    StorageService.syncWithCloud().then((synced) => {
      if (synced) showNotification('Synced latest data from Supabase Cloud!');
    });
  };

  const handleTestCloud = async () => {
    setIsTestingCloud(true);
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    const res = await testSupabaseConnection();
    setIsTestingCloud(false);
    if (res.success) {
      showNotification(`Cloud Connected: ${res.message}`);
    } else {
      showNotification(`Connection Failed: ${res.message}`, 'error');
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncingCloud(true);
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    const res = await SupabaseStorageService.migrateLocalDataToSupabase();
    setIsSyncingCloud(false);
    if (res.success) {
      showNotification(res.message);
    } else {
      showNotification(res.message, 'error');
    }
  };
  const handleExportDB = () => {
    const jsonStr = StorageService.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uma_footwears_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Database backup downloaded successfully!');
  };

  // Import DB File
  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = StorageService.importDatabase(content);
      if (success) {
        showNotification('Database restored successfully! Reloading page...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showNotification('Invalid database backup file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDB = () => {
    if (window.confirm('Are you sure you want to reset all data back to original seed products and sales?')) {
      StorageService.resetDatabase();
      showNotification('Database reset to defaults. Reloading...');
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Title */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E1B4B] flex items-center space-x-2">
            <Settings className="w-6 h-6 text-[#6D5DFB]" />
            <span>Admin Settings & Credential Control</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Manage Staff/Admin accounts, Shop header for printed bills, and backup data.
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center space-x-3 text-xs font-bold shadow-sm ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-[#22C55E]'
            : 'bg-red-50 border-red-200 text-[#EF4444]'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* STAFF CREDENTIAL CONTROL */}
        <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-[#E7E5EF]">
            <div className="p-2 bg-emerald-50 text-[#22C55E] rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B4B]">Staff Account Credentials</h3>
              <p className="text-xs text-[#64748B]">Change Staff username & login password</p>
            </div>
          </div>

          <form onSubmit={handleUpdateStaffCreds} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Staff Username</label>
              <input
                type="text"
                required
                value={staffUser}
                onChange={(e) => setStaffUser(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 focus:border-[#6D5DFB] focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Staff Password</label>
              <div className="relative">
                <input
                  type={showStaffPass ? 'text' : 'password'}
                  required
                  value={staffPass}
                  onChange={(e) => setStaffPass(e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#22C55E] font-mono text-xs rounded-xl p-2.5 pr-10 focus:border-[#6D5DFB] focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPass(!showStaffPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E1B4B] p-1"
                >
                  {showStaffPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#F7F8FC] hover:bg-[#EEEBFF] text-[#1E1B4B] font-semibold text-xs rounded-xl border border-[#E7E5EF] transition"
            >
              Update Staff Credentials
            </button>
          </form>
        </div>

        {/* ADMIN CREDENTIAL CONTROL */}
        <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-[#E7E5EF]">
            <div className="p-2 bg-amber-50 text-[#F59E0B] rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B4B]">Admin Account Credentials</h3>
              <p className="text-xs text-[#64748B]">Change Admin username & master password</p>
            </div>
          </div>

          <form onSubmit={handleUpdateAdminCreds} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Admin Username</label>
              <input
                type="text"
                required
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 focus:border-[#6D5DFB] focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Admin Password</label>
              <div className="relative">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#F59E0B] font-mono text-xs rounded-xl p-2.5 pr-10 focus:border-[#6D5DFB] focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E1B4B] p-1"
                >
                  {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs rounded-xl transition"
            >
              Update Admin Credentials
            </button>
          </form>
        </div>

      </div>

      {/* SHOP DETAILS & PRINT HEADER EDITING */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-[#E7E5EF]">
          <div className="p-2 bg-[#EEEBFF] text-[#6D5DFB] rounded-xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Shop Branding & Bill Layout</h3>
            <p className="text-xs text-[#64748B]">Customize header details printed on bill receipts</p>
          </div>
        </div>

        <form onSubmit={handleUpdateShopInfo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Shop Name</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Tagline (Printed on Bill)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. where every steps matters"
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Phone Number(s)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">GSTIN Number (Optional)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-mono font-medium focus:outline-none focus:border-[#6D5DFB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Shop Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Bill Footer Terms / Message</label>
            <input
              type="text"
              required
              value={footerMessage}
              onChange={(e) => setFooterMessage(e.target.value)}
              className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Save Shop Branding Settings
          </button>
        </form>
      </div>

      {/* SUPABASE CLOUD DATABASE & VERCEL ONLINE HOSTING */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E5EF]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#EEEBFF] text-[#6D5DFB] rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B4B] flex items-center space-x-2">
                <span>Supabase Cloud Database & Vercel Hosting</span>
                {isSupabaseConfigured() ? (
                  <span className="px-2.5 py-0.5 text-[10px] bg-emerald-100 text-[#22C55E] rounded-full font-bold">
                    Connected 🟢
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] bg-amber-100 text-[#F59E0B] rounded-full font-bold">
                    Local Storage Mode 🟡
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#64748B]">Real-time cloud multi-device sync with PostgreSQL & zero-downtime offline support</p>
            </div>
          </div>
        </div>

        <div className="bg-[#F7F8FC] p-4 rounded-xl border border-[#E7E5EF] text-xs text-[#1E1B4B] leading-relaxed space-y-2">
          <p>
            🌐 <strong className="text-[#1E1B4B]">How to Connect Supabase:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[#64748B] pl-1">
            <li>Open <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#6D5DFB] font-semibold underline">Supabase.com</a> and create a free project.</li>
            <li>In Supabase, open <strong>SQL Editor</strong>, paste the content from <code className="text-[#1E1B4B] font-bold">supabase_schema.sql</code>, and click <strong>Run</strong>.</li>
            <li>Go to <strong>Project Settings → API</strong>, copy your <strong>Project URL</strong> and <strong>Anon Key</strong>, then enter them below:</li>
          </ol>
        </div>

        <form onSubmit={handleSaveSupabase} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-mono focus:outline-none focus:border-[#6D5DFB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-xl p-2.5 font-mono focus:outline-none focus:border-[#6D5DFB]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="py-2.5 px-5 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Save Cloud Config
            </button>

            <button
              type="button"
              onClick={handleTestCloud}
              disabled={isTestingCloud || !supabaseUrl}
              className="py-2.5 px-4 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-[#6D5DFB] border border-[#E7E5EF] font-semibold text-xs rounded-xl transition disabled:opacity-50"
            >
              {isTestingCloud ? 'Testing...' : 'Test Cloud Connection'}
            </button>

            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={isSyncingCloud || !supabaseUrl}
              className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#22C55E] border border-emerald-200 font-semibold text-xs rounded-xl transition disabled:opacity-50"
            >
              {isSyncingCloud ? 'Syncing...' : 'Upload Local Products & Settings to Cloud'}
            </button>
          </div>
        </form>

        {/* Deploy on Vercel Helper Note */}
        <div className="p-4 bg-[#EEEBFF]/60 border border-[#E7E5EF] rounded-xl text-xs space-y-2">
          <div className="flex items-center space-x-2 text-[#6D5DFB] font-bold">
            <ExternalLink className="w-4 h-4" />
            <span>Deploy Online via Vercel (100% Free)</span>
          </div>
          <p className="text-[#1E1B4B] leading-relaxed">
            1. Push this project to a GitHub repository. <br />
            2. Open <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-[#6D5DFB] underline font-bold">Vercel.com/new</a> and import your repo. <br />
            3. In the Vercel project settings under <strong>Environment Variables</strong>, add: <br />
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E7E5EF] text-[#6D5DFB] inline-block my-1">
              VITE_SUPABASE_URL
            </span> and <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E7E5EF] text-[#6D5DFB] inline-block my-1">
              VITE_SUPABASE_ANON_KEY
            </span> <br />
            4. Click <strong>Deploy</strong> — your live online billing POS will be accessible from anywhere on mobile, tablet, or PC!
          </p>
        </div>
      </div>

      {/* DATABASE EXPORT, IMPORT & STORAGE EXPLANATION */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-[#E7E5EF]">
          <div className="p-2 bg-[#EEEBFF] text-[#6D5DFB] rounded-xl">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Database Backup & Storage</h3>
            <p className="text-xs text-[#64748B]">Where database is stored & how to download backups</p>
          </div>
        </div>

        <div className="bg-[#F7F8FC] p-4 rounded-xl border border-[#E7E5EF] text-xs text-[#1E1B4B] leading-relaxed space-y-2">
          <p>
            💡 <strong className="text-[#1E1B4B]">Database Storage Location:</strong> All inventory items, prices, wholesale costs, sales history, and login credentials are automatically saved in the browser's persistent <code className="bg-white text-[#6D5DFB] px-1.5 py-0.5 rounded border border-[#E7E5EF] font-mono font-semibold">localStorage</code> database.
          </p>
          <p>
            You can export your complete shop database to a <code className="text-amber-800 font-bold">.json</code> file anytime for offline backup, or restore it onto another device/computer instantly!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          
          {/* Export JSON Button */}
          <button
            onClick={handleExportDB}
            className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#22C55E] border border-emerald-200 font-semibold text-xs rounded-xl flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export DB (Download JSON Backup)</span>
          </button>

          {/* Import JSON Button */}
          <label className="py-2.5 px-4 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-[#6D5DFB] border border-[#E7E5EF] font-semibold text-xs rounded-xl flex items-center space-x-2 cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <span>Import DB (Restore JSON File)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportDB}
              className="hidden"
            />
          </label>

          {/* Reset DB Button */}
          <button
            onClick={handleResetDB}
            className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#EF4444] border border-red-200 font-semibold text-xs rounded-xl flex items-center space-x-2 transition ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Data to Defaults</span>
          </button>

        </div>

      </div>

      {/* EXCEL SALES DATA EXPORT (DAY, MONTH, YEAR WISE) */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-[#E7E5EF]">
          <div className="p-2 bg-emerald-50 text-[#22C55E] rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Excel Reports Export (.xlsx)</h3>
            <p className="text-xs text-[#64748B]">Generate day-wise, month-wise, or year-wise sales spreadsheets for accounting</p>
          </div>
        </div>

        <div className="bg-[#F7F8FC] p-4 rounded-xl border border-[#E7E5EF] text-xs text-[#1E1B4B] leading-relaxed space-y-2">
          <p>
            📊 <strong className="text-[#1E1B4B]">Structured Financial Worksheets:</strong> Generates formatted Excel workbooks with two dedicated tabs:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#64748B] pl-1">
            <li><strong>Summary Report:</strong> Overall turnover, discounts, cash/UPI collections, wholesale costs, and net margins.</li>
            <li><strong>Sales Ledger:</strong> Detailed line-by-line breakdown with customer names, items, quantities, and payment modes.</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="py-2.5 px-5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold text-xs rounded-xl flex items-center space-x-2 shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Sales Data (Day / Month / Year)</span>
          </button>
        </div>
      </div>

      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={StorageService.getTransactions()}
      />

    </div>
  );
};
