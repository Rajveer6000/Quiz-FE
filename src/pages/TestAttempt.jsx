/**
 * TestAttempt Page
 * Active test taking interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Loader } from '../components/common';
import { Timer, QuestionCard, QuestionPalette, SectionTabs } from '../components/quiz';
import { 
  getAttemptState, 
  saveAnswer, 
  markForReview, 
  navigate as navigateQuestion,
  submitAttempt,
  logWindowEvent 
} from '../api';
import { QUESTION_TYPES, SUBMISSION_TYPES } from '../constants/constants';

const TestAttempt = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitModal, setSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const questionStartTime = useRef(Date.now());

  useEffect(() => {
    fetchAttemptState();
    setupWindowEvents();
    return () => cleanupWindowEvents();
  }, [attemptId]);

  const fetchAttemptState = async () => {
    try {
      const response = await getAttemptState(attemptId);
      if (response.success) {
        setAttempt(response.data);
        initializeAnswers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch attempt:', error);
      navigate('/take-test');
    } finally {
      setLoading(false);
    }
  };

  const initializeAnswers = (attemptData) => {
    const answers = {};
    attemptData.sections?.forEach(section => {
      section.questions?.forEach(q => {
        answers[q.testQuestionId] = {
          selectedOptionId: q.selectedOptionId,
          selectedOptionIds: q.selectedOptionIds || [],
          selectedAnswer: q.selectedAnswer,
          isAnswered: q.isAnswered,
          isReviewed: q.isReviewed,
        };
      });
    });
    setAnswers(answers);
  };

  const setupWindowEvents = () => {
    const handleVisibility = () => {
      const eventType = document.hidden ? 'visibility_hidden' : 'visibility_visible';
      const question = getCurrentQuestion();
      logWindowEvent(attemptId, { eventType, lastQuestionId: question?.testQuestionId });
    };

    const handleBlur = () => {
      const question = getCurrentQuestion();
      logWindowEvent(attemptId, { eventType: 'blur', lastQuestionId: question?.testQuestionId });
    };

    const handleFocus = () => {
      const question = getCurrentQuestion();
      logWindowEvent(attemptId, { eventType: 'focus', lastQuestionId: question?.testQuestionId });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  };

  const cleanupWindowEvents = () => {};

  const getCurrentSection = () => attempt?.sections?.[currentSectionIndex];
  const getCurrentQuestion = () => getCurrentSection()?.questions?.[currentQuestionIndex];
  const getAllQuestions = () => getCurrentSection()?.questions || [];

  const handleSelectOption = async (value) => {
    const question = getCurrentQuestion();
    if (!question) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const newAnswer = { ...answers[question.testQuestionId] };

    if (question.questionType === QUESTION_TYPES.MCQ_SINGLE) {
      newAnswer.selectedOptionId = value;
      newAnswer.selectedOptionIds = [];
    } else {
      newAnswer.selectedOptionId = null;
      newAnswer.selectedOptionIds = value;
    }
    newAnswer.isAnswered = true;

    setAnswers({ ...answers, [question.testQuestionId]: newAnswer });

    try {
      await saveAnswer(attemptId, {
        testQuestionId: question.testQuestionId,
        selectedOptionId: newAnswer.selectedOptionId,
        selectedOptionIds: newAnswer.selectedOptionIds.length > 0 ? newAnswer.selectedOptionIds : undefined,
        timeSpentSec: timeSpent,
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleNumericChange = async (value) => {
    const question = getCurrentQuestion();
    if (!question) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const newAnswer = { 
      ...answers[question.testQuestionId],
      selectedAnswer: value,
      isAnswered: Boolean(value),
    };

    setAnswers({ ...answers, [question.testQuestionId]: newAnswer });

    try {
      await saveAnswer(attemptId, {
        testQuestionId: question.testQuestionId,
        selectedAnswer: value || null,
        timeSpentSec: timeSpent,
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleMarkReview = async () => {
    const question = getCurrentQuestion();
    if (!question) return;

    const currentAnswer = answers[question.testQuestionId] || {};
    const newReviewState = !currentAnswer.isReviewed;

    setAnswers({
      ...answers,
      [question.testQuestionId]: { ...currentAnswer, isReviewed: newReviewState },
    });

    try {
      await markForReview(attemptId, {
        testQuestionId: question.testQuestionId,
        isReviewed: newReviewState,
      });
    } catch (error) {
      console.error('Failed to mark for review:', error);
    }
  };

  const handleClearAnswer = async () => {
    const question = getCurrentQuestion();
    if (!question) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const newAnswer = {
      selectedOptionId: null,
      selectedOptionIds: [],
      selectedAnswer: null,
      isAnswered: false,
      isReviewed: answers[question.testQuestionId]?.isReviewed || false,
    };

    setAnswers({ ...answers, [question.testQuestionId]: newAnswer });

    try {
      await saveAnswer(attemptId, {
        testQuestionId: question.testQuestionId,
        selectedOptionId: null,
        timeSpentSec: timeSpent,
      });
    } catch (error) {
      console.error('Failed to clear answer:', error);
    }
  };

  const navigateToQuestion = async (newIndex) => {
    const fromQuestion = getCurrentQuestion();
    const toQuestions = getAllQuestions();
    const toQuestion = toQuestions[newIndex];
    
    if (!toQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);

    try {
      await navigateQuestion(attemptId, {
        fromQuestionId: fromQuestion?.testQuestionId,
        toQuestionId: toQuestion.testQuestionId,
        timeSpentSec: timeSpent,
      });
    } catch (error) {
      console.error('Failed to log navigation:', error);
    }

    setCurrentQuestionIndex(newIndex);
    questionStartTime.current = Date.now();
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < getAllQuestions().length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const handleSectionChange = (index) => {
    setCurrentSectionIndex(index);
    setCurrentQuestionIndex(0);
    questionStartTime.current = Date.now();
  };

  const handleSubmit = async (type = SUBMISSION_TYPES.MANUAL) => {
    setSubmitting(true);
    try {
      const response = await submitAttempt(attemptId, type);
      if (response.success) {
        navigate(`/results/${attemptId}`);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert(error.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
      setSubmitModal(false);
    }
  };

  const handleTimeUp = () => {
    handleSubmit(SUBMISSION_TYPES.AUTO_TIMEOUT);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Attempt not found</p>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const currentAnswer = currentQuestion ? answers[currentQuestion.testQuestionId] || {} : {};
  const questions = getAllQuestions().map(q => ({
    ...q,
    ...answers[q.testQuestionId],
  }));

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-xl border-b border-glass-border">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-lg font-semibold text-white">Test Attempt</h1>
          
          <Timer
            totalMinutes={attempt.totalDurationMin}
            remainingMinutes={attempt.remainingTimeMin}
            onTimeUp={handleTimeUp}
          />

          <Button variant="danger" onClick={() => setSubmitModal(true)}>
            Submit Test
          </Button>
        </div>

        {/* Section Tabs */}
        <SectionTabs
          sections={attempt.sections || []}
          activeSectionIndex={currentSectionIndex}
          onSectionChange={handleSectionChange}
        />
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Question Area */}
        <div className="flex-1 p-6">
          {currentQuestion && (
            <>
              <QuestionCard
                question={currentQuestion}
                selectedOptionId={currentAnswer.selectedOptionId}
                selectedOptionIds={currentAnswer.selectedOptionIds || []}
                numericAnswer={currentAnswer.selectedAnswer}
                onSelectOption={handleSelectOption}
                onNumericChange={handleNumericChange}
                isReviewed={currentAnswer.isReviewed}
                questionNumber={currentQuestionIndex + 1}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleClearAnswer}>
                    Clear Response
                  </Button>
                  <Button
                    variant={currentAnswer.isReviewed ? 'accent' : 'outline'}
                    onClick={handleMarkReview}
                  >
                    {currentAnswer.isReviewed ? '★ Marked' : '☆ Mark for Review'}
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Question Palette Sidebar */}
        <aside className="w-72 p-6 border-l border-glass-border shrink-0">
          <QuestionPalette
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionSelect={navigateToQuestion}
          />
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={submitModal}
        onClose={() => setSubmitModal(false)}
        title="Submit Test"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubmitModal(false)}>
              Continue Test
            </Button>
            <Button variant="danger" onClick={() => handleSubmit()} isLoading={submitting}>
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>Are you sure you want to submit the test?</p>
          
          <div className="p-4 bg-dark-800 rounded-xl space-y-2 text-sm">
            {attempt.sections?.map((section, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-400">{section.sectionName}:</span>
                <span className="text-white">
                  {section.questionsAttempted || 0} / {section.questionsInSection} answered
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-warning-500/10 border border-warning-500/30 rounded-xl">
            <p className="text-warning-400 text-sm">
              ⚠️ You cannot modify answers after submission.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestAttempt;
