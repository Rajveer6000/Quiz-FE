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

// Staff pages - Tests/Quizzes
export { default as TestList } from './TestList';
export { default as TestForm } from './TestForm';
export { default as QuizWizard } from './QuizWizard';
export { default as TestQuestions } from './TestQuestions';
export { default as TestDetails } from './TestDetails';

// Staff pages - Users
export { default as UserList } from './UserList';
export { default as UserForm } from './UserForm';

// Staff pages - Roles
export { default as RoleList } from './RoleList';
export { default as RoleForm } from './RoleForm';

// Staff pages - Examinees
export { default as ExamineeList } from './ExamineeList';

// Staff pages - Groups
export { default as GroupList } from './GroupList';
export { default as GroupForm } from './GroupForm';

// Staff pages - Allocations
export { default as AllocationList } from './AllocationList';
export { default as AllocationDetails } from './AllocationDetails';

// Staff pages - Series
export { default as SeriesList } from './SeriesList';
export { default as SeriesForm } from './SeriesForm';
export { default as SeriesDetails } from './SeriesDetails';


// Examinee pages
export { default as ExamineeDashboard } from './ExamineeDashboard';
export { default as TakeTest } from './TakeTest';
export { default as TestAttempt } from './TestAttempt';
export { default as Results } from './Results';
export { default as History } from './History';
export { default as DummyTestAttempt } from './DummyTestAttempt';
export { default as TestStartPage } from './TestStartPage';
export { default as ExamineeSeriesList } from './ExamineeSeriesList';
export { default as ExamineeSeriesDetails } from './ExamineeSeriesDetails';

