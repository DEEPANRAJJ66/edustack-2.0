// ==============================================================================
// EDUSTACK 2.0 — ATTEMPT-SPECIFIC MOCK ANALYSIS VIEW
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storageAdapter } from '../../services/storageAdapter';
import { getTestById } from '../../data/testRegistry';
import { Attempt, QuestionResponse } from '../../types/attempt';
import { Question } from '../../types/test';
import { 
  ErrorNote, 
  normalizeErrorTypes, 
  ERROR_CLASSIFICATIONS 
} from '../../types/errorNote';
import { MathText } from '../../components/common/MathText';
import { SvgViewer } from '../../components/common/SvgViewer';
import { 
  getAttemptLabel, 
  formatReadableDate, 
  formatDurationHuman 
} from '../../utils/formatters';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Award, 
  BookMarked, 
  FileDown, 
  RotateCcw, 
  ArrowLeft,
  Filter,
  Check,
  X,
  AlertTriangle,
  Tag
} from 'lucide-react';

export const MockAnalysisView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [errorNotes, setErrorNotes] = useState<Record<string, ErrorNote>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNATTEMPTED'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

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
        console.error('Failed to load mock analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [attemptId, navigate]);

  const test = useMemo(() => {
    return attempt ? getTestById(attempt.testId) : undefined;
  }, [attempt]);

  // Filtered question list
  const filteredQuestions = useMemo(() => {
    if (!test) return [];

    return test.questions.filter((q) => {
      const r = responses[q.id];
      const isAttempted = Boolean(r && (r.selectedOption || (r.numericalValue && r.numericalValue.trim() !== '')));

      // Subject Filter
      if (selectedSubject !== 'ALL' && q.subject !== selectedSubject) {
        return false;
      }

      // Status Filter
      if (selectedFilter === 'CORRECT') return r?.isCorrect === true;
      if (selectedFilter === 'WRONG') return isAttempted && r?.isCorrect === false;
      if (selectedFilter === 'UNATTEMPTED') return !isAttempted;
      return true;
    });
  }, [test, responses, selectedFilter, selectedSubject]);

  if (loading || !attempt || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Generating Mock Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                {test.title} — Mock Analysis
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase bg-indigo-100 text-indigo-800 rounded-full">
                {getAttemptLabel(attempt.attemptNumber)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Completed on {formatReadableDate(attempt.submittedAt || attempt.createdAt)} • Total Time: {formatDurationHuman(attempt.totalTimeSeconds)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/error-notes/${attempt.id}`)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <BookMarked className="w-4 h-4" />
            <span>Smart Error Notes</span>
          </button>

          <button
            onClick={() => navigate(`/pdf/${attempt.id}`)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          {attempt.wrongCount > 0 && (
            <button
              onClick={() => navigate(`/error-retest/${attempt.id}`)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Error Questions</span>
            </button>
          )}
        </div>
      </div>

      {/* Scorecard Hero Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Score */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between opacity-80 text-xs font-bold uppercase tracking-wider">
            <span>Total Score</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black font-['Outfit']">
            {attempt.score} <span className="text-sm font-normal opacity-80">/ {test.totalMarks}</span>
          </div>
          <p className="text-[11px] opacity-80">
            Percentage: {Math.round((attempt.score / test.totalMarks) * 100)}%
          </p>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Accuracy</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-['Outfit']">
            {attempt.accuracy}%
          </div>
          <p className="text-[11px] text-slate-500">
            {attempt.correctCount} correct of {attempt.correctCount + attempt.wrongCount} attempted
          </p>
        </div>

        {/* Correct Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <span>Correct</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-600 font-['Outfit']">
            {attempt.correctCount}
          </div>
          <p className="text-[11px] text-slate-500">
            +{attempt.correctCount * 4} positive marks
          </p>
        </div>

        {/* Wrong Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold uppercase tracking-wider">
            <span>Wrong</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-rose-600 font-['Outfit']">
            {attempt.wrongCount}
          </div>
          <p className="text-[11px] text-rose-500">
            Negative deductions applied
          </p>
        </div>

        {/* Unattempted Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Unattempted</span>
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-slate-700 font-['Outfit']">
            {attempt.unattemptedCount}
          </div>
          <p className="text-[11px] text-slate-500">
            0 marks affected
          </p>
        </div>
      </div>

      {/* Subject-Wise Performance Breakdown Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 font-['Outfit']">
          Subject Performance Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Physics', score: attempt.physicsScore, total: 20 },
            { name: 'Chemistry', score: attempt.chemistryScore, total: 20 },
            { name: 'Mathematics', score: attempt.mathScore, total: 20 },
          ].map((subj) => (
            <div key={subj.name} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{subj.name}</h4>
                <span className="font-black text-base text-indigo-600 font-['Outfit']">
                  {subj.score} <span className="text-xs font-normal text-slate-400">/ {subj.total}</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, (subj.score / subj.total) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question-Wise Detailed Analysis with Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 font-['Outfit']">
              Question-by-Question Review
            </h3>
            <p className="text-xs text-slate-500">
              Review answers, solutions, and mark smart error reflections.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
            </select>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              {(['ALL', 'CORRECT', 'WRONG', 'UNATTEMPTED'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setSelectedFilter(filterKey)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedFilter === filterKey
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filterKey.charAt(0) + filterKey.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const resp = responses[q.id];
            const isAttempted = Boolean(resp && (resp.selectedOption || (resp.numericalValue && resp.numericalValue.trim() !== '')));
            const isCorrect = resp?.isCorrect;
            const timeSpent = resp?.timeSpentSeconds || 0;

            return (
              <div
                key={q.id}
                className={`p-6 bg-white rounded-2xl border-2 transition-all space-y-4 shadow-xs ${
                  isCorrect
                    ? 'border-emerald-200'
                    : isAttempted
                    ? 'border-rose-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Question Top Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      Q{test.questions.findIndex((orig) => orig.id === q.id) + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {q.subject} • {q.chapter}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{q.type}</span>
                  </div>

                  {/* Question Status Badge & Time */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDurationHuman(timeSpent)}</span>
                    </div>

                    {isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Correct (+{resp?.marksAwarded || 4})</span>
                      </span>
                    ) : isAttempted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center space-x-1">
                        <X className="w-3 h-3" />
                        <span>Wrong ({resp?.marksAwarded || -1})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        Unattempted (0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <div className="text-slate-800 text-sm sm:text-base leading-relaxed">
                  <MathText content={q.questionText} block={true} />
                </div>

                {q.svgDiagram && (
                  <SvgViewer svgContent={q.svgDiagram} />
                )}

                {/* Student Answer vs Correct Answer Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Answer</p>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {q.type === 'MCQ' ? (
                        resp?.selectedOption ? (
                          <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            Option {resp.selectedOption}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">Not answered</span>
                        )
                      ) : (
                        resp?.numericalValue ? (
                          <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {resp.numericalValue}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">Not entered</span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Correct Answer</p>
                    <div className="font-mono text-sm font-bold text-emerald-700">
                      {q.type === 'MCQ' ? `Option ${q.correctAnswer}` : q.numericalAnswer}
                    </div>
                  </div>
                </div>

                {/* Detailed Step-by-Step Solution */}
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                  <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Detailed Solution
                  </p>
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <MathText content={q.solution} block={true} />
                  </div>
                </div>

                {/* Smart Error Classification & Notes Section */}
                {(() => {
                  const note = errorNotes[q.id];
                  const hasNote = Boolean(note);
                  const classifications = hasNote ? normalizeErrorTypes(note) : [];
                  const isFine = classifications.includes('THIS_IS_FINE');

                  return (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        {hasNote ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
                              <Tag className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Error Classifications:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {classifications.map((c) => {
                                const meta = ERROR_CLASSIFICATIONS[c];
                                return (
                                  <span
                                    key={c}
                                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                                      meta ? meta.badgeClass : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {meta ? meta.label : c}
                                  </span>
                                );
                              })}
                            </div>
                            {note.studentExplanation && (
                              <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100/80">
                                <span className="font-semibold text-amber-900 not-italic">Note: </span>
                                "{note.studentExplanation}"
                              </p>
                            )}
                          </div>
                        ) : !isCorrect ? (
                          <p className="text-xs text-slate-400 italic">
                            Unclassified error. Add classifications and reflection notes for your revision notebook.
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => navigate(`/error-notes/${attempt.id}?questionId=${q.id}`)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            hasNote
                              ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                              : 'text-amber-800 bg-amber-100 hover:bg-amber-200'
                          }`}
                        >
                          <BookMarked className="w-3.5 h-3.5" />
                          <span>{hasNote ? 'Edit Error Note' : 'Classify Mistake in Error Notes →'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
