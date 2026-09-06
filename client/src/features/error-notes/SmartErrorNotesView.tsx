// ==============================================================================
// EDUSTACK 2.0 — SMART ERROR NOTES VIEW (MULTI-SELECT CLASSIFICATIONS)
// ==============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { storageAdapter } from '../../services/storageAdapter';
import { getTestById } from '../../data/testRegistry';
import { Attempt, QuestionResponse } from '../../types/attempt';
import { Question } from '../../types/test';
import { 
  ErrorNote, 
  ErrorClassification, 
  ERROR_CLASSIFICATIONS,
  normalizeErrorTypes,
  toggleErrorClassification
} from '../../types/errorNote';
import { MathText } from '../../components/common/MathText';
import { SvgViewer } from '../../components/common/SvgViewer';
import { getAttemptLabel } from '../../utils/formatters';
import { 
  BookMarked, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileDown, 
  RotateCcw, 
  Check, 
  HelpCircle, 
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';

export const SmartErrorNotesView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [searchParams] = useSearchParams();
  const highlightedQuestionId = searchParams.get('questionId');
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [errorNotes, setErrorNotes] = useState<Record<string, ErrorNote>>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    if (!attemptId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const att = await storageAdapter.getAttemptById(attemptId);
        if (!att) {
          alert('Attempt not found');
          navigate('/');
          return;
        }
        setAttempt(att);

        const resps = await storageAdapter.getAttemptResponses(attemptId);
        setResponses(resps);

        const notes = await storageAdapter.getErrorNotes(attemptId);
        const notesMap: Record<string, ErrorNote> = {};
        notes.forEach((n) => {
          notesMap[n.questionId] = n;
        });
        setErrorNotes(notesMap);
      } catch (err) {
        console.error('Failed to load error notes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [attemptId, navigate]);

  const test = useMemo(() => {
    return attempt ? getTestById(attempt.testId) : undefined;
  }, [attempt]);

  // Wrong or unattempted questions eligible for error logging in this attempt
  const wrongQuestions = useMemo(() => {
    if (!test) return [];
    return test.questions.filter((q) => {
      const r = responses[q.id];
      return r && (r.isCorrect === false || (!r.selectedOption && (!r.numericalValue || r.numericalValue.trim() === '')));
    });
  }, [test, responses]);

  // Debounced note update
  const handleUpdateNote = useCallback(
    async (qId: string, updates: Partial<ErrorNote>) => {
      if (!attempt) return;

      const currentNote = errorNotes[qId] || {
        studentId: attempt.studentId,
        attemptId: attempt.id,
        questionId: qId,
        errorTypes: ['CONCEPT_ERROR'],
        studentExplanation: '',
        correctConcept: '',
        correctFormula: '',
        preventionNote: '',
      };

      const updated: ErrorNote = {
        ...currentNote,
        ...updates,
      };

      setErrorNotes((prev) => ({ ...prev, [qId]: updated }));
      setSaveStatus('saving');

      try {
        await storageAdapter.upsertErrorNote(updated);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save error note:', err);
        setSaveStatus('error');
      }
    },
    [attempt, errorNotes]
  );

  // Multi-select toggle for classifications adhering to THIS_IS_FINE mutual exclusivity
  const handleToggleClassification = (qId: string, target: ErrorClassification) => {
    const currentTypes = normalizeErrorTypes(errorNotes[qId]);
    const nextTypes = toggleErrorClassification(currentTypes, target);
    handleUpdateNote(qId, {
      errorTypes: nextTypes,
      errorType: nextTypes[0] || 'CONCEPT_ERROR',
    });
  };

  // Multi-classification error statistics
  const stats = useMemo(() => {
    let totalEligibleErrors = 0;
    let thisIsFineCount = 0;
    const classificationCounts: Record<string, number> = {};

    wrongQuestions.forEach((q) => {
      const types = normalizeErrorTypes(errorNotes[q.id]);

      if (types.includes('THIS_IS_FINE')) {
        thisIsFineCount++;
      } else {
        totalEligibleErrors++;
        types.forEach((t) => {
          classificationCounts[t] = (classificationCounts[t] || 0) + 1;
        });
      }
    });

    return { totalEligibleErrors, thisIsFineCount, classificationCounts };
  }, [wrongQuestions, errorNotes]);

  if (loading || !attempt || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading Smart Error Notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link
            to={`/analysis/${attempt.id}`}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                Smart Error Notes
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase bg-amber-100 text-amber-800 rounded-full">
                {getAttemptLabel(attempt.attemptNumber)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select all applicable errors per question, write concept corrections, and review before retest.
            </p>
          </div>
        </div>

        {/* Right Autosave status & Actions */}
        <div className="flex items-center space-x-3">
          <div className="text-xs">
            {saveStatus === 'saving' && (
              <span className="text-amber-500 font-medium flex items-center space-x-1 animate-pulse">
                <span>Saving note...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved persistently</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-600 font-medium flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Save failed</span>
              </span>
            )}
          </div>

          <button
            onClick={() => navigate(`/pdf/${attempt.id}`)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate PDF Notebook</span>
          </button>

          {stats.totalEligibleErrors > 0 && (
            <button
              onClick={() => navigate(`/error-retest/${attempt.id}`)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Generate Error Correct Test ({stats.totalEligibleErrors})</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Breakdown Metric Ribbon */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-[11px] font-bold text-rose-600 uppercase">Eligible Error Questions</p>
            <p className="text-2xl font-black text-rose-900 font-['Outfit'] mt-0.5">{stats.totalEligibleErrors}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-[11px] font-bold text-emerald-600 uppercase">Marked "This is Fine"</p>
            <p className="text-2xl font-black text-emerald-900 font-['Outfit'] mt-0.5">{stats.thisIsFineCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-[11px] font-bold text-indigo-600 uppercase">Test Title</p>
            <p className="text-sm font-bold text-indigo-900 truncate mt-1">{test.title}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Attempt Isolation</p>
            <p className="text-xs font-semibold text-slate-700 mt-1">Scoped to Attempt #{attempt.attemptNumber}</p>
          </div>
        </div>

        {/* Multi-Classification Frequency Badges */}
        {Object.keys(stats.classificationCounts).length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Mistake Frequency Across All Applicable Categories:
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(stats.classificationCounts) as ErrorClassification[]).map((typeKey) => {
                const meta = ERROR_CLASSIFICATIONS[typeKey];
                const count = stats.classificationCounts[typeKey];
                if (!count) return null;

                return (
                  <span
                    key={typeKey}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${meta.badgeClass}`}
                  >
                    <span>{meta.label}</span>
                    <span className="w-4 h-4 rounded-full bg-white/80 text-slate-800 text-[10px] flex items-center justify-center font-black">
                      {count}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Questions to Review & Classify */}
      <div className="space-y-6">
        {wrongQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-900">Zero Wrong Questions!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Outstanding performance! You answered all attempted questions correctly in this attempt.
            </p>
          </div>
        ) : (
          wrongQuestions.map((q, qIndex) => {
            const resp = responses[q.id];
            const note = errorNotes[q.id];
            const activeTypes = normalizeErrorTypes(note);
            const isThisFine = activeTypes.includes('THIS_IS_FINE');

            return (
              <div
                key={q.id}
                id={`question-${q.id}`}
                className={`p-6 rounded-2xl border-2 transition-all space-y-5 bg-white shadow-xs ${
                  isThisFine
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-amber-200'
                }`}
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                      #{qIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {q.subject} • {q.chapter} • {q.topic}
                    </span>
                  </div>

                  {/* Student Wrong Answer vs Correct Answer Summary */}
                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <span className="text-rose-600 font-bold">
                      Your: {q.type === 'MCQ' ? `Option ${resp?.selectedOption || 'None'}` : resp?.numericalValue || 'None'}
                    </span>
                    <span>→</span>
                    <span className="text-emerald-700 font-bold">
                      Correct: {q.type === 'MCQ' ? `Option ${q.correctAnswer}` : q.numericalAnswer}
                    </span>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="text-slate-800 text-sm sm:text-base leading-relaxed">
                  <MathText content={q.questionText} block={true} />
                </div>

                {q.svgDiagram && (
                  <SvgViewer svgContent={q.svgDiagram} />
                )}

                {/* Step 1: Multi-Select Error Classification Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Error Classifications (Select all that apply):
                    </label>
                    {isThisFine && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Excluded from Error PDF & Retest
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {(Object.keys(ERROR_CLASSIFICATIONS) as ErrorClassification[]).map((typeKey) => {
                      const meta = ERROR_CLASSIFICATIONS[typeKey];
                      const isSelected = activeTypes.includes(typeKey);
                      const isOptionThisFine = typeKey === 'THIS_IS_FINE';

                      return (
                        <div
                          key={typeKey}
                          onClick={() => handleToggleClassification(q.id, typeKey)}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all flex items-start space-x-2.5 border ${
                            isSelected
                              ? isOptionThisFine
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 text-emerald-900 font-bold'
                                : `${meta.badgeClass} ring-2 ring-indigo-300 font-bold shadow-xs`
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckSquare className={`w-4 h-4 ${isOptionThisFine ? 'text-emerald-600' : 'text-indigo-600'}`} />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="leading-tight">{meta.label}</p>
                            <p className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-1">{meta.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Student Reflection Fields (Hidden if "This is Fine" is selected) */}
                {!isThisFine ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* What went wrong? */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        What went wrong? (Why did you make this mistake?)
                      </label>
                      <textarea
                        rows={2}
                        value={note?.studentExplanation || ''}
                        onChange={(e) => handleUpdateNote(q.id, { studentExplanation: e.target.value })}
                        placeholder="e.g. Applied wrong trigonometric expansion or made calculation blunder in step 2"
                        className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>

                    {/* Correct concept / formula */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Correct Concept / Formula
                      </label>
                      <textarea
                        rows={2}
                        value={note?.correctConcept || ''}
                        onChange={(e) => handleUpdateNote(q.id, { correctConcept: e.target.value })}
                        placeholder="e.g. Total energy E = 1/2 k A^2, conservation of angular momentum"
                        className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>

                    {/* Prevention note / How to avoid next time */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Prevention Note (How will I avoid this in JEE Main?)
                      </label>
                      <input
                        type="text"
                        value={note?.preventionNote || ''}
                        onChange={(e) => handleUpdateNote(q.id, { preventionNote: e.target.value })}
                        placeholder="e.g. Always check units (cm vs m) and write down boundary values carefully"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Marked as <strong>"This is Fine"</strong>. All error classifications have been cleared. This question will be preserved in your original attempt history but excluded from error retests and PDF error notebooks.
                    </span>
                  </div>
                )}

                {/* Step 3: Reference Solution (Collapsible / Readable) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Official Reference Solution
                  </span>
                  <div className="text-xs text-slate-800 leading-relaxed pt-1">
                    <MathText content={q.solution} block={true} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
