
// =============================================================================
// API BASE URL
// =============================================================================

export const API_BASE_URL = 'http://localhost:8080/api/v1';
// export const API_BASE_URL = 'https://backend-production-806b.up.railway.app/api/v1';
// =============================================================================
// API ENDPOINTS
// =============================================================================
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    LOGIN_EXAMINEE: '/login/examinee',
    REFRESH: '/login/refresh',
    REFRESH_EXAMINEE: '/login/examinee/refresh',
    PROFILE: '/profile',
  },

  // Organizations
  ORGANIZATIONS: {
    BASE: '/organizations',
    RESOLVE: '/organizations/resolve',
    GET_BY_ID: (id) => `/organizations/${id}`,
    MODULES: '/organizations/modules',
  },

  // Users
  USERS: {
    BASE: '/users',
    GET_BY_ID: (id) => `/users/${id}`,
    RESET_PASSWORD: (id) => `/users/${id}/reset-password`,
  },

  // Roles
  ROLES: {
    BASE: '/roles',
    GET_BY_ID: (id) => `/roles/${id}`,
  },

  // Examinees
  EXAMINEES: {
    BASE: '/examinees',
    REGISTER: '/examinees/register',
    INVITATIONS: '/examinees/invitations',
    GET_BY_ID: (id) => `/examinees/${id}`,
  },

  // Groups
  GROUPS: {
    BASE: '/groups',
    GET_BY_ID: (id) => `/groups/${id}`,
    EXTRACT_EMAILS: '/groups/extract-emails',
  },

  // Test Types & Templates
  TEST_TYPES: {
    BASE: '/test-types/types',
    TEMPLATES: (typeId) => `/test-types/${typeId}/templates`,
  },

  TEST_TEMPLATES: {
    SECTIONS: (templateId) => `/test-templates/${templateId}/sections`,
  },

  // Test Attempts
  TEST_ATTEMPTS: {
    BASE: '/test-attempts',
    START: '/test-attempts/start',
    TEST_DETAILS: (testId) => `/test-attempts/tests/${testId}/details`,
    STRUCTURE: (attemptId) => `/test-attempts/${attemptId}/structure`,
    SYNC: (attemptId) => `/test-attempts/${attemptId}/sync`,
    QUESTION: (attemptId, testQuestionId) => `/test-attempts/${attemptId}/questions/${testQuestionId}`,
    GET_STATE: (attemptId) => `/test-attempts/${attemptId}`,
    SAVE_ANSWER: (attemptId) => `/test-attempts/${attemptId}/answer`,
    MARK_REVIEW: (attemptId) => `/test-attempts/${attemptId}/review`,
    NAVIGATE: (attemptId) => `/test-attempts/${attemptId}/navigate`,
    PAUSE: (attemptId) => `/test-attempts/${attemptId}/pause`,
    RESUME: (attemptId) => `/test-attempts/${attemptId}/resume`,
    SUBMIT: (attemptId) => `/test-attempts/${attemptId}/submit`,
    RESULT: (attemptId) => `/test-attempts/${attemptId}/result`,
    HISTORY: '/test-attempts/history',
    WINDOW_EVENT: (attemptId) => `/test-attempts/${attemptId}/window-event`,
  },

  // Questions
  QUESTIONS: {
    BASE: '/questions',
    GET_BY_ID: (id) => `/questions/${id}`,
    BULK: '/questions/bulk',
  },

  // Tests
  TESTS: {
    BASE: '/tests',
    GET_BY_ID: (id) => `/tests/${id}`,
    ADD_QUESTION: (testId) => `/tests/${testId}/questions`,
    REMOVE_QUESTION: (testId, questionId) => `/tests/${testId}/questions/${questionId}`,
    UPDATE_QUESTION: (testId, questionId) => `/tests/${testId}/questions/${questionId}`,
    FINALIZE: (testId) => `/tests/${testId}/finalize`,
    AVAILABLE: '/tests/available',
  },

  // Purchases
  PURCHASES: {
    BASE: '/purchases',
    ME: '/purchases/me',
    CHECK_ACCESS: (testId) => `/purchases/check-access/${testId}`,
  },

  // Payments (Razorpay)
  PAYMENTS: {
    CREATE_ORDER: '/payments/create-order',
    CONFIG: '/payments/config',
    VERIFY: '/payments/verify',
  },

  // Allocations (Bulk Purchase)
  ALLOCATIONS: {
    BASE: '/allocations',
    GET_BY_ID: (id) => `/allocations/${id}`,
    VERIFY: '/allocations/verify',
  },

  // File Upload
  UPLOAD: {
    SINGLE: '/upload',
    MULTIPLE: '/upload/multiple',
  },

  // Dashboard
  DASHBOARD: {
    EXAMINEE_STATS: '/dashboard/examinee/stats',
    EXAMINEE_GRAPH: '/dashboard/examinee/graph',
    PAUSED_TESTS: '/dashboard/examinee/paused-tests',
  },
};

