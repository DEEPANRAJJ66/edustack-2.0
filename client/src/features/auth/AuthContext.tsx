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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          mapSupabaseUserToStudent(session.user);
        } else {
          setStudent(null);
          setIsLoading(false);
        }
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          mapSupabaseUserToStudent(session.user);
        } else {
          setStudent(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Dev/Demo fallback: check saved demo student or set default
      const saved = localStorage.getItem('edustack_demo_active_student');
      if (saved) {
        try {
          setStudent(JSON.parse(saved));
        } catch {
          setStudent(DEFAULT_DEMO_STUDENT);
        }
      } else {
        setStudent(DEFAULT_DEMO_STUDENT);
        localStorage.setItem('edustack_demo_active_student', JSON.stringify(DEFAULT_DEMO_STUDENT));
      }
      setIsLoading(false);
    }
  }, []);

  const mapSupabaseUserToStudent = async (user: any) => {
    const profile: StudentProfile = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
      email: user.email || '',
      avatarUrl: user.user_metadata?.avatar_url,
    };

    // Ensure profile row exists in profiles table
    if (supabase) {
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
    }

    setStudent(profile);
    setIsLoading(false);
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } else {
      // Demo fallback: switch or activate demo student
      setStudent(DEFAULT_DEMO_STUDENT);
      localStorage.setItem('edustack_demo_active_student', JSON.stringify(DEFAULT_DEMO_STUDENT));
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setStudent(null);
    localStorage.removeItem('edustack_demo_active_student');
  };

  const switchStudentProfile = (id: string, name: string, email: string) => {
    const updated = { id, name, email, avatarUrl: DEFAULT_DEMO_STUDENT.avatarUrl };
    setStudent(updated);
    localStorage.setItem('edustack_demo_active_student', JSON.stringify(updated));
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
