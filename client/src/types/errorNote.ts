// ==============================================================================
// EDUSTACK 2.0 — SMART ERROR NOTES & ERROR CORRECT TEST TYPES
// ==============================================================================

export type ErrorClassification =
  | 'CONCEPT_ERROR'
  | 'DONT_KNOW_TOPIC'
  | 'FORMULA_ERROR'
  | 'CALCULATION_ERROR'
  | 'SILLY_MISTAKE'
  | 'TIME_PRESSURE'
  | 'GUESS'
  | 'OTHER'
  | 'THIS_IS_FINE'; // Special non-error flag: excluded from error counts/PDF/retests

export interface ErrorClassificationMeta {
  id: ErrorClassification;
  label: string;
  description: string;
  color: string;
  badgeClass: string;
}

export const ERROR_CLASSIFICATIONS: Record<ErrorClassification, ErrorClassificationMeta> = {
  CONCEPT_ERROR: {
    id: 'CONCEPT_ERROR',
    label: 'Concept Error',
    description: 'Misunderstood fundamental physics/chemistry/math theory or theorem',
    color: '#ef4444',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
  },
  DONT_KNOW_TOPIC: {
    id: 'DONT_KNOW_TOPIC',
    label: "Don't Know Topic",
    description: 'Have not studied or covered this chapter/concept yet',
    color: '#64748b',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  FORMULA_ERROR: {
    id: 'FORMULA_ERROR',
    label: 'Formula Error',
    description: 'Forgot formula or applied incorrect sign/coefficient/dimensions',
    color: '#f97316',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  CALCULATION_ERROR: {
    id: 'CALCULATION_ERROR',
    label: 'Calculation Error',
    description: 'Algebraic slip, arithmetic blunder, or unit conversion mistake',
    color: '#eab308',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  SILLY_MISTAKE: {
    id: 'SILLY_MISTAKE',
    label: 'Silly Mistake',
    description: 'Misread question statement, marked wrong option, or hasty error',
    color: '#ec4899',
    badgeClass: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  TIME_PRESSURE: {
    id: 'TIME_PRESSURE',
    label: 'Time Pressure',
    description: 'Ran out of time or rushed through steps in the final minutes',
    color: '#8b5cf6',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  GUESS: {
    id: 'GUESS',
    label: 'Wild Guess',
    description: 'Took an uncalculated gamble without elimination logic',
    color: '#06b6d4',
    badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  },
  OTHER: {
    id: 'OTHER',
    label: 'Other',
    description: 'Unusual question phrasing, fatigue, or technical distraction',
    color: '#6b7280',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  THIS_IS_FINE: {
    id: 'THIS_IS_FINE',
    label: 'This is Fine (Not an Error)',
    description: 'Acceptable question; exclude from error counts, revision notebook, and retest',
    color: '#10b981',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
};

export interface ErrorNote {
  id?: string;
  studentId: string;
  attemptId: string;
  questionId: string;
  errorTypes: ErrorClassification[]; // Multi-select array of classifications
  errorType?: ErrorClassification;   // Backward compatibility with single-select records
  studentExplanation: string;        // "What went wrong?"
  correctConcept: string;            // "Why did I make this mistake? / Correct concept"
  correctFormula: string;            // "Correct formula / identity"
  preventionNote: string;            // "How will I avoid this next time?"
  solutionInfo?: string;
  updatedAt?: string;
}

/**
 * Normalizes error note classifications to safely support both
 * multi-select array `errorTypes` and legacy single string `errorType`.
 */
export function normalizeErrorTypes(note: Partial<ErrorNote> | undefined): ErrorClassification[] {
  if (!note) return ['CONCEPT_ERROR'];

  if (Array.isArray(note.errorTypes) && note.errorTypes.length > 0) {
    return note.errorTypes;
  }

  if (note.errorType) {
    return [note.errorType];
  }

  return ['CONCEPT_ERROR'];
}

/**
 * Mutates/toggles classifications adhering to the strict rule:
 * - If THIS_IS_FINE is chosen: unselects all other errors.
 * - If any normal error is chosen: automatically unselects THIS_IS_FINE.
 */
export function toggleErrorClassification(
  current: ErrorClassification[],
  target: ErrorClassification
): ErrorClassification[] {
  if (target === 'THIS_IS_FINE') {
    // Exclusively select THIS_IS_FINE
    return ['THIS_IS_FINE'];
  }

  // Remove THIS_IS_FINE if present
  let filtered = current.filter((c) => c !== 'THIS_IS_FINE');

  if (filtered.includes(target)) {
    filtered = filtered.filter((c) => c !== target);
  } else {
    filtered.push(target);
  }

  // If user unselected everything, keep empty or allow student to pick next
  return filtered;
}

export interface ErrorCorrectTestMeta {
  parentAttemptId: string;
  originalTestId: string;
  eligibleQuestionIds: string[];
  excludedQuestionIds: string[]; // Questions marked THIS_IS_FINE
}
