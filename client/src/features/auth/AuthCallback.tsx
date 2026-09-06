// ==============================================================================
// EDUSTACK 2.0 — AUTHENTICATION CALLBACK HANDLER
// ==============================================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '../../services/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, isGoogleAuthenticated } = useAuth();

  useEffect(() => {
    // Process code or tokens if present
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const code = params.get('code');

    if (code && supabase) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        navigate('/', { replace: true });
      }).catch((err) => {
        console.warn('Callback exchange error:', err);
        navigate('/', { replace: true });
      });
      return;
    }

    if (!isLoading) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isGoogleAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-lg font-bold font-['Outfit']">Completing Google Authentication</h2>
        <p className="text-xs text-slate-400">
          Syncing your student profile, attempts, and error notes with Supabase Cloud...
        </p>
      </div>
    </div>
  );
};
