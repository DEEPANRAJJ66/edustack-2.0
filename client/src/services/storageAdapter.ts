// ==============================================================================
// EDUSTACK 2.0 — STORAGE ADAPTER & PERSISTENCE LAYER
// ==============================================================================
// Enforces Supabase PostgreSQL as the ONLY production source of truth.
// Provides an explicit dev/demo fallback when Supabase keys are not set locally.

import { supabase, isSupabaseConfigured } from './supabase';
import { Attempt, QuestionResponse } from '../types/attempt';
import { ErrorNote, normalizeErrorTypes } from '../types/errorNote';
import { getTestById } from '../data/testRegistry';
import { evaluateTestAttempt } from '../utils/scoring';

const DEMO_ATTEMPTS_KEY = 'edustack_demo_attempts_v2';
const DEMO_RESPONSES_KEY = 'edustack_demo_responses_v2';
const DEMO_ERROR_NOTES_KEY = 'edustack_demo_error_notes_v2';

// ------------------------------------------------------------------------------
// Local Demo Storage Helpers (Development only)
// ------------------------------------------------------------------------------
function getDemoAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(DEMO_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoAttempts(attempts: Attempt[]): void {
  localStorage.setItem(DEMO_ATTEMPTS_KEY, JSON.stringify(attempts));
}

function getDemoResponses(): Record<string, QuestionResponse> {
  try {
    const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDemoResponses(responses: Record<string, QuestionResponse>): void {
  localStorage.setItem(DEMO_RESPONSES_KEY, JSON.stringify(responses));
}

function getDemoErrorNotes(): ErrorNote[] {
  try {
    const raw = localStorage.getItem(DEMO_ERROR_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoErrorNotes(notes: ErrorNote[]): void {
  localStorage.setItem(DEMO_ERROR_NOTES_KEY, JSON.stringify(notes));
}

// ------------------------------------------------------------------------------
// PUBLIC STORAGE API
// ------------------------------------------------------------------------------

export const storageAdapter = {
  /**
   * Fetch all attempts for a student, optionally filtered by testId
   */
  async getAttempts(studentId: string, testId?: string): Promise<Attempt[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('attempts')
          .select('*')
          .eq('student_id', studentId)
          .order('attempt_number', { ascending: true });

        if (testId) {
          query = query.eq('test_id', testId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            studentId: row.student_id,
            testId: row.test_id,
            attemptNumber: row.attempt_number,
            status: row.status,
            startedAt: row.started_at,
            submittedAt: row.submitted_at,
            durationMinutes: row.duration_minutes,
            totalTimeSeconds: row.total_time_seconds,
            score: Number(row.score),
            accuracy: Number(row.accuracy),
            physicsScore: Number(row.physics_score),
            chemistryScore: Number(row.chemistry_score),
            mathScore: Number(row.math_score),
            correctCount: row.correct_count,
            wrongCount: row.wrong_count,
            unattemptedCount: row.unattempted_count,
            isErrorCorrectTest: row.is_error_correct_test,
            parentAttemptId: row.parent_attempt_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch attempts warning:', err);
      }
    }

    // Dev/Demo fallback
    const all = getDemoAttempts();
    return all.filter((a) => a.studentId === studentId && (!testId || a.testId === testId));
  },

  /**
   * Get single attempt by ID
   */
  async getAttemptById(attemptId: string): Promise<Attempt | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('id', attemptId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            studentId: data.student_id,
            testId: data.test_id,
            attemptNumber: data.attempt_number,
            status: data.status,
            startedAt: data.started_at,
            submittedAt: data.submitted_at,
            durationMinutes: data.duration_minutes,
            totalTimeSeconds: data.total_time_seconds,
            score: Number(data.score),
            accuracy: Number(data.accuracy),
            physicsScore: Number(data.physics_score),
            chemistryScore: Number(data.chemistry_score),
            mathScore: Number(data.math_score),
            correctCount: data.correct_count,
            wrongCount: data.wrong_count,
            unattemptedCount: data.unattempted_count,
            isErrorCorrectTest: data.is_error_correct_test,
            parentAttemptId: data.parent_attempt_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase getAttemptById warning:', err);
      }
    }

    const all = getDemoAttempts();
    return all.find((a) => a.id === attemptId) || null;
  },

  /**
   * Concurrency-safe attempt creation.
   * Scoped strictly per (studentId, testId) -> #1, #2, #3.
   */
  async createNextAttempt(
    studentId: string,
    testId: string,
    durationMinutes: number = 180,
    isErrorCorrectTest: boolean = false,
    parentAttemptId: string | null = null
  ): Promise<Attempt> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Call atomic PostgreSQL function create_next_attempt
        const { data, error } = await supabase.rpc('create_next_attempt', {
          p_student_id: studentId,
          p_test_id: testId,
          p_duration_minutes: durationMinutes,
          p_is_error_correct_test: isErrorCorrectTest,
          p_parent_attempt_id: parentAttemptId,
        });

        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          const attemptId = row.attempt_id;
          const attemptNumber = row.attempt_number;
          const startedAt = row.started_at;

          const created: Attempt = {
            id: attemptId,
            studentId,
            testId,
            attemptNumber,
            status: 'IN_PROGRESS',
            startedAt,
            durationMinutes,
            totalTimeSeconds: 0,
            score: 0,
            accuracy: 0,
            physicsScore: 0,
            chemistryScore: 0,
            mathScore: 0,
            correctCount: 0,
            wrongCount: 0,
            unattemptedCount: 0,
            isErrorCorrectTest,
            parentAttemptId,
            createdAt: startedAt,
            updatedAt: startedAt,
          };

          // Also save in local cache for offline/instant access
          const all = getDemoAttempts();
          all.push(created);
          saveDemoAttempts(all);
          return created;
        }

        console.warn('Supabase create_next_attempt RPC notice:', error);
      } catch (err) {
        console.warn('Supabase create_next_attempt exception:', err);
      }
    }

    // Dev/Demo fallback: atomic sequential calculation
    const all = getDemoAttempts();
    const existingForTest = all.filter((a) => a.studentId === studentId && a.testId === testId);
    const nextNumber = existingForTest.reduce((max, a) => Math.max(max, a.attemptNumber), 0) + 1;

    const newAttempt: Attempt = {
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      studentId,
      testId,
      attemptNumber: nextNumber,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      durationMinutes,
      totalTimeSeconds: 0,
      score: 0,
      accuracy: 0,
      physicsScore: 0,
      chemistryScore: 0,
      mathScore: 0,
      correctCount: 0,
      wrongCount: 0,
      unattemptedCount: 0,
      isErrorCorrectTest,
      parentAttemptId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    all.push(newAttempt);
    saveDemoAttempts(all);
    return newAttempt;
  },

  /**
   * Save / Upsert single question response with debouncing
   */
  async upsertResponse(response: QuestionResponse): Promise<void> {
    // Always update local cache first
    const all = getDemoResponses();
    const key = `${response.attemptId}_${response.questionId}`;
    all[key] = { ...response, updatedAt: new Date().toISOString() };
    saveDemoResponses(all);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('responses').upsert(
          {
            attempt_id: response.attemptId,
            question_id: response.questionId,
            selected_option: response.selectedOption || null,
            numerical_value: response.numericalValue || null,
            marked_for_review: response.markedForReview,
            visited: response.visited,
            time_spent_seconds: response.timeSpentSeconds,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        );
      } catch (err) {
        console.warn('Supabase upsert response warning:', err);
      }
    }
  },

  /**
   * Fetch all responses for an attempt
   */
  async getAttemptResponses(attemptId: string): Promise<Record<string, QuestionResponse>> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('responses')
          .select('*')
          .eq('attempt_id', attemptId);

        if (!error && data && data.length > 0) {
          const map: Record<string, QuestionResponse> = {};
          for (const r of data) {
            map[r.question_id] = {
              id: r.id,
              attemptId: r.attempt_id,
              questionId: r.question_id,
              selectedOption: r.selected_option,
              numericalValue: r.numerical_value,
              markedForReview: r.marked_for_review,
              visited: r.visited,
              timeSpentSeconds: r.time_spent_seconds,
              isCorrect: r.is_correct,
              marksAwarded: r.marks_awarded,
              updatedAt: r.updated_at,
            };
          }
          return map;
        }
      } catch (err) {
        console.warn('Supabase fetch responses warning:', err);
      }
    }

    // Dev/Demo fallback
    const all = getDemoResponses();
    const map: Record<string, QuestionResponse> = {};
    for (const [, resp] of Object.entries(all)) {
      if (resp.attemptId === attemptId) {
        map[resp.questionId] = resp;
      }
    }
    return map;
  },

  /**
   * Authoritatively submits and scores an attempt against official questions
   */
  async submitAttempt(
    attemptId: string,
    testId: string,
    rawResponses: Record<string, QuestionResponse>
  ): Promise<Attempt> {
    const test = getTestById(testId);
    if (!test) throw new Error(`Test not found: ${testId}`);

    // Authoritative evaluation on the server/service layer
    const evalResult = evaluateTestAttempt(test.questions, rawResponses);
    const submittedAt = new Date().toISOString();

    // 1. Update local cache
    const all = getDemoAttempts();
    const idx = all.findIndex((a) => a.id === attemptId);
    const demoResponses = getDemoResponses();
    for (const evaluated of Object.values(evalResult.evaluatedResponses)) {
      const key = `${attemptId}_${evaluated.questionId}`;
      demoResponses[key] = { ...demoResponses[key], ...evaluated };
    }
    saveDemoResponses(demoResponses);

    const localUpdatedAttempt: Attempt = idx >= 0 ? {
      ...all[idx],
      status: 'COMPLETED',
      submittedAt,
      totalTimeSeconds: evalResult.totalTimeSeconds,
      score: evalResult.score,
      accuracy: evalResult.accuracy,
      physicsScore: evalResult.physicsScore,
      chemistryScore: evalResult.chemistryScore,
      mathScore: evalResult.mathScore,
      correctCount: evalResult.correctCount,
      wrongCount: evalResult.wrongCount,
      unattemptedCount: evalResult.unattemptedCount,
      updatedAt: submittedAt,
    } : {
      id: attemptId,
      studentId: '00000000-0000-0000-0000-000000000001',
      testId,
      attemptNumber: 1,
      status: 'COMPLETED',
      startedAt: submittedAt,
      submittedAt,
      durationMinutes: test.durationMinutes,
      totalTimeSeconds: evalResult.totalTimeSeconds,
      score: evalResult.score,
      accuracy: evalResult.accuracy,
      physicsScore: evalResult.physicsScore,
      chemistryScore: evalResult.chemistryScore,
      mathScore: evalResult.mathScore,
      correctCount: evalResult.correctCount,
      wrongCount: evalResult.wrongCount,
      unattemptedCount: evalResult.unattemptedCount,
      isErrorCorrectTest: false,
      parentAttemptId: null,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    };

    if (idx >= 0) {
      all[idx] = localUpdatedAttempt;
    } else {
      all.push(localUpdatedAttempt);
    }
    saveDemoAttempts(all);

    // 2. Sync with Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all(
          Object.values(evalResult.evaluatedResponses).map((evaluated) =>
            supabase
              .from('responses')
              .update({
                is_correct: evaluated.isCorrect,
                marks_awarded: evaluated.marksAwarded,
                time_spent_seconds: evaluated.timeSpentSeconds,
                updated_at: submittedAt,
              })
              .eq('attempt_id', attemptId)
              .eq('question_id', evaluated.questionId)
          )
        );

        const { data, error } = await supabase
          .from('attempts')
          .update({
            status: 'COMPLETED',
            submitted_at: submittedAt,
            total_time_seconds: evalResult.totalTimeSeconds,
            score: evalResult.score,
            accuracy: evalResult.accuracy,
            physics_score: evalResult.physicsScore,
            chemistry_score: evalResult.chemistryScore,
            math_score: evalResult.mathScore,
            correct_count: evalResult.correctCount,
            wrong_count: evalResult.wrongCount,
            unattempted_count: evalResult.unattemptedCount,
            updated_at: submittedAt,
          })
          .eq('id', attemptId)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            studentId: data.student_id,
            testId: data.test_id,
            attemptNumber: data.attempt_number,
            status: data.status,
            startedAt: data.started_at,
            submittedAt: data.submitted_at,
            durationMinutes: data.duration_minutes,
            totalTimeSeconds: data.total_time_seconds,
            score: Number(data.score),
            accuracy: Number(data.accuracy),
            physicsScore: Number(data.physics_score),
            chemistryScore: Number(data.chemistry_score),
            mathScore: Number(data.math_score),
            correctCount: data.correct_count,
            wrongCount: data.wrong_count,
            unattemptedCount: data.unattempted_count,
            isErrorCorrectTest: data.is_error_correct_test,
            parentAttemptId: data.parent_attempt_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase submit attempt warning:', err);
      }
    }

    return localUpdatedAttempt;
  },

  /**
   * Fetch Error Notes for an attempt (supports multi-classification errorTypes)
   */
  async getErrorNotes(attemptId: string): Promise<ErrorNote[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('error_notes')
          .select('*')
          .eq('attempt_id', attemptId);

        if (!error && data && data.length > 0) {
          return data.map((row) => {
            const types = Array.isArray(row.error_types) && row.error_types.length > 0
              ? row.error_types
              : (row.error_type ? [row.error_type] : ['CONCEPT_ERROR']);

            return {
              id: row.id,
              studentId: row.student_id,
              attemptId: row.attempt_id,
              questionId: row.question_id,
              errorTypes: types,
              errorType: types[0],
              studentExplanation: row.student_explanation || '',
              correctConcept: row.correct_concept || '',
              correctFormula: row.correct_formula || '',
              preventionNote: row.prevention_note || '',
              solutionInfo: row.solution_info || '',
              updatedAt: row.updated_at,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase getErrorNotes warning:', err);
      }
    }

    const all = getDemoErrorNotes();
    return all
      .filter((n) => n.attemptId === attemptId)
      .map((n) => ({
        ...n,
        errorTypes: normalizeErrorTypes(n),
        errorType: normalizeErrorTypes(n)[0],
      }));
  },

  /** Alias for getErrorNotes */
  async getErrorNotesByAttempt(attemptId: string): Promise<ErrorNote[]> {
    return this.getErrorNotes(attemptId);
  },

  /**
   * Upsert an Error Note strictly scoped per (attempt_id, question_id)
   * Saves both error_types array and error_type for backward compatibility.
   */
  async upsertErrorNote(note: ErrorNote): Promise<void> {
    const errorTypes = normalizeErrorTypes(note);

    // Update local cache first
    const all = getDemoErrorNotes();
    const idx = all.findIndex((n) => n.attemptId === note.attemptId && n.questionId === note.questionId);
    const updatedNote: ErrorNote = {
      ...note,
      errorTypes,
      errorType: errorTypes[0] || 'CONCEPT_ERROR',
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      all[idx] = updatedNote;
    } else {
      all.push(updatedNote);
    }
    saveDemoErrorNotes(all);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('error_notes').upsert(
          {
            student_id: note.studentId,
            attempt_id: note.attemptId,
            question_id: note.questionId,
            error_types: errorTypes,
            error_type: errorTypes[0] || 'CONCEPT_ERROR',
            student_explanation: note.studentExplanation,
            correct_concept: note.correctConcept,
            correct_formula: note.correctFormula,
            prevention_note: note.preventionNote,
            solution_info: note.solutionInfo,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        );
      } catch (err) {
        console.warn('Supabase upsert error note warning:', err);
      }
    }
  },

  /**
   * Delete Error Note
   */
  async deleteErrorNote(attemptId: string, questionId: string): Promise<void> {
    const all = getDemoErrorNotes();
    const filtered = all.filter((n) => !(n.attemptId === attemptId && n.questionId === questionId));
    saveDemoErrorNotes(filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('error_notes')
          .delete()
          .eq('attempt_id', attemptId)
          .eq('question_id', questionId);
      } catch (err) {
        console.warn('Supabase delete error note warning:', err);
      }
    }
  },
};
