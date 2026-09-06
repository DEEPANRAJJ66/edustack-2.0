// ==============================================================================
// EDUSTACK 2.0 — JEE MAIN CBT TEST ENGINE
// ==============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getTestById } from '../../data/testRegistry';
import { storageAdapter } from '../../services/storageAdapter';
import { Question, Subject } from '../../types/test';
import { Attempt, QuestionResponse } from '../../types/attempt';
import { MathText } from '../../components/common/MathText';
import { SvgViewer } from '../../components/common/SvgViewer';
import { NumericalInput } from '../../components/ui/NumericalInput';
import { formatSecondsToTimer } from '../../utils/formatters';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  RotateCcw, 
  CheckCircle2, 
  Send, 
  AlertTriangle,
  Info,
  Layers,
  X
} from 'lucide-react';

export const CbtTestEngine: React.FC = () => {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const { student } = useAuth();
  const navigate = useNavigate();

  const test = useMemo(() => (testId ? getTestById(testId) : undefined), [testId]);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSubject, setCurrentSubject] = useState<Subject>('Physics');

  // Map of questionId -> QuestionResponse
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  
  // Timer state (seconds remaining)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [timerExpired, setTimerExpired] = useState(false);

  // Persistence status indicators: 'saved' | 'saving' | 'error'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Submit confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track time spent per question
  const questionStartTimeRef = useRef<number>(Date.now());

  const activeStudentId = student?.id || '00000000-0000-0000-0000-000000000001';

  // ----------------------------------------------------------------------------
  // 1. Initial Load & Recovery from Storage
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!test || !attemptId) return;

    const initEngine = async () => {
      try {
        let att = await storageAdapter.getAttemptById(attemptId);
        
        // If attempt doesn't exist yet, create one
        if (!att) {
          att = await storageAdapter.createNextAttempt(activeStudentId, test.id, test.durationMinutes);
        }

        // If already completed, redirect to analysis
        if (att.status === 'COMPLETED') {
          navigate(`/analysis/${att.id}`);
          return;
        }

        setAttempt(att);
        setQuestions(test.questions);

        // Load existing responses from persistent storage
        const savedResponses = await storageAdapter.getAttemptResponses(att.id);
        
        // Populate initial map for all questions
        const initialMap: Record<string, QuestionResponse> = {};
        test.questions.forEach((q) => {
          initialMap[q.id] = savedResponses[q.id] || {
            attemptId: att.id,
            questionId: q.id,
            selectedOption: null,
            numericalValue: null,
            markedForReview: false,
            visited: false,
            timeSpentSeconds: 0,
          };
        });

        // Mark the first question as visited
        if (test.questions.length > 0) {
          initialMap[test.questions[0].id].visited = true;
        }

        setResponses(initialMap);

        // ----------------------------------------------------------------------
        // 2. Timestamp-Based Timer Calculation (Survives Refresh / Crash)
        // ----------------------------------------------------------------------
        const startedAtMs = new Date(att.startedAt).getTime();
        const totalDurationSec = (att.durationMinutes || 180) * 60;
        const elapsedSec = Math.floor((Date.now() - startedAtMs) / 1000);
        const remaining = Math.max(0, totalDurationSec - elapsedSec);

        setRemainingSeconds(remaining);
        if (remaining <= 0) {
          setTimerExpired(true);
        }
      } catch (err) {
        console.error('Failed to initialize CBT engine:', err);
      }
    };

    initEngine();
  }, [test, attemptId, student]);

  // ----------------------------------------------------------------------------
  // 3. Timer Interval with Timestamp Sync
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!attempt || timerExpired) return;

    const interval = setInterval(() => {
      const startedAtMs = new Date(attempt.startedAt).getTime();
      const totalDurationSec = (attempt.durationMinutes || 180) * 60;
      const elapsedSec = Math.floor((Date.now() - startedAtMs) / 1000);
      const remaining = Math.max(0, totalDurationSec - elapsedSec);

      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setTimerExpired(true);
        handleFinalSubmit(true); // Auto-submit when time expires
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, timerExpired]);

  // ----------------------------------------------------------------------------
  // 4. Time tracking per question
  // ----------------------------------------------------------------------------
  useEffect(() => {
    questionStartTimeRef.current = Date.now();

    return () => {
      // Accumulate time spent on leaving question
      if (!questions[currentIdx]) return;
      const qId = questions[currentIdx].id;
      const spent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

      setResponses((prev) => {
        const currentResp = prev[qId];
        if (!currentResp) return prev;
        const updated = {
          ...currentResp,
          timeSpentSeconds: (currentResp.timeSpentSeconds || 0) + spent,
        };
        // Debounced save
        persistResponse(updated);
        return { ...prev, [qId]: updated };
      });
    };
  }, [currentIdx, questions]);

  // Helper to persist response to Supabase / storage
  const persistResponse = useCallback(
    async (resp: QuestionResponse) => {
      setSaveStatus('saving');
      try {
        await storageAdapter.upsertResponse(resp);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to persist response:', err);
        setSaveStatus('error');
      }
    },
    []
  );

  const currentQuestion = questions[currentIdx];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;

  // Filter questions for current subject
  const subjectQuestions = useMemo(() => {
    return questions.filter((q) => q.subject === currentSubject);
  }, [questions, currentSubject]);

  // Handle MCQ selection
  const handleSelectOption = (optionId: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    setResponses((prev) => {
      const updated: QuestionResponse = {
        ...prev[qId],
        selectedOption: optionId,
        visited: true,
      };
      persistResponse(updated);
      return { ...prev, [qId]: updated };
    });
  };

  // Handle NAT input change
  const handleNatChange = (val: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    setResponses((prev) => {
      const updated: QuestionResponse = {
        ...prev[qId],
        numericalValue: val,
        visited: true,
      };
      persistResponse(updated);
      return { ...prev, [qId]: updated };
    });
  };

  // Clear Response
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    setResponses((prev) => {
      const updated: QuestionResponse = {
        ...prev[qId],
        selectedOption: null,
        numericalValue: null,
        visited: true,
      };
      persistResponse(updated);
      return { ...prev, [qId]: updated };
    });
  };

  // Mark for Review & Next
  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    setResponses((prev) => {
      const updated: QuestionResponse = {
        ...prev[qId],
        markedForReview: !prev[qId]?.markedForReview,
        visited: true,
      };
      persistResponse(updated);
      return { ...prev, [qId]: updated };
    });

    // Move to next question if available
    handleNextQuestion();
  };

  // Save & Next
  const handleSaveAndNext = () => {
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      const nextQ = questions[nextIdx];
      setCurrentIdx(nextIdx);
      if (nextQ.subject !== currentSubject) {
        setCurrentSubject(nextQ.subject);
      }
      // Mark next question as visited
      setResponses((prev) => {
        const nextResp = prev[nextQ.id];
        if (nextResp && !nextResp.visited) {
          const updated = { ...nextResp, visited: true };
          persistResponse(updated);
          return { ...prev, [nextQ.id]: updated };
        }
        return prev;
      });
    }
  };

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      const prevQ = questions[prevIdx];
      setCurrentIdx(prevIdx);
      if (prevQ.subject !== currentSubject) {
        setCurrentSubject(prevQ.subject);
      }
    }
  };

  const handleJumpToQuestion = (targetIdx: number) => {
    const targetQ = questions[targetIdx];
    if (!targetQ) return;
    setCurrentIdx(targetIdx);
    if (targetQ.subject !== currentSubject) {
      setCurrentSubject(targetQ.subject);
    }
    // Mark target question as visited
    setResponses((prev) => {
      const resp = prev[targetQ.id];
      if (resp && !resp.visited) {
        const updated = { ...resp, visited: true };
        persistResponse(updated);
        return { ...prev, [targetQ.id]: updated };
      }
      return prev;
    });
  };

  // Switch subject tab
  const handleSwitchSubject = (subj: Subject) => {
    setCurrentSubject(subj);
    const firstQIdx = questions.findIndex((q) => q.subject === subj);
    if (firstQIdx !== -1) {
      handleJumpToQuestion(firstQIdx);
    }
  };

  // Final submission
  const handleFinalSubmit = async (isAutoExpire: boolean = false) => {
    if (!attempt || !test || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const finalized = await storageAdapter.submitAttempt(attempt.id, test.id, responses);
      navigate(`/analysis/${finalized.id}`);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Submission failed. Please check connection and try again.');
      setIsSubmitting(false);
    }
  };

  // Helper to determine question palette color status
  const getQuestionPaletteState = (qId: string) => {
    const r = responses[qId];
    if (!r || !r.visited) return 'NOT_VISITED';

    const hasAnswer = Boolean(r.selectedOption || (r.numericalValue && r.numericalValue.trim() !== ''));

    if (r.markedForReview && hasAnswer) return 'ANSWERED_AND_MARKED';
    if (r.markedForReview) return 'MARKED_FOR_REVIEW';
    if (hasAnswer) return 'ANSWERED';
    return 'NOT_ANSWERED';
  };

  // Palette counts
  const paletteStats = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let markedReview = 0;
    let answeredMarked = 0;

    questions.forEach((q) => {
      const state = getQuestionPaletteState(q.id);
      if (state === 'ANSWERED') answered++;
      else if (state === 'NOT_ANSWERED') notAnswered++;
      else if (state === 'NOT_VISITED') notVisited++;
      else if (state === 'MARKED_FOR_REVIEW') markedReview++;
      else if (state === 'ANSWERED_AND_MARKED') answeredMarked++;
    });

    return { answered, notAnswered, notVisited, markedReview, answeredMarked };
  }, [questions, responses]);

  if (!test || !attempt || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-sm">Loading JEE Main CBT Engine...</p>
        </div>
      </div>
    );
  }

  const isLowTime = remainingSeconds < 300; // Under 5 minutes

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* ==================================================================== */}
      {/* 1. TOP CBT HEADER                                                    */}
      {/* ==================================================================== */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs font-['Outfit']">
            JEE
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight font-['Outfit']">{test.title}</h1>
            <p className="text-[11px] text-slate-400">
              Attempt #{attempt.attemptNumber} • Candidate: <span className="text-indigo-300 font-semibold">{student?.name}</span>
            </p>
          </div>
        </div>

        {/* Center: Autosave status indicator */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {saveStatus === 'saving' && (
            <span className="text-amber-400 flex items-center space-x-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Saving answer...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Response saved</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-rose-400 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Save error (retrying)</span>
            </span>
          )}
        </div>

        {/* Right: Timestamp-Based Timer & Submit Button */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-sm sm:text-base font-bold transition-colors ${
            isLowTime 
              ? 'bg-rose-950/80 text-rose-300 border border-rose-700 animate-pulse' 
              : 'bg-slate-800 text-indigo-200 border border-slate-700'
          }`}>
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{formatSecondsToTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. SUBJECT TABS                                                      */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {test.subjects.map((subj) => {
            const isActive = currentSubject === subj;
            const countInSubj = questions.filter((q) => q.subject === subj).length;
            const answeredInSubj = questions.filter((q) => {
              if (q.subject !== subj) return false;
              const r = responses[q.id];
              return r && (r.selectedOption || (r.numericalValue && r.numericalValue.trim() !== ''));
            }).length;

            return (
              <button
                key={subj}
                onClick={() => handleSwitchSubject(subj)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{subj}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {answeredInSubj}/{countInSubj}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500">
          <span>Marks: <strong className="text-slate-800">+{currentQuestion.markingScheme.marks}</strong></span>
          <span>•</span>
          <span>Negative: <strong className="text-slate-800">-{currentQuestion.markingScheme.negativeMarks}</strong></span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE: QUESTION AREA + QUESTION PALETTE                 */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Question Content & Interactive Answering Area */}
        <main className="flex-1 flex flex-col bg-white overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Question Header Pill */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold text-sm">
                Question {currentIdx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {currentQuestion.section} • {currentQuestion.chapter}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                {currentQuestion.type === 'MCQ' ? 'Multiple Choice' : 'Numerical Answer'}
              </span>
            </div>
          </div>

          {/* Question Statement with KaTeX & Diagrams */}
          <div className="space-y-4">
            <div className="text-slate-800 text-base sm:text-lg leading-relaxed">
              <MathText content={currentQuestion.questionText} block={true} />
            </div>

            {/* Render SVG Diagram if present */}
            {currentQuestion.svgDiagram && (
              <SvgViewer svgContent={currentQuestion.svgDiagram} />
            )}
          </div>

          {/* Answering Area: MCQ Options or Strict Numerical Input */}
          <div className="pt-4 border-t border-slate-100">
            {currentQuestion.type === 'MCQ' && currentQuestion.options && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select one option:</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = currentResponse?.selectedOption === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3.5 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm text-slate-900 ring-2 ring-indigo-100'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {opt.id}
                        </div>
                        <div className="flex-1 text-sm sm:text-base pt-0.5">
                          <MathText content={opt.text} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentQuestion.type === 'NUMERICAL' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enter Numerical Answer:</p>
                <NumericalInput
                  value={currentResponse?.numericalValue || ''}
                  onChange={handleNatChange}
                  placeholder="Enter positive number (e.g. 18 or 1.5)"
                />
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="mt-auto pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearResponse}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Clear Response
              </button>

              <button
                onClick={handleMarkForReviewAndNext}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                  currentResponse?.markedForReview
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{currentResponse?.markedForReview ? 'Marked for Review' : 'Mark for Review & Next'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevQuestion}
                disabled={currentIdx === 0}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-1"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Question Palette */}
        <aside className="w-full lg:w-80 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
          
          {/* Status Legend */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">✓</span>
                <span>Answered ({paletteStats.answered})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">✕</span>
                <span>Not Answered ({paletteStats.notAnswered})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center">0</span>
                <span>Not Visited ({paletteStats.notVisited})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">★</span>
                <span>Marked ({paletteStats.markedReview})</span>
              </div>
            </div>
          </div>

          {/* Question Palette Grid */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-900 font-['Outfit']">
                {currentSubject} Palette
              </span>
              <span className="text-[11px] text-slate-500">
                {subjectQuestions.length} Questions
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const state = getQuestionPaletteState(q.id);

                let bgClass = 'bg-slate-200 text-slate-700 border-slate-300';
                if (state === 'ANSWERED') {
                  bgClass = 'bg-emerald-500 text-white border-emerald-600';
                } else if (state === 'NOT_ANSWERED') {
                  bgClass = 'bg-rose-500 text-white border-rose-600';
                } else if (state === 'MARKED_FOR_REVIEW') {
                  bgClass = 'bg-purple-600 text-white border-purple-700';
                } else if (state === 'ANSWERED_AND_MARKED') {
                  bgClass = 'bg-purple-600 text-white border-purple-700 relative ring-2 ring-emerald-400';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`h-9 rounded-lg font-mono font-bold text-xs transition-all flex items-center justify-center border ${bgClass} ${
                      isCurrent ? 'ring-3 ring-indigo-400 scale-105 z-10' : 'hover:opacity-90'
                    }`}
                  >
                    {idx + 1}
                    {state === 'ANSWERED_AND_MARKED' && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-300 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </aside>
      </div>

      {/* ==================================================================== */}
      {/* 4. SUBMISSION CONFIRMATION MODAL                                    */}
      {/* ==================================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900 font-['Outfit']">Submit Test Attempt?</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <strong className="text-slate-900">{questions.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Answered Questions:</span>
                <strong className="text-emerald-600">{paletteStats.answered + paletteStats.answeredMarked}</strong>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <strong className="text-purple-600">{paletteStats.markedReview}</strong>
              </div>
              <div className="flex justify-between">
                <span>Unattempted Questions:</span>
                <strong className="text-rose-600">{paletteStats.notAnswered + paletteStats.notVisited}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span>Time Remaining:</span>
                <strong className="text-slate-900 font-mono">{formatSecondsToTimer(remainingSeconds)}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Are you sure you want to submit? Once submitted, your answers will be evaluated authoritatively and your Mock Analysis will be ready.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
              >
                Return to Test
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
