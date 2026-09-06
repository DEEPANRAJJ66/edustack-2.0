// ==============================================================================
// EDUSTACK 2.0 — DEMO MODE BANNER (ISOLATES DEV FROM PROD)
// ==============================================================================

import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Database, AlertTriangle } from 'lucide-react';

export const DemoModeBanner: React.FC = () => {
  const { isSupabaseActive } = useAuth();

  if (isSupabaseActive) {
    return (
      <div className="bg-emerald-600 text-white text-xs font-medium py-1 px-4 flex items-center justify-between shadow-inner">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>Supabase Cloud Production Database Connected (Single Source of Truth)</span>
        </div>
        <span className="text-[11px] opacity-90">RLS Active • PostgreSQL</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium py-1.5 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-200" />
        <span>
          <strong>DEVELOPMENT DEMO MODE:</strong> Supabase keys not set in <code className="bg-amber-700/50 px-1 py-0.5 rounded font-mono">.env</code>. Student data is saving to local relational simulation.
        </span>
      </div>
      <div className="flex items-center space-x-2 text-[11px] bg-amber-700/40 px-2 py-0.5 rounded-full">
        <Database className="w-3 h-3" />
        <span>Connect Supabase in .env for Cloud Persistence</span>
      </div>
    </div>
  );
};