// =============================================================================
// ROLES
// =============================================================================
export const ROLES = {
  SUPER_ADMIN: 1,
  ORG_ADMIN: 2,
  EXAMINEE: 3,
};

export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ORG_ADMIN]: 'Organization Admin',
  [ROLES.EXAMINEE]: 'Examinee',
};

// =============================================================================
// MODULES (for permissions)
// =============================================================================
export const MODULES = {
  USERS: 'users',
  ROLES: 'roles',
  ORGANIZATIONS: 'organizations',
  QUIZZES: 'quizzes',
  ANALYTICS: 'analytics',
  MODULES: 'modules',
  EXAMINEE: 'examinee',
};

// =============================================================================
// ATTEMPT STATUS CODES
// =============================================================================
export const ATTEMPT_STATUS = {
  IN_PROGRESS: 1,
  PAUSED: 2,
  SUBMITTED: 3,
  ABANDONED: 4,
};

export const ATTEMPT_STATUS_LABELS = {
  [ATTEMPT_STATUS.IN_PROGRESS]: 'In Progress',
  [ATTEMPT_STATUS.PAUSED]: 'Paused',
  [ATTEMPT_STATUS.SUBMITTED]: 'Submitted',
  [ATTEMPT_STATUS.ABANDONED]: 'Abandoned',
};

// =============================================================================
// QUESTION STATUS CODES
// =============================================================================
export const QUESTION_STATUS = {
  VIEWED: 1,
  ANSWERED: 2,
  MARKED_FOR_REVIEW: 3,
  CLEARED: 4,
};

export const QUESTION_STATUS_LABELS = {
  [QUESTION_STATUS.VIEWED]: 'Viewed',
  [QUESTION_STATUS.ANSWERED]: 'Answered',
  [QUESTION_STATUS.MARKED_FOR_REVIEW]: 'Marked for Review',
  [QUESTION_STATUS.CLEARED]: 'Cleared',
};

// =============================================================================
// QUESTION TYPES
// =============================================================================
export const QUESTION_TYPES = {
  MCQ_SINGLE: 'MCQ_SINGLE',
  MCQ_MULTI: 'MCQ_MULTI',
  NUMERIC: 'NUM',
};

export const QUESTION_TYPE_IDS = {
  MCQ_SINGLE: 1,
  MCQ_MULTI: 2,
  NUMERIC: 3,
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.MCQ_SINGLE]: 'Single Choice',
  [QUESTION_TYPES.MCQ_MULTI]: 'Multiple Choice',
  [QUESTION_TYPES.NUMERIC]: 'Numeric',
};

// =============================================================================
// DIFFICULTY LEVELS
// =============================================================================
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const DIFFICULTY_LABELS = {
  [DIFFICULTY_LEVELS.EASY]: 'Easy',
  [DIFFICULTY_LEVELS.MEDIUM]: 'Medium',
  [DIFFICULTY_LEVELS.HARD]: 'Hard',
};

// =============================================================================
// SUBMISSION TYPES
// =============================================================================
export const SUBMISSION_TYPES = {
  MANUAL: 'manual',
  AUTO_TIMEOUT: 'auto_timeout',
  FORCE_SUBMIT: 'force_submit',
};

// =============================================================================
// WINDOW EVENT TYPES
// =============================================================================
export const WINDOW_EVENT_TYPES = {
  FOCUS: 'focus',
  BLUR: 'blur',
  VISIBILITY_HIDDEN: 'visibility_hidden',
  VISIBILITY_VISIBLE: 'visibility_visible',
};

// =============================================================================
// PAGINATION DEFAULTS
// =============================================================================
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
};

// =============================================================================
// LOCAL STORAGE KEYS
// =============================================================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'quiz_auth_token',
  REFRESH_TOKEN: 'quiz_refresh_token',
  USER_DATA: 'quiz_user_data',
  ORGANIZATION: 'quiz_organization',
  THEME: 'quiz_theme',
  CURRENT_ATTEMPT: 'quiz_current_attempt',
};

// =============================================================================
// USER STATUS
// =============================================================================
export const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
};
