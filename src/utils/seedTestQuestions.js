/**
 * Bulk-add MCQ questions to every section of a test until each section is full.
 * Retries failed API calls immediately (no delays).
 */

import { getTest, addQuestionToTest } from '../api/testsApi';
import {
  QUESTION_TYPE_IDS,
  DIFFICULTY_LEVELS,
  TEST_QUESTION_SEED,
} from '../constants/constants';

const WORDS = [
  'alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma', 'theta', 'lambda',
  'vector', 'matrix', 'scalar', 'tensor', 'quantum', 'proton', 'electron',
  'catalyst', 'enzyme', 'polymer', 'isotope', 'orbital', 'integral',
  'derivative', 'theorem', 'axiom', 'lemma', 'corollary', 'hypothesis',
  'velocity', 'momentum', 'entropy', 'enthalpy', 'equilibrium', 'reaction',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomToken = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const capitalize = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1);

function buildQuestionPayload(section, index) {
  const token = randomToken();
  const subject = section.subjectName || 'General';
  const difficulty = pick(Object.values(DIFFICULTY_LEVELS));

  const optionTexts = Array.from({ length: 4 }, (_, i) =>
    `${pick(WORDS)}-${token}-${i + 1}`,
  );
  const correctIndex = Math.floor(Math.random() * 4);

  return {
    sectionId: Number(section.id),
    questionData: {
      questionText: `Q${index + 1}: ${capitalize(pick(WORDS))} ${pick(WORDS)} (${subject}) #${token}`,
      questionTypeId: QUESTION_TYPE_IDS.MCQ_SINGLE,
      subjectName: subject,
      difficulty,
      explanation: `Auto-seeded explanation ${token}`,
    },
    options: optionTexts.map((text, i) => ({
      optionLabel: String(i + 1),
      optionText: text,
      isCorrect: i === correctIndex,
    })),
  };
}

async function withRetry(fn, { maxRetries, onRetry }) {
  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) break;
      onRetry?.(attempt + 1, error);
      attempt += 1;
    }
  }

  throw lastError;
}

function getSectionLimit(section) {
  return Number(section.maxQuestionCount ?? section.questionCount ?? 0);
}

function getSectionCurrent(section) {
  return Number(section.currentQuestionCount ?? section.questions?.length ?? 0);
}

/**
 * @param {Object} options
 * @param {number|string} options.testId
 * @param {number} [options.maxRetries]
 * @param {(event: object) => void} [options.onProgress]
 * @param {() => boolean} [options.shouldStop]
 */
export async function seedTestQuestions({
  testId,
  maxRetries = TEST_QUESTION_SEED.MAX_RETRIES,
  onProgress,
  shouldStop,
}) {
  const numericTestId = Number(testId);
  if (!Number.isFinite(numericTestId) || numericTestId <= 0) {
    throw new Error('Valid test ID is required');
  }

  const emit = (type, payload = {}) => {
    onProgress?.({ type, testId: numericTestId, ...payload });
  };

  emit('start', { message: `Fetching test #${numericTestId}…` });

  const testResponse = await withRetry(
    () => getTest(numericTestId),
    {
      maxRetries,
      onRetry: (n, err) =>
        emit('retry', { step: 'fetch-test', attempt: n, error: err?.message }),
    },
  );

  if (!testResponse.success) {
    throw new Error(testResponse.message || 'Failed to fetch test');
  }

  const test = testResponse.data;
  const sections = Array.isArray(test.sections) ? test.sections : [];

  if (!sections.length) {
    throw new Error('Test has no sections');
  }

  if (test.isFinal) {
    throw new Error('Cannot seed questions into a finalized (published) test');
  }

  emit('test-loaded', {
    message: `Loaded "${test.name}" with ${sections.length} section(s)`,
    testName: test.name,
    sections: sections.map((s) => ({
      id: s.id,
      name: s.sectionName,
      current: getSectionCurrent(s),
      limit: getSectionLimit(s),
    })),
  });

  let added = 0;
  let failed = 0;

  for (const section of sections) {
    if (shouldStop?.()) {
      emit('stopped', { message: 'Stopped by user', added, failed });
      return { added, failed, stopped: true };
    }

    const limit = getSectionLimit(section);
    let current = getSectionCurrent(section);
    const needed = Math.max(0, limit - current);

    emit('section-start', {
      sectionId: section.id,
      sectionName: section.sectionName,
      current,
      limit,
      needed,
      message: `Section "${section.sectionName}": ${current}/${limit} — adding ${needed}`,
    });

    if (needed === 0) {
      emit('section-skip', {
        sectionId: section.id,
        message: `Section "${section.sectionName}" already full`,
      });
      continue;
    }

    for (let i = 0; i < needed; i += 1) {
      if (shouldStop?.()) {
        emit('stopped', { message: 'Stopped by user', added, failed });
        return { added, failed, stopped: true };
      }

      const payload = buildQuestionPayload(section, current + i);

      try {
        const result = await withRetry(
          () => addQuestionToTest(numericTestId, payload),
          {
            maxRetries,
            onRetry: (attempt, err) => {
              emit('retry', {
                step: 'add-question',
                sectionId: section.id,
                questionIndex: i + 1,
                attempt,
                error: err?.message || err?.result?.responseDescription || 'Request failed',
              });
            },
          },
        );

        if (!result.success) {
          throw new Error(result.message || 'Add question failed');
        }

        added += 1;
        current += 1;

        emit('question-added', {
          sectionId: section.id,
          sectionName: section.sectionName,
          progress: `${current}/${limit}`,
          added,
          message: `Added question ${current}/${limit} in "${section.sectionName}"`,
        });
      } catch (error) {
        failed += 1;
        emit('question-failed', {
          sectionId: section.id,
          sectionName: section.sectionName,
          error: error?.message || error?.result?.responseDescription || 'Unknown error',
          failed,
        });
      }
    }

    emit('section-done', {
      sectionId: section.id,
      sectionName: section.sectionName,
      message: `Finished section "${section.sectionName}"`,
    });
  }

  emit('complete', {
    message: `Done — added ${added}, failed ${failed}`,
    added,
    failed,
  });

  return { added, failed, stopped: false };
}

export default seedTestQuestions;
