// ==============================================================================
// EDUSTACK 2.0 — ROOT APPLICATION & ROUTER
// ==============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { AppNavbar } from './components/layout/AppNavbar';
import { DemoModeBanner } from './components/layout/DemoModeBanner';
import { StudentDashboard } from './features/dashboard/StudentDashboard';
import { CbtTestEngine } from './features/test-engine/CbtTestEngine';
import { MockAnalysisView } from './features/analysis/MockAnalysisView';
import { SmartErrorNotesView } from './features/error-notes/SmartErrorNotesView';
import { ErrorCorrectTestEngine } from './features/error-retest/ErrorCorrectTestEngine';
import { ErrorNotesPdfGenerator } from './features/pdf/ErrorNotesPdfGenerator';
import { AuthCallback } from './features/auth/AuthCallback';
import { storageAdapter } from './services/storageAdapter';
import { getTestById } from './data/testRegistry';

// Quick router redirector for /test/:testId
const TestStartRedirect: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { student } = useAuth();
  const [redirecting, setRedirecting] = React.useState(true);
  const [targetUrl, setTargetUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!testId) return;
    const test = getTestById(testId);
    if (!test) {
      setTargetUrl('/');
      setRedirecting(false);
      return;
    }

    const currentStudentId = student?.id || '00000000-0000-0000-0000-000000000001';

    storageAdapter
      .createNextAttempt(currentStudentId, test.id, test.durationMinutes)
      .then((att) => {
        setTargetUrl(`/test/${test.id}/attempt/${att.id}`);
        setRedirecting(false);
      })
      .catch((err) => {
        console.error('Failed to create attempt:', err);
        setTargetUrl('/');
        setRedirecting(false);
      });
  }, [testId, student]);

  if (redirecting || !targetUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Navigate to={targetUrl} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen flex flex-col bg-slate-100">
          <DemoModeBanner />
          <AppNavbar />

          <main className="flex-1">
            <Routes>
              {/* 1. Dashboard: Available vs Attended Tests */}
              <Route path="/" element={<StudentDashboard />} />

              {/* 2. Direct Test launcher */}
              <Route path="/test/:testId" element={<TestStartRedirect />} />

              {/* 3. CBT Test Engine with Active Attempt */}
              <Route path="/test/:testId/attempt/:attemptId" element={<CbtTestEngine />} />

              {/* 4. Mock Analysis */}
              <Route path="/analysis/:attemptId" element={<MockAnalysisView />} />

              {/* 5. Smart Error Notes */}
              <Route path="/error-notes/:attemptId" element={<SmartErrorNotesView />} />

              {/* 6. Error Correct Test Engine */}
              <Route path="/error-retest/:parentAttemptId" element={<ErrorCorrectTestEngine />} />

              {/* 7. Error Notes PDF Generator */}
              <Route path="/pdf/:attemptId" element={<ErrorNotesPdfGenerator />} />

              {/* 8. Supabase Google OAuth Callback */}
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
