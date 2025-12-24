/**
 * Quiz Application
 * Main application component with routing and authentication
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, StaffRoute, ExamineeRoute, PublicRoute, LoadingProvider, useLoading, setLoadingCallbacks, ToastProvider } from './context';
import { Layout } from './components/layout';
import {
  // Auth
  Login,
  ExamineeLogin,
  ExamineeRegister,
  // Common
  Dashboard,
  Profile,
  // Staff - Questions
  QuestionList,
  QuestionForm,
  // Staff - Tests
  TestList,
  TestForm,
  QuizWizard,
  TestQuestions,
  TestDetails,
  // Staff - Users
  UserList,
  UserForm,
  // Staff - Roles
  RoleList,
  RoleForm,
  // Staff - Examinees
  ExamineeList,
  // Examinee
  ExamineeDashboard,
  TakeTest,
  TestAttempt,
  DummyTestAttempt,
  Results,
  History,
} from './pages';

// Component to wire loading callbacks
const LoadingWire = () => {
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    setLoadingCallbacks(startLoading, stopLoading);
  }, [startLoading, stopLoading]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <LoadingWire />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/login/examinee" element={<PublicRoute><ExamineeLogin /></PublicRoute>} />
              <Route path="/register/examinee" element={<PublicRoute><ExamineeRegister /></PublicRoute>} />

              {/* Test Attempt - Full screen without sidebar */}
              <Route path="/attempt/:attemptId" element={
                <ProtectedRoute>
                  <TestAttempt />
                </ProtectedRoute>
              } />

              {/* Staff Routes - Main Layout with Sidebar */}
              <Route element={
                <StaffRoute>
                  <Layout />
                </StaffRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />

                {/* Users */}
                <Route path="/users" element={<UserList />} />
                <Route path="/users/new" element={<UserForm />} />
                <Route path="/users/:id/edit" element={<UserForm />} />

                {/* Roles */}
                <Route path="/roles" element={<RoleList />} />
                <Route path="/roles/new" element={<RoleForm />} />
                <Route path="/roles/:id/edit" element={<RoleForm />} />

                {/* Examinees */}
                <Route path="/examinees" element={<ExamineeList />} />

                {/* Questions */}
                <Route path="/questions" element={<QuestionList />} />
                <Route path="/questions/new" element={<QuestionForm />} />
                <Route path="/questions/:id/edit" element={<QuestionForm />} />

                {/* Tests/Quizzes */}
                <Route path="/tests" element={<TestList />} />
                <Route path="/tests/new" element={<QuizWizard />} />
                <Route path="/tests/:testId" element={<TestForm />} />
                <Route path="/tests/:testId/edit" element={<TestForm />} />
                <Route path="/tests/:testId/sections/:sectionId/questions" element={<TestQuestions />} />
                <Route path="/tests/:testId/details" element={<TestDetails />} />
              </Route>

              {/* Examinee Routes */}
              <Route element={
                <ExamineeRoute>
                  <Layout />
                </ExamineeRoute>
              }>
                <Route path="/examinee" element={<ExamineeDashboard />} />
                <Route path="/examinee/profile" element={<Profile />} />
                <Route path="/examinee/tests" element={<TakeTest />} />
                <Route path="/attempt/dummy/:quizId" element={<DummyTestAttempt />} />
                <Route path="/examinee/history" element={<History />} />
                <Route path="/examinee/results/:attemptId" element={<Results />} />
              </Route>

              {/* Legacy routes that work for both */}
              <Route element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route path="/take-test" element={<TakeTest />} />
                <Route path="/history" element={<History />} />
                <Route path="/results/:attemptId" element={<Results />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;
