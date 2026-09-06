// ==============================================================================
// EDUSTACK 2.0 — TEST & QUESTION TYPE DEFINITIONS
// ==============================================================================

export type Subject = 'Physics' | 'Chemistry' | 'Mathematics';

export type QuestionType = 'MCQ' | 'NUMERICAL';

export interface MarkingScheme {
  marks: number;          // Default +4
  negativeMarks: number;  // Default -1 for MCQ, 0 for NAT unless specified
}

export interface Question {
  id: string;
  subject: Subject;
  section: string;        // e.g., 'Section A (MCQ)' or 'Section B (Numerical)'
  chapter: string;
  topic: string;
  type: QuestionType;
  questionText: string;   // Contains KaTeX formulas, e.g. $\int_0^1 x dx$
  options?: {
    id: 'A' | 'B' | 'C' | 'D';
    text: string;         // Contains KaTeX formulas
  }[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D'; // For MCQ
  numericalAnswer?: string;              // For NAT, strictly e.g. "25", "4.5" (no negative)
  numericalTolerance?: number;           // Allowed rounding delta (default 0.01)
  markingScheme: MarkingScheme;
  solution: string;                      // Detailed step-by-step KaTeX solution
  svgDiagram?: string;                   // Optional inline SVG XML string
  imageUrl?: string;                     // Optional diagram image URL
}

export interface TestMetadata {
  id: string;
  title: string;
  subtitle?: string;
  category: string;       // e.g., 'JEE Main Full Mock Tests', 'Physics Subject Tests'
  folder: string;         // Grouping folder name
  durationMinutes: number; // e.g. 180 (3 hours)
  totalQuestions: number;
  totalMarks: number;
  subjects: Subject[];
  description: string;
}

export interface TestRegistryItem extends TestMetadata {
  questions: Question[];
}
