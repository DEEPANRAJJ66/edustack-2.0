// ==============================================================================
// EDUSTACK 2.0 — TOP APPLICATION NAVBAR
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { 
  GraduationCap, 
  LogOut, 
  LogIn, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const AppNavbar: React.FC = () => {
  const { student, signInWithGoogle, signOut, switchStudentProfile, isSupabaseActive } = useAuth();
  const [showStudentMenu, setShowStudentMenu] = useState(false);
  const navigate = useNavigate();

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

        {/* Right Student Profile / Auth */}
        <div className="flex items-center space-x-3">
          {student ? (
            <div className="relative">
              <div 
                onClick={() => setShowStudentMenu(!showStudentMenu)}
                className="flex items-center space-x-3 p-1.5 pl-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {student.name}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[150px]">
                    {student.email}
                  </div>
                </div>

                <img
                  src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={student.name}
                  className="w-8 h-8 rounded-full ring-2 ring-indigo-500/20 object-cover"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Student Dropdown Menu */}
              {showStudentMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                  </div>

                  {/* Multi-student isolation tester (especially helpful for testing) */}
                  <div className="px-3 py-2 bg-slate-50/80 my-1">
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

                  <button
                    onClick={() => {
                      signOut();
                      setShowStudentMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
