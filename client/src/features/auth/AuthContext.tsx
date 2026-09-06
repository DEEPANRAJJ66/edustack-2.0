// ==============================================================================
// EDUSTACK 2.0 — AUTHENTICATION CONTEXT (GOOGLE OAUTH & STUDENT IDENTITY)
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { storageAdapter } from '../../services/storageAdapter';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  student: StudentProfile | null;
  user: any | null;
  isGoogleAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseActive: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // For testing multi-student attempt numbering isolation:
  switchStudentProfile: (studentId: string, name: string, email: string) => void;
}

export const DEFAULT_DEMO_STUDENT: StudentProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Arjun Sharma',
  email: 'arjun.sharma@edustack.app',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

const getInitialStudent = (): StudentProfile => {
  try {
    const saved = localStorage.getItem('edustack_demo_active_student');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_DEMO_STUDENT;
};

/**
 * Environment-aware OAuth Redirect URL resolver:
 * - Production: strictly 'https://edustack-2-0.vercel.app' (or configured production domain)
 * - Local Development: 'http://localhost:3000' (or current development port)
 * - Never returns localhost when running in production.
 */
export const getAuthRedirectUrl = (): string => {
  // 1. Check explicit environment override
  const envOverride = import.meta.env.VITE_AUTH_REDIRECT_URL || import.meta.env.VITE_APP_URL;
  if (envOverride && !envOverride.includes('localhost') && !envOverride.includes('127.0.0.1')) {
    return envOverride.replace(/\/+$/, '');
  }

  // 2. Check current browser window location
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }

  // 3. If built in production mode (import.meta.env.PROD), ALWAYS default to the production Vercel URL
  if (import.meta.env.PROD) {
    return 'https://edustack-2-0.vercel.app';
  }

  // 4. Local development mode
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:3000';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentProfile | null>(getInitialStudent());
  const [user, setUser] = useState<any | null>(null);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const search = window.location.search;
      const hash = window.location.hash;
      const hasCode = search.includes('code=');
      const hasAccessToken = hash.includes('access_token=');
      const hasError = search.includes('error=') || hash.includes('error=');

      // Check if OAuth callback returned an error from Google/Supabase
      if (hasError) {
        const params = new URLSearchParams(search);
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const errDesc = params.get('error_description') || hashParams.get('error_description');
        const errCode = params.get('error') || hashParams.get('error');
        console.error('[Auth] OAuth error returned in callback URL:', errCode, errDesc);
        alert(`Google Authentication Notice: ${errDesc || errCode || 'Sign-in was cancelled or encountered an error.'}`);
      }

      // If returning with authorization code, explicitly trigger exchange
      if (hasCode) {
        const params = new URLSearchParams(search);
        const code = params.get('code');
        if (code) {
          supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
            if (!error && data?.session?.user) {
              mapSupabaseUserToStudent(data.session.user);
              if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } else if (error) {
              console.warn('[Auth] Code exchange error:', error.message);
            }
          }).catch((err) => {
            console.warn('[Auth] Code exchange exception:', err);
          });
        }
      }

      // Check existing session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!error && session?.user) {
          mapSupabaseUserToStudent(session.user);
        } else if (!hasCode && !hasAccessToken) {
          setUser(null);
          setIsGoogleAuthenticated(false);
          setStudent(getInitialStudent());
          setIsLoading(false);
        }
      }).catch((err) => {
        console.warn('[Auth] Supabase getSession warning, using local profile:', err);
        if (!hasCode && !hasAccessToken) {
          setUser(null);
          setIsGoogleAuthenticated(false);
          setStudent(getInitialStudent());
          setIsLoading(false);
        }
      });

      // Listen for all OAuth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] Auth state change event:', event);
        if (session?.user) {
          await mapSupabaseUserToStudent(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsGoogleAuthenticated(false);
          setStudent(DEFAULT_DEMO_STUDENT);
          localStorage.setItem('edustack_demo_active_student', JSON.stringify(DEFAULT_DEMO_STUDENT));
          setIsLoading(false);
        } else if (!hasCode && !hasAccessToken) {
          setUser(null);
          setIsGoogleAuthenticated(false);
          setStudent(getInitialStudent());
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setUser(null);
      setIsGoogleAuthenticated(false);
      setStudent(getInitialStudent());
      setIsLoading(false);
    }
  }, []);

  const mapSupabaseUserToStudent = async (u: any) => {
    setUser(u);
    setIsGoogleAuthenticated(true);

    const profile: StudentProfile = {
      id: u.id,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Student',
      email: u.email || '',
      avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || DEFAULT_DEMO_STUDENT.avatarUrl,
    };

    // Ensure profile row exists in PostgreSQL profiles table
    if (supabase) {
      try {
        await supabase.from('profiles').upsert(
          {
            id: u.id,
            name: profile.name,
            email: profile.email,
            avatar_url: profile.avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('[Auth] Supabase profile upsert warning:', err);
      }
    }

    // Preserve any existing attempts taken as guest in this session
    try {
      await storageAdapter.linkGuestAttemptsToStudent(
        DEFAULT_DEMO_STUDENT.id,
        u.id
      );
    } catch (err) {
      console.warn('[Auth] Guest attempt linking notice:', err);
    }

    setStudent(profile);
    localStorage.setItem('edustack_demo_active_student', JSON.stringify(profile));
    setIsLoading(false);
  };

  const signInWithGoogle = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        const redirectUrl = getAuthRedirectUrl();
        console.log('[Auth] Initiating Google OAuth with redirect destination:', redirectUrl);

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('[Auth] Google sign-in error:', error);
          alert(
            'Google Sign-In Notice: ' + error.message + 
            '\n\nPlease verify in Supabase Dashboard -> Authentication -> URL Configuration that "' +
            redirectUrl + '" is set as the Site URL or added to the Redirect URLs list.'
          );
        }
      } else {
        alert('Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
      }
    } catch (err: any) {
      console.error('[Auth] Sign-in exception:', err);
      alert('Sign-In Error: ' + (err?.message || 'Failed to initiate Google sign in.'));
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Sign out warning:', err);
      }
    }
    setUser(null);
    setIsGoogleAuthenticated(false);
    setStudent(DEFAULT_DEMO_STUDENT);
    localStorage.setItem('edustack_demo_active_student', JSON.stringify(DEFAULT_DEMO_STUDENT));
    setIsLoading(false);
  };

  const switchStudentProfile = async (id: string, name: string, email: string) => {
    setUser(null);
    setIsGoogleAuthenticated(false);

    const updated = { id, name, email, avatarUrl: DEFAULT_DEMO_STUDENT.avatarUrl };
    setStudent(updated);
    localStorage.setItem('edustack_demo_active_student', JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').upsert(
          {
            id,
            name,
            email,
            avatar_url: updated.avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('[Auth] Could not sync profile to Supabase:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        user,
        isGoogleAuthenticated,
        isLoading,
        isSupabaseActive: isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        switchStudentProfile,
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
