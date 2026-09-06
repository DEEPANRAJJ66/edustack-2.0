// ==============================================================================
// EDUSTACK 2.0 BACKEND — REST API ROUTES
// ==============================================================================

import { Router, Request, Response } from 'express';
import { supabaseAdmin, isSupabaseBackendConfigured } from '../config/supabase';
import { evaluateSubmissionAuthoritatively } from '../services/scoringService';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    supabaseConnected: isSupabaseBackendConfigured,
    timestamp: new Date().toISOString(),
  });
});

// Create Next Attempt (Concurrency-safe RPC)
apiRouter.post('/attempts/create', async (req: Request, res: Response) => {
  try {
    const { studentId, testId, durationMinutes, isErrorCorrectTest, parentAttemptId } = req.body;

    if (!studentId || !testId) {
      return res.status(400).json({ error: 'studentId and testId are required' });
    }

    if (!isSupabaseBackendConfigured || !supabaseAdmin) {
      return res.status(503).json({ error: 'Supabase is not configured on server' });
    }

    const { data, error } = await supabaseAdmin.rpc('create_next_attempt', {
      p_student_id: studentId,
      p_test_id: testId,
      p_duration_minutes: durationMinutes || 180,
      p_is_error_correct_test: Boolean(isErrorCorrectTest),
      p_parent_attempt_id: parentAttemptId || null,
    });

    if (error) {
      console.error('RPC create_next_attempt error:', error);
      return res.status(500).json({ error: error.message });
    }

    const row = Array.isArray(data) ? data[0] : data;
    return res.json({
      attemptId: row.attempt_id,
      attemptNumber: row.attempt_number,
      startedAt: row.started_at,
    });
  } catch (err: any) {
    console.error('Error creating attempt:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Authoritative Attempt Submission & Scoring
apiRouter.post('/attempts/:attemptId/submit', async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { testId, responses } = req.body;

    if (!testId || !responses) {
      return res.status(400).json({ error: 'testId and responses are required' });
    }

    // Authoritatively evaluate on server
    const evaluation = evaluateSubmissionAuthoritatively(testId, responses);
    const submittedAt = new Date().toISOString();

    if (isSupabaseBackendConfigured && supabaseAdmin) {
      // 1. Update evaluated responses
      for (const evaluated of evaluation.evaluatedResponses) {
        await supabaseAdmin
          .from('responses')
          .update({
            is_correct: evaluated.isCorrect,
            marks_awarded: evaluated.marksAwarded,
            time_spent_seconds: evaluated.timeSpentSeconds,
            updated_at: submittedAt,
          })
          .eq('attempt_id', attemptId)
          .eq('question_id', evaluated.questionId);
      }

      // 2. Update attempt with official scores
      const { data, error } = await supabaseAdmin
        .from('attempts')
        .update({
          status: 'COMPLETED',
          submitted_at: submittedAt,
          score: evaluation.score,
          accuracy: evaluation.accuracy,
          physics_score: evaluation.physicsScore,
          chemistry_score: evaluation.chemistryScore,
          math_score: evaluation.mathScore,
          correct_count: evaluation.correctCount,
          wrong_count: evaluation.wrongCount,
          unattempted_count: evaluation.unattemptedCount,
          total_time_seconds: evaluation.totalTimeSeconds,
          updated_at: submittedAt,
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({
        success: true,
        attempt: data,
        evaluation,
      });
    }

    // Return evaluated scores
    return res.json({
      success: true,
      evaluation,
    });
  } catch (err: any) {
    console.error('Error submitting attempt:', err);
    return res.status(500).json({ error: err.message || 'Scoring evaluation failed' });
  }
});
