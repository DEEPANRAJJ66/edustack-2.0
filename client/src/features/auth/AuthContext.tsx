// ==============================================================================
// EDUSTACK 2.0 — AUTHENTICATION CONTEXT (GOOGLE OAUTH & STUDENT IDENTITY)
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  student: StudentProfile | null;
  isLoading: boolean;
  isSupabaseActive: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // For testing multi-student attempt numbering isolation:
  switchStudentProfile: (studentId: string, name: string, email: string) => void;
}

const DEFAULT_DEMO_STUDENT: StudentProfile = {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!error && session?.user) {
          mapSupabaseUserToStudent(session.user);
        } else {
          setStudent(getInitialStudent());
          setIsLoading(false);
        }
      }).catch((err) => {
        console.warn('Supabase getSession error, using local student profile:', err);
        setStudent(getInitialStudent());
        setIsLoading(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          mapSupabaseUserToStudent(session.user);
        } else {
          setStudent(getInitialStudent());
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setStudent(getInitialStudent());
      setIsLoading(false);
    }
  }, []);

  const mapSupabaseUserToStudent = async (user: any) => {
    const profile: StudentProfile = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
      email: user.email || '',
      avatarUrl: user.user_metadata?.avatar_url || DEFAULT_DEMO_STUDENT.avatarUrl,
    };

    // Ensure profile row exists in profiles table
    if (supabase) {
      try {
        await supabase.from('profiles').upsert(
          {
            id: user.id,
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
          },
        });
        if (error) {
          console.warn('Google sign-in warning:', error.message);
          alert('Google Sign-In note: ' + error.message + '\nContinuing with active student: ' + (student?.name || 'Arjun Sharma'));
        }
      } else {
        const def = getInitialStudent();
        setStudent(def);
        localStorage.setItem('edustack_demo_active_student', JSON.stringify(def));
      }
    } catch (err: any) {
      console.warn('Sign-in notice:', err);
      alert('Sign-in note: Continuing with current student profile (' + (student?.name || 'Arjun Sharma') + ')');
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    setStudent(DEFAULT_DEMO_STUDENT);
    localStorage.setItem('edustack_demo_active_student', JSON.stringify(DEFAULT_DEMO_STUDENT));
  };

  const switchStudentProfile = async (id: string, name: string, email: string) => {
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
