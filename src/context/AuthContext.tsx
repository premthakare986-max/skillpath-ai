import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { signOutFirebase } from '../lib/firebase.js';

interface GoogleAuthPayload {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  idToken?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (email: string, password: string, fullName: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('skillpath_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch current user session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }
      if (data.token) {
        localStorage.setItem('skillpath_token', data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: 'Network error during login.' };
    }
  };

  const loginWithGoogle = async (payload: GoogleAuthPayload) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google login failed.' };
      }
      if (data.token) {
        localStorage.setItem('skillpath_token', data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: 'Network error during Google authentication.' };
    }
  };

  const register = async (email: string, password: string, fullName: string, role = 'student') => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }
      if (data.token) {
        localStorage.setItem('skillpath_token', data.token);
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error during registration.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      try {
        await signOutFirebase();
      } catch {}
      localStorage.removeItem('skillpath_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
