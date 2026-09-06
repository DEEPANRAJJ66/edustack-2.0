// ==============================================================================
// EDUSTACK 2.0 — STUDENT DASHBOARD (AVAILABLE VS ATTENDED TESTS)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ALL_TESTS, getTestFolders, getTestsByFolder } from '../../data/testRegistry';
import { storageAdapter } from '../../services/storageAdapter';
import { Attempt } from '../../types/attempt';
import { TestRegistryItem } from '../../types/test';
import { getAttemptLabel, formatReadableDate } from '../../utils/formatters';
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  BarChart3, 
  BookMarked, 
  FileDown, 
  Play, 
  Award,
  Sparkles,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { student, isGoogleAuthenticated, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder accordion states: { folderName: boolean }
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'JEE Main Full Mock Tests': true,
  });

  // Attended tests accordion states: { testId: boolean }
  const [expandedAttendedTests, setExpandedAttendedTests] = useState<Record<string, boolean>>({});

  // Selected attempt per attended test: { testId: attemptId }
  const [selectedAttemptByTest, setSelectedAttemptByTest] = useState<Record<string, string>>({});

  const activeStudent = student || {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@edustack.app',
  };

  useEffect(() => {
    loadAttempts();
  }, [student]);

  const loadAttempts = async () => {
    const currentStudent = student || activeStudent;
    setLoading(true);
    try {
      const data = await storageAdapter.getAttempts(currentStudent.id);
      setAttempts(data);

      // Auto-select latest attempt for attended tests
      const initialSelected: Record<string, string> = {};
      const initialExpanded: Record<string, boolean> = {};

      for (const t of ALL_TESTS) {
        const testAttempts = data.filter((a) => a.testId === t.id && a.status === 'COMPLETED');
        if (testAttempts.length > 0) {
          initialExpanded[t.id] = true;
          // Sort ascending, pick last
          testAttempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
          initialSelected[t.id] = testAttempts[testAttempts.length - 1].id;
        }
      }
      setExpandedAttendedTests(initialExpanded);
      setSelectedAttemptByTest(initialSelected);
    } catch (err) {
      console.error('Failed to load attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const toggleAttendedTest = (testId: string) => {
    setExpandedAttendedTests((prev) => ({ ...prev, [testId]: !prev[testId] }));
  };

  const handleStartNewTest = async (test: TestRegistryItem) => {
    const currentStudent = student || activeStudent;
    try {
      setLoading(true);
      const newAttempt = await storageAdapter.createNextAttempt(
        currentStudent.id,
        test.id,
        test.durationMinutes,
        false,
        null
      );
      navigate(`/test/${test.id}/attempt/${newAttempt.id}`);
    } catch (err) {
      console.error('Failed to start test:', err);
      alert('Could not start test. Please try again.');
      setLoading(false);
    }
  };

  const handleRetakeTest = async (testId: string) => {
    const test = ALL_TESTS.find((t) => t.id === testId);
    if (!test) return;
    const currentStudent = student || activeStudent;

    try {
      setLoading(true);
      const newAttempt = await storageAdapter.createNextAttempt(
        currentStudent.id,
        test.id,
        test.durationMinutes,
        false,
        null
      );
      navigate(`/test/${test.id}/attempt/${newAttempt.id}`);
    } catch (err) {
      console.error('Failed to retake test:', err);
      alert('Could not create new attempt. Please try again.');
      setLoading(false);
    }
  };

  // Group attended vs available tests
  const attendedTests: TestRegistryItem[] = [];
  const availableTests: TestRegistryItem[] = [];

  for (const test of ALL_TESTS) {
    const hasCompleted = attempts.some((a) => a.testId === test.id && a.status === 'COMPLETED');
    if (hasCompleted) {
      attendedTests.push(test);
    } else {
      availableTests.push(test);
    }
  }

  const folders = getTestFolders();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Welcome & Student Progress Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target: JEE Main 2026</span>
              {isGoogleAuthenticated ? (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  ✓ Google Synced
                </span>
              ) : (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-bold">
                  Guest Practice Mode
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit']">
              Welcome back, {student?.name || 'Aspirant'}!
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-xl">
              Track mock test attempts, master error concepts with Smart Error Notes, and generate attempt-specific revision notebooks.
            </p>

            {!isGoogleAuthenticated && (
              <div className="mt-4 inline-flex items-center space-x-3 bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl border border-white/20 transition-colors">
                <span className="text-xs text-indigo-200">
                  Using guest profile. Link your Google account to sync:
                </span>
                <button
                  onClick={signInWithGoogle}
                  className="px-2.5 py-1 bg-white text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">Total Completed</p>
              <p className="text-2xl font-black text-white font-['Outfit']">
                {attempts.filter((a) => a.status === 'COMPLETED').length} <span className="text-xs font-normal text-indigo-200">Attempts</span>
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">Attended Tests</p>
              <p className="text-2xl font-black text-emerald-300 font-['Outfit']">
                {attendedTests.length} <span className="text-xs font-normal text-indigo-200">Tests</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. AVAILABLE TESTS SECTION (NOT ATTENDED YET)                       */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              AVAILABLE TESTS
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-full">
              {availableTests.length}
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Click test folder to expand/collapse
          </span>
        </div>

        {availableTests.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">All available tests attended!</p>
            <p className="text-xs text-slate-500 mt-1">
              You can retake any test anytime under Attended Tests to create new independent attempts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {folders.map((folder) => {
              const testsInFolder = availableTests.filter((t) => t.folder === folder);
              if (testsInFolder.length === 0) return null;

              const isExpanded = !!expandedFolders[folder];

              return (
                <div key={folder} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                  {/* Folder Header Accordion Toggle */}
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                      <span className="font-bold text-base text-slate-900">{folder}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {testsInFolder.length} {testsInFolder.length === 1 ? 'Test' : 'Tests'}
                    </span>
                  </button>

                  {/* Expanded Tests in Folder */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 divide-y divide-slate-100">
                      {testsInFolder.map((test) => (
                        <div
                          key={test.id}
                          className="py-4 first:pt-2 last:pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2.5">
                              <h3 className="font-bold text-slate-900 text-base">{test.title}</h3>
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                                NOT ATTENDED
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{test.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500 pt-0.5">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{test.durationMinutes} Mins</span>
                              </span>
                              <span>•</span>
                              <span>{test.totalQuestions} Questions</span>
                              <span>•</span>
                              <span>{test.totalMarks} Marks</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartNewTest(test)}
                            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-indigo-200 hover:shadow-md transition-all whitespace-nowrap"
                          >
                            <Play className="w-4 h-4 fill-white" />
                            <span>Start Test</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 2. ATTENDED TESTS SECTION (MULTIPLE ATTEMPTS SYSTEM)                */}
      {/* ==================================================================== */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-6 bg-emerald-600 rounded-full" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              ATTENDED TESTS
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              {attendedTests.length}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Expand test to view independent attempt history
          </span>
        </div>

        {attendedTests.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tests attended yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Start an available mock test above. Once submitted, your attempts, analysis, and error notes will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attendedTests.map((test) => {
              const isExpanded = !!expandedAttendedTests[test.id];
              const testAttempts = attempts
                .filter((a) => a.testId === test.id && a.status === 'COMPLETED')
                .sort((a, b) => a.attemptNumber - b.attemptNumber);

              const selectedAttemptId = selectedAttemptByTest[test.id] || testAttempts[testAttempts.length - 1]?.id;
              const selectedAttempt = testAttempts.find((a) => a.id === selectedAttemptId) || testAttempts[testAttempts.length - 1];

              return (
                <div 
                  key={test.id} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                >
                  {/* Attended Test Header */}
                  <div 
                    onClick={() => toggleAttendedTest(test.id)}
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-base">{test.title}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 rounded-md">
                            ATTENDED
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{test.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                        {testAttempts.length} {testAttempts.length === 1 ? 'Attempt' : 'Attempts'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetakeTest(test.id);
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Attempts & Details Area */}
                  {isExpanded && (
                    <div className="p-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                      
                      {/* Attempt Selector Tabs: #1 First Attempt, #2 Second Attempt */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Select Attempt History:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {testAttempts.map((att) => {
                            const isSelected = att.id === selectedAttempt?.id;
                            return (
                              <button
                                key={att.id}
                                onClick={() => setSelectedAttemptByTest((prev) => ({ ...prev, [test.id]: att.id }))}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span>{getAttemptLabel(att.attemptNumber)}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {att.score} pts
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Attempt Details Card */}
                      {selectedAttempt && (
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Award className="w-5 h-5 text-indigo-600" />
                                <h4 className="font-extrabold text-slate-900 text-lg">
                                  {getAttemptLabel(selectedAttempt.attemptNumber)}
                                </h4>
                                {selectedAttempt.isErrorCorrectTest && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-100 text-purple-700 rounded-md">
                                    Error Retest
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Submitted on {formatReadableDate(selectedAttempt.submittedAt || selectedAttempt.createdAt)}
                              </p>
                            </div>

                            {/* Score & Accuracy Pills */}
                            <div className="flex items-center space-x-3">
                              <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Score</p>
                                <p className="text-lg font-black text-indigo-900 leading-tight">
                                  {selectedAttempt.score} <span className="text-xs font-normal text-indigo-500">/ {test.totalMarks}</span>
                                </p>
                              </div>
                              <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Accuracy</p>
                                <p className="text-lg font-black text-emerald-900 leading-tight">
                                  {selectedAttempt.accuracy}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Subject Breakdown Quick Cards */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                              <p className="text-[11px] font-semibold text-slate-500">Physics</p>
                              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                                {selectedAttempt.physicsScore} <span className="text-xs font-normal text-slate-400">pts</span>
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                              <p className="text-[11px] font-semibold text-slate-500">Chemistry</p>
                              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                                {selectedAttempt.chemistryScore} <span className="text-xs font-normal text-slate-400">pts</span>
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                              <p className="text-[11px] font-semibold text-slate-500">Mathematics</p>
                              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                                {selectedAttempt.mathScore} <span className="text-xs font-normal text-slate-400">pts</span>
                              </p>
                            </div>
                          </div>

                          {/* Quick Stats: Correct, Wrong, Unattempted */}
                          <div className="flex items-center space-x-6 text-xs font-medium text-slate-600">
                            <span className="flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              <span>{selectedAttempt.correctCount} Correct</span>
                            </span>
                            <span className="flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <span>{selectedAttempt.wrongCount} Wrong</span>
                            </span>
                            <span className="flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                              <span>{selectedAttempt.unattemptedCount} Unattempted</span>
                            </span>
                          </div>

                          {/* Mandatory 4 Action Buttons from Specification */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                            <button
                              onClick={() => navigate(`/analysis/${selectedAttempt.id}`)}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                            >
                              <BarChart3 className="w-4 h-4" />
                              <span>Mock Analysis</span>
                            </button>

                            <button
                              onClick={() => navigate(`/error-notes/${selectedAttempt.id}`)}
                              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                            >
                              <BookMarked className="w-4 h-4" />
                              <span>Smart Error Notes</span>
                            </button>

                            <button
                              onClick={() => navigate(`/pdf/${selectedAttempt.id}`)}
                              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                            >
                              <FileDown className="w-4 h-4" />
                              <span>Generate PDF</span>
                            </button>

                            <button
                              onClick={() => handleRetakeTest(test.id)}
                              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                            >
                              <RotateCcw className="w-4 h-4 text-slate-600" />
                              <span>Retake Test</span>
                            </button>
                          </div>

                          {/* Error Correct Retest Direct CTA if wrong questions exist */}
                          {selectedAttempt.wrongCount > 0 && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-purple-600" />
                                <span className="text-xs font-bold text-purple-900">
                                  {selectedAttempt.wrongCount} Questions need correction!
                                </span>
                              </div>
                              <button
                                onClick={() => navigate(`/error-retest/${selectedAttempt.id}`)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                              >
                                Take Error Correct Test →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
