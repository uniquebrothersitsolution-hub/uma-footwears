import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, ShopSettings } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
  userRole: UserRole | null;
  username: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (role: UserRole, user: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  shopSettings: ShopSettings;
  updateSettings: (newSettings: ShopSettings) => void;
  updateUserAccount: (targetRole: UserRole, newUser: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem('uma_active_role') as UserRole) || null;
  });
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('uma_active_username') || '';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('uma_theme') as 'light' | 'dark') || 'light';
  });
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => StorageService.getShopSettings());

  useEffect(() => {
    if (userRole) {
      localStorage.setItem('uma_active_role', userRole);
      localStorage.setItem('uma_active_username', username);
    } else {
      localStorage.removeItem('uma_active_role');
      localStorage.removeItem('uma_active_username');
    }
  }, [userRole, username]);

  useEffect(() => {
    localStorage.setItem('uma_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const login = (role: UserRole, user: string, pass: string) => {
    const accounts = StorageService.getAccounts();
    const account = accounts.find(
      a => a.role === role && a.username.trim().toLowerCase() === user.trim().toLowerCase()
    );

    if (!account) {
      return { success: false, message: 'Invalid username for selected role.' };
    }

    if (account.password !== pass) {
      return { success: false, message: 'Incorrect password.' };
    }

    setUserRole(role);
    setUsername(account.username);
    return { success: true };
  };

  const logout = () => {
    setUserRole(null);
    setUsername('');
  };

  const updateSettings = (newSettings: ShopSettings) => {
    StorageService.saveShopSettings(newSettings);
    setShopSettings(newSettings);
  };

  const updateUserAccount = (targetRole: UserRole, newUser: string, newPass: string) => {
    StorageService.updateAccountCredentials(targetRole, newUser, newPass);
    if (userRole === targetRole) {
      setUsername(newUser);
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        userRole,
        username,
        theme,
        toggleTheme,
        login,
        logout,
        shopSettings,
        updateSettings,
        updateUserAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
