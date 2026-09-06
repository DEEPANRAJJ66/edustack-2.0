// ==============================================================================
// EDUSTACK 2.0 — ATTEMPT & RESPONSE TYPE DEFINITIONS
// ==============================================================================

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface QuestionResponse {
  id?: string;
  attemptId: string;
  questionId: string;
  selectedOption?: 'A' | 'B' | 'C' | 'D' | null;
  numericalValue?: string | null;
  markedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
  isCorrect?: boolean | null;
  marksAwarded?: number;
  updatedAt?: string;
}

export interface Attempt {
  id: string;
  studentId: string;
  testId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;          // ISO String
  submittedAt?: string | null;
  durationMinutes: number;
  totalTimeSeconds: number;
  score: number;
  accuracy: number;
  physicsScore: number;
  chemistryScore: number;
  mathScore: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  isErrorCorrectTest: boolean;
  parentAttemptId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptSubmissionPayload {
  attemptId: string;
  testId: string;
  responses: Record<string, QuestionResponse>;
  clientTimestamp: string;
}

export interface ScorecardSubjectDetail {
  subject: string;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export interface AttemptAnalysisData {
  attempt: Attempt;
  responses: Record<string, QuestionResponse>;
  subjectBreakdown: Record<string, ScorecardSubjectDetail>;
}
