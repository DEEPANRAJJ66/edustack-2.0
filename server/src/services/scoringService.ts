// ==============================================================================
// EDUSTACK 2.0 BACKEND — SERVER-AUTHORITATIVE SCORING SERVICE
// ==============================================================================

import { OFFICIAL_TEST_KEYS } from '../tests/officialQuestionKeys';

/**
 * Strict NAT Regex: Non-negative numbers only.
 * The '-' character is strictly rejected.
 */
export const STRICT_NAT_REGEX = /^\d+(\.\d+)?$/;

export interface RawStudentResponse {
  questionId: string;
  selectedOption?: string | null;
  numericalValue?: string | null;
  timeSpentSeconds?: number;
}

export interface EvaluatedQuestionResult {
  questionId: string;
  isCorrect: boolean | null;
  marksAwarded: number;
  timeSpentSeconds: number;
}

export interface EvaluatedSubmissionResult {
  score: number;
  accuracy: number;
  physicsScore: number;
  chemistryScore: number;
  mathScore: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  totalTimeSeconds: number;
  evaluatedResponses: EvaluatedQuestionResult[];
}

export function evaluateSubmissionAuthoritatively(
  testId: string,
  responses: Record<string, RawStudentResponse>
): EvaluatedSubmissionResult {
  const testDef = OFFICIAL_TEST_KEYS[testId];
  if (!testDef) {
    throw new Error(`Invalid testId: ${testId}`);
  }

  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalTimeSeconds = 0;

  const subjectScores: Record<string, number> = {
    Physics: 0,
    Chemistry: 0,
    Mathematics: 0,
  };

  const evaluatedResponses: EvaluatedQuestionResult[] = [];

  for (const [qId, qKey] of Object.entries(testDef.questions)) {
    const raw = responses[qId];
    const timeSpent = raw?.timeSpentSeconds || 0;
    totalTimeSeconds += timeSpent;

    let isAttempted = false;
    let isCorrect: boolean | null = null;
    let marksAwarded = 0;

    if (qKey.type === 'MCQ') {
      if (raw?.selectedOption && ['A', 'B', 'C', 'D'].includes(raw.selectedOption)) {
        isAttempted = true;
        if (raw.selectedOption === qKey.correctAnswer) {
          isCorrect = true;
          marksAwarded = qKey.marks;
        } else {
          isCorrect = false;
          marksAwarded = -qKey.negativeMarks;
        }
      }
    } else if (qKey.type === 'NUMERICAL') {
      const numStr = (raw?.numericalValue || '').trim();
      // Strict non-negative regex validation on server
      if (numStr && STRICT_NAT_REGEX.test(numStr)) {
        isAttempted = true;
        const studentVal = parseFloat(numStr);
        const correctVal = parseFloat(qKey.numericalAnswer || '0');
        const tol = qKey.numericalTolerance ?? 0.01;

        if (Math.abs(studentVal - correctVal) <= tol) {
          isCorrect = true;
          marksAwarded = qKey.marks;
        } else {
          isCorrect = false;
          marksAwarded = -qKey.negativeMarks;
        }
      }
    }

    if (!isAttempted) {
      unattemptedCount++;
      isCorrect = null;
      marksAwarded = 0;
    } else if (isCorrect) {
      correctCount++;
      totalScore += marksAwarded;
      subjectScores[qKey.subject] = (subjectScores[qKey.subject] || 0) + marksAwarded;
    } else {
      wrongCount++;
      totalScore += marksAwarded;
      subjectScores[qKey.subject] = (subjectScores[qKey.subject] || 0) + marksAwarded;
    }

    evaluatedResponses.push({
      questionId: qId,
      isCorrect,
      marksAwarded,
      timeSpentSeconds: timeSpent,
    });
  }

  const attemptedCount = correctCount + wrongCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  return {
    score: totalScore,
    accuracy,
    physicsScore: subjectScores.Physics || 0,
    chemistryScore: subjectScores.Chemistry || 0,
    mathScore: subjectScores.Mathematics || 0,
    correctCount,
    wrongCount,
    unattemptedCount,
    totalTimeSeconds,
    evaluatedResponses,
  };
}
