/**
 * Quiz Application
 * Main application component with routing and authentication
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, StaffRoute, ExamineeRoute, PublicRoute } from './context';
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
  TestQuestions,
  // Staff - Users
  UserList,
  UserForm,
  // Staff - Roles
  RoleList,
  RoleForm,
  // Examinee
  ExamineeDashboard,
  TakeTest,
  TestAttempt,
  Results,
  History,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            
            {/* Questions */}
            <Route path="/questions" element={<QuestionList />} />
            <Route path="/questions/new" element={<QuestionForm />} />
            <Route path="/questions/:id/edit" element={<QuestionForm />} />
            
            {/* Tests */}
            <Route path="/tests" element={<TestList />} />
            <Route path="/tests/new" element={<TestForm />} />
            <Route path="/tests/:testId" element={<TestForm />} />
            <Route path="/tests/:testId/edit" element={<TestForm />} />
            <Route path="/tests/:testId/sections/:sectionId/questions" element={<TestQuestions />} />
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
    </BrowserRouter>
  );
}

export default App;
