/**
 * Pages Index
 * Re-exports all page components
 */

// Auth pages
export { default as Login } from './Login';
export { default as ExamineeLogin } from './ExamineeLogin';
export { default as ExamineeRegister } from './ExamineeRegister';

// Common pages
export { default as Dashboard } from './Dashboard';
export { default as Profile } from './Profile';

// Staff pages - Questions
export { default as QuestionList } from './QuestionList';
export { default as QuestionForm } from './QuestionForm';

// Staff pages - Tests
export { default as TestList } from './TestList';
export { default as TestForm } from './TestForm';
export { default as TestQuestions } from './TestQuestions';

// Staff pages - Users
export { default as UserList } from './UserList';
export { default as UserForm } from './UserForm';

// Staff pages - Roles
export { default as RoleList } from './RoleList';
export { default as RoleForm } from './RoleForm';

// Examinee pages
export { default as ExamineeDashboard } from './ExamineeDashboard';
export { default as TakeTest } from './TakeTest';
export { default as TestAttempt } from './TestAttempt';
export { default as Results } from './Results';
export { default as History } from './History';
