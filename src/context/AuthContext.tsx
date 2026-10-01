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

export const getApiUrl = (endpoint: string): string => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

async function safeParseResponse(res: Response, defaultAction: string) {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (data?.error) {
      return { ok: false, error: data.error };
    }
    if (res.status === 404) {
      return {
        ok: false,
        error: `API endpoint ${res.url || ''} not found (404). Ensure Vercel serverless functions are deployed.`
      };
    }
    if (res.status === 500) {
      return {
        ok: false,
        error: data?.error || `Server error (500) during ${defaultAction}. Please check server logs.`
      };
    }
    return {
      ok: false,
      error: `${defaultAction} failed with status ${res.status} (${res.statusText || 'Error'}).`
    };
  }

  if (!data) {
    return {
      ok: false,
      error: `Server returned non-JSON response during ${defaultAction}.`
    };
  }

  return { ok: true, data };
}

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
      const res = await fetch(getApiUrl('/api/auth/me'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const parseRes = await safeParseResponse(res, 'session refresh');
        if (parseRes.ok && parseRes.data?.user) {
          setUser(parseRes.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('[SkillPath AI] Could not refresh session:', err);
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
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const parsed = await safeParseResponse(res, 'login');
      if (!parsed.ok) {
        return { success: false, error: parsed.error };
      }

      const data = parsed.data;
      if (data.token) {
        localStorage.setItem('skillpath_token', data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      console.error('[SkillPath AI] Login network exception:', err);
      const isFetchFail = err?.name === 'TypeError' || err?.message?.includes('fetch') || err?.message?.includes('network');
      return {
        success: false,
        error: isFetchFail
          ? 'Unable to connect to the backend API. Please check your internet connection or backend deployment status.'
          : (err?.message || 'Login encountered an unexpected error.')
      };
    }
  };

  const loginWithGoogle = async (payload: GoogleAuthPayload) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const parsed = await safeParseResponse(res, 'Google authentication');
      if (!parsed.ok) {
        return { success: false, error: parsed.error };
      }

      const data = parsed.data;
      if (data.token) {
        localStorage.setItem('skillpath_token', data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      console.error('[SkillPath AI] Google auth network exception:', err);
      const isFetchFail = err?.name === 'TypeError' || err?.message?.includes('fetch') || err?.message?.includes('network');
      return {
        success: false,
        error: isFetchFail
          ? 'Unable to connect to the backend API for Google authentication. Verify API is reachable.'
          : (err?.message || 'Google authentication encountered an unexpected error.')
      };
    }
  };

  const register = async (email: string, password: string, fullName: string, role = 'student') => {
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      });

      const parsed = await safeParseResponse(res, 'registration');
      if (!parsed.ok) {
        return { success: false, error: parsed.error };
      }

      const data = parsed.data;
      if (data.token) {
        localStorage.setItem('skillpath_token', data.token);
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      console.error('[SkillPath AI] Registration network exception:', err);
      const isFetchFail = err?.name === 'TypeError' || err?.message?.includes('fetch') || err?.message?.includes('network');
      return {
        success: false,
        error: isFetchFail
          ? 'Unable to reach backend API for registration. Verify backend server is running.'
          : (err?.message || 'Registration encountered an unexpected error.')
      };
    }
  };

  const logout = async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('[SkillPath AI] Logout API call warning:', err);
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
