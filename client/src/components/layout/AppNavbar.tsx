// ==============================================================================
// EDUSTACK 2.0 — TOP APPLICATION NAVBAR (GOOGLE AUTH & STUDENT IDENTITY)
// ==============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { 
  GraduationCap, 
  LogOut, 
  Users, 
  BookOpen, 
  ChevronDown,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const AppNavbar: React.FC = () => {
  const { 
    student, 
    isGoogleAuthenticated, 
    signInWithGoogle, 
    signOut, 
    switchStudentProfile 
  } = useAuth();
  const [showStudentMenu, setShowStudentMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-['Outfit']">
                EduStack
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-md">
                2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5">
              JEE Main CBT Engine & Smart Error Notes
            </p>
          </div>
        </Link>

        {/* Center Quick Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Test Series</span>
          </Link>
        </nav>

        {/* Right Student Profile / Auth Actions */}
        <div className="flex items-center space-x-3">
          
          {/* 1. If not signed in with Google, show prominent "Sign in with Google" button */}
          {!isGoogleAuthenticated && (
            <button
              onClick={signInWithGoogle}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow transition-all flex items-center space-x-2"
              title="Sign in with your Google account"
            >
              {/* Google 4-Color SVG Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          {/* 2. Active Student Identity Pill & Dropdown Menu */}
          {student && (
            <div className="relative">
              <div 
                onClick={() => setShowStudentMenu(!showStudentMenu)}
                className={`flex items-center space-x-2.5 p-1.5 pl-3 rounded-full border cursor-pointer transition-all ${
                  isGoogleAuthenticated 
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center justify-end space-x-1">
                    {isGoogleAuthenticated && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span>{student.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[140px]">
                    {isGoogleAuthenticated ? student.email : 'Guest / Demo Student'}
                  </div>
                </div>

                <img
                  src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={student.name}
                  className={`w-8 h-8 rounded-full ring-2 object-cover ${
                    isGoogleAuthenticated ? 'ring-emerald-500/30' : 'ring-indigo-500/20'
                  }`}
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Student Dropdown Menu */}
              {showStudentMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {isGoogleAuthenticated ? 'Google Account Connected' : 'Guest Student Profile'}
                      </p>
                      {isGoogleAuthenticated ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Synced</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          <span>Guest</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate mt-1">{student.name}</p>
                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">ID: {student.id}</p>
                  </div>

                  {/* If not yet logged in with Google, give quick sign-in action inside menu too */}
                  {!isGoogleAuthenticated && (
                    <div className="p-3 bg-indigo-50/70 border-b border-indigo-100/60 m-2 rounded-xl">
                      <p className="text-xs font-semibold text-indigo-950 mb-1">
                        Save Your Test Progress
                      </p>
                      <p className="text-[11px] text-indigo-700/90 mb-2">
                        Sign in with Google to preserve all attempts, scores, and error notes across all devices.
                      </p>
                      <button
                        onClick={() => {
                          setShowStudentMenu(false);
                          signInWithGoogle();
                        }}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-2"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Connect Google Account</span>
                      </button>
                    </div>
                  )}

                  {/* Multi-student isolation tester (dev/testing helper) */}
                  <div className="px-3 py-2 bg-slate-50/80 my-1 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Test Student Isolation</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          switchStudentProfile(
                            '00000000-0000-0000-0000-000000000001',
                            'Arjun Sharma (Student A)',
                            'arjun.sharma@edustack.app'
                          );
                          setShowStudentMenu(false);
                        }}
                        className={`text-[11px] text-left px-2 py-1.5 rounded-lg border transition-all ${
                          student.id.endsWith('1')
                            ? 'bg-indigo-600 text-white font-medium border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Student A
                      </button>
                      <button
                        onClick={() => {
                          switchStudentProfile(
                            '00000000-0000-0000-0000-000000000002',
                            'Priya Patel (Student B)',
                            'priya.patel@edustack.app'
                          );
                          setShowStudentMenu(false);
                        }}
                        className={`text-[11px] text-left px-2 py-1.5 rounded-lg border transition-all ${
                          student.id.endsWith('2')
                            ? 'bg-indigo-600 text-white font-medium border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Student B
                      </button>
                    </div>
                  </div>

                  {/* Sign Out / Reset Button */}
                  <button
                    onClick={() => {
                      signOut();
                      setShowStudentMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isGoogleAuthenticated ? 'Sign Out of Google' : 'Reset to Default Student'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
