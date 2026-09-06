// ==============================================================================
// EDUSTACK 2.0 BACKEND — OFFICIAL CODE-MANAGED QUESTION KEYS & SCHEMES
// ==============================================================================

export interface QuestionKeyDefinition {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  type: 'MCQ' | 'NUMERICAL';
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  numericalTolerance?: number;
  marks: number;
  negativeMarks: number;
}

export interface TestKeyDefinition {
  id: string;
  title: string;
  durationMinutes: number;
  questions: Record<string, QuestionKeyDefinition>;
}

export const OFFICIAL_TEST_KEYS: Record<string, TestKeyDefinition> = {
  'jee-main-mock-01': {
    id: 'jee-main-mock-01',
    title: 'JEE Main Full Mock Test 01',
    durationMinutes: 180,
    questions: {
      'mock01-phy-01': { id: 'mock01-phy-01', subject: 'Physics', type: 'MCQ', correctAnswer: 'A', marks: 4, negativeMarks: 1 },
      'mock01-phy-02': { id: 'mock01-phy-02', subject: 'Physics', type: 'MCQ', correctAnswer: 'A', marks: 4, negativeMarks: 1 },
      'mock01-phy-03': { id: 'mock01-phy-03', subject: 'Physics', type: 'MCQ', correctAnswer: 'B', marks: 4, negativeMarks: 1 },
      'mock01-phy-04': { id: 'mock01-phy-04', subject: 'Physics', type: 'NUMERICAL', numericalAnswer: '1800', numericalTolerance: 1, marks: 4, negativeMarks: 0 },
      'mock01-phy-05': { id: 'mock01-phy-05', subject: 'Physics', type: 'NUMERICAL', numericalAnswer: '1.5', numericalTolerance: 0.05, marks: 4, negativeMarks: 0 },

      'mock01-chem-01': { id: 'mock01-chem-01', subject: 'Chemistry', type: 'MCQ', correctAnswer: 'B', marks: 4, negativeMarks: 1 },
      'mock01-chem-02': { id: 'mock01-chem-02', subject: 'Chemistry', type: 'MCQ', correctAnswer: 'C', marks: 4, negativeMarks: 1 },
      'mock01-chem-03': { id: 'mock01-chem-03', subject: 'Chemistry', type: 'MCQ', correctAnswer: 'C', marks: 4, negativeMarks: 1 },
      'mock01-chem-04': { id: 'mock01-chem-04', subject: 'Chemistry', type: 'NUMERICAL', numericalAnswer: '1.1', numericalTolerance: 0.05, marks: 4, negativeMarks: 0 },
      'mock01-chem-05': { id: 'mock01-chem-05', subject: 'Chemistry', type: 'NUMERICAL', numericalAnswer: '100', numericalTolerance: 0.5, marks: 4, negativeMarks: 0 },

      'mock01-math-01': { id: 'mock01-math-01', subject: 'Mathematics', type: 'MCQ', correctAnswer: 'A', marks: 4, negativeMarks: 1 },
      'mock01-math-02': { id: 'mock01-math-02', subject: 'Mathematics', type: 'MCQ', correctAnswer: 'B', marks: 4, negativeMarks: 1 },
      'mock01-math-03': { id: 'mock01-math-03', subject: 'Mathematics', type: 'MCQ', correctAnswer: 'A', marks: 4, negativeMarks: 1 },
      'mock01-math-04': { id: 'mock01-math-04', subject: 'Mathematics', type: 'NUMERICAL', numericalAnswer: '18', numericalTolerance: 0.1, marks: 4, negativeMarks: 0 },
      'mock01-math-05': { id: 'mock01-math-05', subject: 'Mathematics', type: 'NUMERICAL', numericalAnswer: '0.375', numericalTolerance: 0.005, marks: 4, negativeMarks: 0 },
    },
  },

  'jee-main-mock-02': {
    id: 'jee-main-mock-02',
    title: 'JEE Main Full Mock Test 02',
    durationMinutes: 180,
    questions: {
      'mock02-phy-01': { id: 'mock02-phy-01', subject: 'Physics', type: 'MCQ', correctAnswer: 'B', marks: 4, negativeMarks: 1 },
      'mock02-phy-02': { id: 'mock02-phy-02', subject: 'Physics', type: 'MCQ', correctAnswer: 'A', marks: 4, negativeMarks: 1 },
      'mock02-phy-03': { id: 'mock02-phy-03', subject: 'Physics', type: 'MCQ', correctAnswer: 'B', marks: 4, negativeMarks: 1 },
      'mock02-phy-04': { id: 'mock02-phy-04', subject: 'Physics', type: 'NUMERICAL', numericalAnswer: '20', numericalTolerance: 0.1, marks: 4, negativeMarks: 0 },
      'mock02-phy-05': { id: 'mock02-phy-05', subject: 'Physics', type: 'NUMERICAL', numericalAnswer: '700', numericalTolerance: 1, marks: 4, negativeMarks: 0 },

      'mock02-chem-01': { id: 'mock02-chem-01', subject: 'Chemistry', type: 'MCQ', correctAnswer: 'C', marks: 4, negativeMarks: 1 },
      'mock02-chem-02': { id: 'mock02-chem-02', subject: 'Chemistry', type: 'MCQ', correctAnswer: 'C', marks: 4, negativeMarks: 1 },
      'mock02-chem-03': { id: 'mock02-chem-03', subject: 'Chemistry', type: 'MCQ', correctAnswer: 'A', marks: 4, negativeMarks: 1 },
      'mock02-chem-04': { id: 'mock02-chem-04', subject: 'Chemistry', type: 'NUMERICAL', numericalAnswer: '12', numericalTolerance: 0.1, marks: 4, negativeMarks: 0 },
      'mock02-chem-05': { id: 'mock02-chem-05', subject: 'Chemistry', type: 'NUMERICAL', numericalAnswer: '4', numericalTolerance: 0, marks: 4, negativeMarks: 0 },

      'mock02-math-01': { id: 'mock02-math-01', subject: 'Mathematics', type: 'MCQ', correctAnswer: 'B', marks: 4, negativeMarks: 1 },
      'mock02-math-02': { id: 'mock02-math-02', subject: 'Mathematics', type: 'MCQ', correctAnswer: 'A', marks: 4, negativeMarks: 1 },
      'mock02-math-03': { id: 'mock02-math-03', subject: 'Mathematics', type: 'MCQ', correctAnswer: 'C', marks: 4, negativeMarks: 1 },
      'mock02-math-04': { id: 'mock02-math-04', subject: 'Mathematics', type: 'NUMERICAL', numericalAnswer: '25', numericalTolerance: 0.1, marks: 4, negativeMarks: 0 },
      'mock02-math-05': { id: 'mock02-math-05', subject: 'Mathematics', type: 'NUMERICAL', numericalAnswer: '30', numericalTolerance: 0, marks: 4, negativeMarks: 0 },
    },
  },
};
