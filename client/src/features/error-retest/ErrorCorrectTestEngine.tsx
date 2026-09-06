// ==============================================================================
// EDUSTACK 2.0 — ERROR CORRECT TEST ENGINE
// ==============================================================================
// Generates a focused retest consisting ONLY of eligible error questions
// strictly EXCLUDING questions marked "THIS_IS_FINE".
// Creates a new independent attempt record linked to the parent attempt.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { storageAdapter } from '../../services/storageAdapter';
import { getTestById } from '../../data/testRegistry';
import { Attempt, QuestionResponse } from '../../types/attempt';
import { Question } from '../../types/test';
import { normalizeErrorTypes } from '../../types/errorNote';
import { MathText } from '../../components/common/MathText';
import { SvgViewer } from '../../components/common/SvgViewer';
import { NumericalInput } from '../../components/ui/NumericalInput';
import { formatSecondsToTimer } from '../../utils/formatters';
import { 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  Send, 
  ArrowLeft,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  X
} from 'lucide-react';

export const ErrorCorrectTestEngine: React.FC = () => {
  const { parentAttemptId } = useParams<{ parentAttemptId: string }>();
  const { student } = useAuth();
  const navigate = useNavigate();

  const [parentAttempt, setParentAttempt] = useState<Attempt | null>(null);
  const [currentRetestAttempt, setCurrentRetestAttempt] = useState<Attempt | null>(null);
  const [retestQuestions, setRetestQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const activeStudentId = student?.id || '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    if (!parentAttemptId) return;

    const setupRetest = async () => {
      setLoading(true);
      try {
        const parent = await storageAdapter.getAttemptById(parentAttemptId);
        if (!parent) {
          alert('Parent attempt not found');
          navigate('/');
          return;
        }
        setParentAttempt(parent);

        const originalTest = getTestById(parent.testId);
        if (!originalTest) {
          alert('Test not found');
          navigate('/');
          return;
        }

        // Fetch parent responses and error notes
        const parentResponses = await storageAdapter.getAttemptResponses(parent.id);
        const errorNotes = await storageAdapter.getErrorNotes(parent.id);

        // Find questions marked "THIS_IS_FINE" (safely supports multi-classification array)
        const thisIsFineSet = new Set(
          errorNotes
            .filter((n) => normalizeErrorTypes(n).includes('THIS_IS_FINE'))
            .map((n) => n.questionId)
        );

        // EXCLUDE-ONLY RULE: Eligible questions are wrong/unattempted questions NOT in thisIsFineSet
        const eligible = originalTest.questions.filter((q) => {
          const r = parentResponses[q.id];
          const isWrongOrUnattempted = !r || r.isCorrect === false || (!r.selectedOption && !r.numericalValue);
          return isWrongOrUnattempted && !thisIsFineSet.has(q.id);
        });

        if (eligible.length === 0) {
          alert('No eligible error questions found for retest (all questions were correct or marked "This is Fine")');
          navigate(`/error-notes/${parent.id}`);
          return;
        }

        setRetestQuestions(eligible);

        // Retest duration: 4 minutes per question or default 30 mins
        const durationMins = Math.max(15, eligible.length * 4);

        // Create an independent retest attempt record
        const newRetestAttempt = await storageAdapter.createNextAttempt(
          activeStudentId,
          originalTest.id,
          durationMins,
          true, // is_error_correct_test
          parent.id // parent_attempt_id
        );

        setCurrentRetestAttempt(newRetestAttempt);

        // Initialize responses for retest
        const initialResponses: Record<string, QuestionResponse> = {};
        eligible.forEach((q) => {
          initialResponses[q.id] = {
            attemptId: newRetestAttempt.id,
            questionId: q.id,
            selectedOption: null,
            numericalValue: null,
            markedForReview: false,
            visited: false,
            timeSpentSeconds: 0,
          };
        });
        initialResponses[eligible[0].id].visited = true;
        setResponses(initialResponses);

        setRemainingSeconds(durationMins * 60);
      } catch (err) {
        console.error('Failed to setup error correct test:', err);
      } finally {
        setLoading(false);
      }
    };

    setupRetest();
  }, [parentAttemptId, student, navigate]);

  // Timer interval
  useEffect(() => {
    if (!currentRetestAttempt || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRetestAttempt]);

  const persistResponse = useCallback(
    async (resp: QuestionResponse) => {
      setSaveStatus('saving');
      try {
        await storageAdapter.upsertResponse(resp);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to persist retest response:', err);
        setSaveStatus('error');
      }
    },
    []
  );

  const currentQuestion = retestQuestions[currentIdx];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;

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

  const handleSaveAndNext = () => {
    if (currentIdx < retestQuestions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      const nextQ = retestQuestions[nextIdx];
      setResponses((prev) => {
        const resp = prev[nextQ.id];
        if (resp && !resp.visited) {
          const updated = { ...resp, visited: true };
          persistResponse(updated);
          return { ...prev, [nextQ.id]: updated };
        }
        return prev;
      });
    }
  };

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!currentRetestAttempt || !parentAttempt || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const finalized = await storageAdapter.submitAttempt(
        currentRetestAttempt.id,
        parentAttempt.testId,
        responses
      );
      navigate(`/analysis/${finalized.id}`);
    } catch (err) {
      console.error('Retest submission failed:', err);
      alert('Error submitting retest. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading || !parentAttempt || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Configuring Error Correct Retest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* Header */}
      <header className="bg-purple-950 text-white border-b border-purple-900 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-xs">
            <RotateCcw className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-sm sm:text-base leading-tight font-['Outfit']">
                Error Correct Test
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-800 text-purple-200">
                Attempt #{parentAttempt.attemptNumber} Corrections
              </span>
            </div>
            <p className="text-[11px] text-purple-300">
              Retesting {retestQuestions.length} eligible error questions (excluding "This is Fine")
            </p>
          </div>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-900/80 border border-purple-700 font-mono text-sm font-bold text-purple-200">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>{formatSecondsToTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Retest</span>
          </button>
        </div>
      </header>

      {/* Main Retest Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <main className="flex-1 flex flex-col bg-white overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-purple-900 text-white rounded-lg font-bold text-xs">
                Question {currentIdx + 1} of {retestQuestions.length}
              </span>
              <span className="text-xs font-bold text-slate-700">
                {currentQuestion.subject} • {currentQuestion.chapter}
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 font-bold border border-purple-100">
              {currentQuestion.type}
            </span>
          </div>

          {/* Statement */}
          <div className="space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed">
            <MathText content={currentQuestion.questionText} block={true} />
            {currentQuestion.svgDiagram && (
              <SvgViewer svgContent={currentQuestion.svgDiagram} />
            )}
          </div>

          {/* Answering Area */}
          <div className="pt-4 border-t border-slate-100">
            {currentQuestion.type === 'MCQ' && currentQuestion.options && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select one option:</p>
                {currentQuestion.options.map((opt) => {
                  const isSelected = currentResponse?.selectedOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-100 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {opt.id}
                      </div>
                      <div className="flex-1 text-sm pt-0.5">
                        <MathText content={opt.text} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'NUMERICAL' && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enter Numerical Answer:</p>
                <NumericalInput
                  value={currentResponse?.numericalValue || ''}
                  onChange={handleNatChange}
                  placeholder="Enter positive number (e.g. 18 or 1.5)"
                />
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleClearResponse}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            >
              Clear
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevQuestion}
                disabled={currentIdx === 0}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl"
              >
                Previous
              </button>
              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm"
              >
                Save & Next
              </button>
            </div>
          </div>
        </main>

        {/* Retest Palette Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Error Retest Questions ({retestQuestions.length})
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {retestQuestions.map((q, idx) => {
              const r = responses[q.id];
              const isAnswered = Boolean(r && (r.selectedOption || (r.numericalValue && r.numericalValue.trim() !== '')));
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-lg font-mono font-bold text-xs transition-all border ${
                    isAnswered
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  } ${isCurrent ? 'ring-3 ring-purple-400 font-black' : ''}`}
                >
                  Q{idx + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 font-['Outfit']">
              Submit Error Correct Retest?
            </h3>
            <p className="text-xs text-slate-600">
              Your corrected responses will be evaluated and logged as an independent retest attempt linked to Attempt #{parentAttempt.attemptNumber}.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
