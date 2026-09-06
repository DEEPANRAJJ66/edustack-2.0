// ==============================================================================
// EDUSTACK 2.0 — JEE MAIN SCORING UTILITY
// ==============================================================================

import { Question } from '../types/test';
import { QuestionResponse, ScorecardSubjectDetail } from '../types/attempt';
import { isValidFinalNat, normalizeNatValue } from './natValidation';

export interface EvaluationResult {
  score: number;
  maxScore: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  physicsScore: number;
  chemistryScore: number;
  mathScore: number;
  totalTimeSeconds: number;
  evaluatedResponses: Record<string, QuestionResponse>;
  subjectBreakdown: Record<string, ScorecardSubjectDetail>;
}

/**
 * Authoritatively evaluates student responses against official question keys and marking schemes.
 */
export function evaluateTestAttempt(
  questions: Question[],
  rawResponses: Record<string, QuestionResponse>
): EvaluationResult {
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalTimeSeconds = 0;

  const subjectBreakdown: Record<string, ScorecardSubjectDetail> = {
    Physics: { subject: 'Physics', score: 0, maxScore: 0, correctCount: 0, wrongCount: 0, unattemptedCount: 0, accuracy: 0, timeSpentSeconds: 0 },
    Chemistry: { subject: 'Chemistry', score: 0, maxScore: 0, correctCount: 0, wrongCount: 0, unattemptedCount: 0, accuracy: 0, timeSpentSeconds: 0 },
    Mathematics: { subject: 'Mathematics', score: 0, maxScore: 0, correctCount: 0, wrongCount: 0, unattemptedCount: 0, accuracy: 0, timeSpentSeconds: 0 },
  };

  const evaluatedResponses: Record<string, QuestionResponse> = {};

  for (const q of questions) {
    const raw = rawResponses[q.id];
    const subjectStats = subjectBreakdown[q.subject] || {
      subject: q.subject, score: 0, maxScore: 0, correctCount: 0, wrongCount: 0, unattemptedCount: 0, accuracy: 0, timeSpentSeconds: 0
    };

    const qMarks = q.markingScheme?.marks ?? 4;
    const qNegMarks = q.markingScheme?.negativeMarks ?? (q.type === 'MCQ' ? 1 : 0);
    maxScore += qMarks;
    subjectStats.maxScore += qMarks;

    const timeSpent = raw?.timeSpentSeconds ?? 0;
    totalTimeSeconds += timeSpent;
    subjectStats.timeSpentSeconds += timeSpent;

    let isAttempted = false;
    let isCorrect: boolean | null = null;
    let marksAwarded = 0;

    if (q.type === 'MCQ') {
      if (raw?.selectedOption) {
        isAttempted = true;
        if (raw.selectedOption === q.correctAnswer) {
          isCorrect = true;
          marksAwarded = qMarks;
        } else {
          isCorrect = false;
          marksAwarded = -qNegMarks;
        }
      }
    } else if (q.type === 'NUMERICAL') {
      const normVal = normalizeNatValue(raw?.numericalValue ?? '');
      if (isValidFinalNat(normVal)) {
        isAttempted = true;
        const studentNum = parseFloat(normVal);
        const correctNum = parseFloat(q.numericalAnswer ?? '0');
        const tolerance = q.numericalTolerance ?? 0.01;

        if (Math.abs(studentNum - correctNum) <= tolerance) {
          isCorrect = true;
          marksAwarded = qMarks;
        } else {
          isCorrect = false;
          marksAwarded = -qNegMarks;
        }
      }
    }

    if (!isAttempted) {
      unattemptedCount++;
      subjectStats.unattemptedCount++;
      isCorrect = null;
      marksAwarded = 0;
    } else if (isCorrect) {
      correctCount++;
      subjectStats.correctCount++;
      totalScore += marksAwarded;
      subjectStats.score += marksAwarded;
    } else {
      wrongCount++;
      subjectStats.wrongCount++;
      totalScore += marksAwarded;
      subjectStats.score += marksAwarded;
    }

    evaluatedResponses[q.id] = {
      attemptId: raw?.attemptId ?? '',
      questionId: q.id,
      selectedOption: raw?.selectedOption ?? null,
      numericalValue: raw?.numericalValue ?? null,
      markedForReview: raw?.markedForReview ?? false,
      visited: raw?.visited ?? true,
      timeSpentSeconds: timeSpent,
      isCorrect,
      marksAwarded,
    };
  }

  // Calculate accuracies
  const attemptedTotal = correctCount + wrongCount;
  const accuracy = attemptedTotal > 0 ? Math.round((correctCount / attemptedTotal) * 100) : 0;

  for (const s of Object.values(subjectBreakdown)) {
    const sAttempted = s.correctCount + s.wrongCount;
    s.accuracy = sAttempted > 0 ? Math.round((s.correctCount / sAttempted) * 100) : 0;
  }

  return {
    score: totalScore,
    maxScore,
    accuracy,
    correctCount,
    wrongCount,
    unattemptedCount,
    physicsScore: subjectBreakdown.Physics?.score ?? 0,
    chemistryScore: subjectBreakdown.Chemistry?.score ?? 0,
    mathScore: subjectBreakdown.Mathematics?.score ?? 0,
    totalTimeSeconds,
    evaluatedResponses,
    subjectBreakdown,
  };
}
