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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentProfile | null>(getInitialStudent());
  const [user, setUser] = useState<any | null>(null);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Check existing session on load / refresh / browser reopen
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!error && session?.user) {
          mapSupabaseUserToStudent(session.user);
        } else {
          setUser(null);
          setIsGoogleAuthenticated(false);
          setStudent(getInitialStudent());
          setIsLoading(false);
        }
      }).catch((err) => {
        console.warn('Supabase getSession error, using local student profile:', err);
        setUser(null);
        setIsGoogleAuthenticated(false);
        setStudent(getInitialStudent());
        setIsLoading(false);
      });

      // 2. Listen for OAuth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await mapSupabaseUserToStudent(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsGoogleAuthenticated(false);
          setStudent(DEFAULT_DEMO_STUDENT);
          localStorage.setItem('edustack_demo_active_student', JSON.stringify(DEFAULT_DEMO_STUDENT));
          setIsLoading(false);
        } else {
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
        console.warn('Supabase profile upsert warning:', err);
      }
    }

    // Preserve any existing attempts taken as guest in this session
    try {
      await storageAdapter.linkGuestAttemptsToStudent(
        DEFAULT_DEMO_STUDENT.id,
        u.id
      );
    } catch (err) {
      console.warn('Guest attempt linking notice:', err);
    }

    setStudent(profile);
    localStorage.setItem('edustack_demo_active_student', JSON.stringify(profile));
    setIsLoading(false);
  };

  const signInWithGoogle = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('Google sign-in error:', error);
          alert('Google Sign-In Notice: ' + error.message + '\n\nPlease ensure Google Provider is enabled in Supabase Authentication -> Providers -> Google.');
        }
      } else {
        alert('Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      alert('Sign-In Error: ' + (err?.message || 'Failed to initiate Google sign in.'));
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
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
        console.warn('Could not sync profile to Supabase:', err);
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
