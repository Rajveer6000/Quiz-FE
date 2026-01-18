/**
 * TestAttempt Page
 * Active test taking interface with fullscreen enforcement
 * Loads structure, syncs every 5 seconds, handles all question types
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Loader } from '../components/common';
import { useToast } from '../context';
import { STORAGE_KEYS } from '../constants/constants';
import {
  getAttemptStructure,
  syncAttempt,
  getAttemptQuestion,
  saveAnswer,
  markForReview,
  navigate as navigateQuestion,
  submitAttempt,
  logWindowEvent
} from '../api/testAttemptApi';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Maximize
} from 'lucide-react';

// Sync interval in milliseconds
const SYNC_INTERVAL = 5000;

// Question status colors
const QUESTION_STATUS = {
  NOT_VISITED: 'bg-gray-600',
  ANSWERED: 'bg-emerald-500',
  NOT_ANSWERED: 'bg-red-500',
  MARKED_FOR_REVIEW: 'bg-violet-500',
  ANSWERED_AND_MARKED: 'bg-gradient-to-br from-emerald-500 to-violet-500'
};

// Helper to get readable question type label
const getQuestionTypeLabel = (type) => {
  if (!type) return '';
  if (type === 'MCQ_SINGLE') return 'Single Choice';
  if (type === 'MCQ_MULTI') return 'Multiple Choice';
  if (type.startsWith('NUM')) return 'Numeric';
  return type.replace(/_/g, ' ');
};

// Helper to check if question is numeric type
const isNumericType = (type) => type?.startsWith('NUM');

const TestAttempt = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [structure, setStructure] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [answers, setAnswers] = useState({});
  const [remainingTimeMs, setRemainingTimeMs] = useState(0);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [questionCache, setQuestionCache] = useState({}); // Cache for loaded questions

  // Refs
  const questionStartTime = useRef(Date.now());
  const syncIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const structureRef = useRef(null);
  const timeExpiredRef = useRef(false);
  const remainingTimeMsRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    structureRef.current = structure;
  }, [structure]);

  useEffect(() => {
    remainingTimeMsRef.current = remainingTimeMs;
  }, [remainingTimeMs]);

  // Check fullscreen
  const checkFullscreen = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }, []);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      setFullscreenWarning(false);
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  }, []);

  // Load question details - checks cache first
  const loadQuestion = useCallback(async (testQuestionId) => {
    // Check cache first
    if (questionCache[testQuestionId]) {
      console.log('[Question] Loading from cache:', testQuestionId);
      const cachedData = questionCache[testQuestionId];

      // Update current question with cached data + current answer state
      const answerState = answers[testQuestionId] || {};
      setCurrentQuestion({
        ...cachedData,
        selectedOptionId: answerState.selectedOptionId ?? cachedData.selectedOptionId,
        selectedOptionIds: answerState.selectedOptionIds ?? cachedData.selectedOptionIds,
        selectedAnswer: answerState.selectedAnswer ?? cachedData.selectedAnswer,
        isAnswered: answerState.isAnswered ?? cachedData.isAnswered,
        isReviewed: answerState.isReviewed ?? cachedData.isReviewed
      });
      questionStartTime.current = Date.now();
      return;
    }

    // Not in cache, fetch from API
    try {
      setLoadingQuestion(true);
      console.log('[Question] Loading from API:', testQuestionId);
      const response = await getAttemptQuestion(attemptId, testQuestionId);

      if (response.success) {
        const questionData = response.data;

        // Store in cache
        setQuestionCache(prev => ({
          ...prev,
          [testQuestionId]: questionData
        }));

        setCurrentQuestion(questionData);
        questionStartTime.current = Date.now();

        // Mark question as visited
        setVisitedQuestions(prev => new Set([...prev, testQuestionId]));

        setAnswers(prev => ({
          ...prev,
          [testQuestionId]: {
            ...prev[testQuestionId],
            selectedOptionId: questionData.selectedOptionId,
            selectedOptionIds: questionData.selectedOptionIds || [],
            selectedAnswer: questionData.selectedAnswer,
            isAnswered: questionData.isAnswered,
            isReviewed: questionData.isReviewed,
            visited: true
          }
        }));
      }
    } catch (error) {
      console.error('Error loading question:', error);
      showToast('Failed to load question', 'error');
    } finally {
      setLoadingQuestion(false);
    }
  }, [attemptId, showToast, questionCache, answers]);

  // Submit test
  const handleSubmit = useCallback(async (type = 'manual') => {
    setSubmitting(true);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ATTEMPT);
      const response = await submitAttempt(attemptId, type);
      if (response.success) {
        navigate(`/results/${attemptId}`);
      } else {
        showToast(response.message || 'Failed to submit', 'error');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      showToast('Failed to submit test', 'error');
    } finally {
      setSubmitting(false);
      setSubmitModal(false);
    }
  }, [attemptId, navigate, showToast]);

  // Load attempt structure
  useEffect(() => {
    const loadStructure = async () => {
      try {
        setLoading(true);
        const response = await getAttemptStructure(attemptId);

        if (response.success) {
          const data = response.data;
          setStructure(data);
          structureRef.current = data;

          const remainingMs = Math.round(parseFloat(data.remainingTimeMin) * 60 * 1000);
          setRemainingTimeMs(remainingMs);

          const initialAnswers = {};
          data.sections?.forEach(section => {
            section.questions?.forEach(q => {
              initialAnswers[q.testQuestionId] = {
                isAnswered: q.isAnswered,
                isReviewed: q.isReviewed,
                status: q.status
              };
            });
          });
          setAnswers(initialAnswers);

          if (data.sections?.[0]?.questions?.[0]) {
            await loadQuestion(data.sections[0].questions[0].testQuestionId);
          }
        } else {
          setError(response.message || 'Failed to load test');
        }
      } catch (err) {
        console.error('Error loading structure:', err);
        setError('Failed to load test. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadStructure();
    requestFullscreen();
  }, [attemptId, loadQuestion, requestFullscreen]);

  // Timer effect - only run when structure is loaded
  useEffect(() => {
    // Don't start timer until we have a valid remaining time from the server
    if (!structure || remainingTimeMs <= 0) return;

    timerIntervalRef.current = setInterval(() => {
      setRemainingTimeMs(prev => {
        // Only trigger auto-submit if time has genuinely run out (started > 0 and now <= 1000)
        if (prev <= 1000 && prev > 0 && !timeExpiredRef.current) {
          timeExpiredRef.current = true;
          showToast('Time is up! Submitting test...', 'warning');
          handleSubmit('auto_timeout');
          return 0;
        }
        // Don't go below 0
        if (prev <= 0) return 0;
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [structure, handleSubmit, showToast]); // Only depend on structure, not remainingTimeMs to avoid resetting interval

  // Sync effect - syncs every 5 seconds
  useEffect(() => {
    // Don't start sync until structure is loaded
    if (!structure) return;

    const performSync = async () => {
      const currentSection = structure.sections?.[currentSectionIndex];
      const currentQ = currentSection?.questions?.[currentQuestionIndex];

      try {
        console.log('[Sync] Calling sync API...');
        const response = await syncAttempt(attemptId, {
          timeRemainingMs: remainingTimeMsRef.current,
          currentSectionId: currentSection?.sectionId,
          currentQuestionId: currentQ?.testQuestionId,
          answers: []
        });

        if (response.success) {
          console.log('[Sync] Success:', response.data);
          if (response.data.remainingTimeMin) {
            const serverRemainingMs = Math.round(parseFloat(response.data.remainingTimeMin) * 60 * 1000);
            setRemainingTimeMs(serverRemainingMs);
          }
        }
      } catch (error) {
        console.error('[Sync] Failed:', error);
      }
    };

    // Initial sync after 1 second
    const initialTimeoutId = setTimeout(performSync, 1000);

    // Then sync every 5 seconds
    syncIntervalRef.current = setInterval(performSync, SYNC_INTERVAL);

    return () => {
      clearTimeout(initialTimeoutId);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [attemptId, structure, currentSectionIndex, currentQuestionIndex]); // Remove remainingTimeMs from deps to avoid resetting interval

  // Window events effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      const nowFullscreen = checkFullscreen();
      setIsFullscreen(nowFullscreen);

      if (!nowFullscreen) {
        setViolationCount(v => v + 1);
        setFullscreenWarning(true);
        const currentSection = structureRef.current?.sections?.[currentSectionIndex];
        const currentQ = currentSection?.questions?.[currentQuestionIndex];
        logWindowEvent(attemptId, {
          eventType: 'fullscreen_exit',
          lastQuestionId: currentQ?.testQuestionId
        });
      }
    };

    const handleVisibilityChange = () => {
      const currentSection = structureRef.current?.sections?.[currentSectionIndex];
      const currentQ = currentSection?.questions?.[currentQuestionIndex];

      if (document.hidden) {
        setViolationCount(v => v + 1);
        logWindowEvent(attemptId, {
          eventType: 'visibility_hidden',
          lastQuestionId: currentQ?.testQuestionId
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    setIsFullscreen(checkFullscreen());

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, checkFullscreen, currentSectionIndex, currentQuestionIndex]);

  // Handle option select (MCQ Single)
  const handleSelectOption = async (optionId) => {
    if (!currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const testQuestionId = currentQuestion.testQuestionId;

    setAnswers(prev => ({
      ...prev,
      [testQuestionId]: { ...prev[testQuestionId], selectedOptionId: optionId, selectedOptionIds: [], isAnswered: true }
    }));

    setCurrentQuestion(prev => ({ ...prev, selectedOptionId: optionId, selectedOptionIds: null, isAnswered: true }));

    try {
      await saveAnswer(attemptId, { testQuestionId, selectedOptionId: optionId, timeSpentSec: timeSpent });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  // Handle multi-select (MCQ Multi)
  const handleToggleMultiOption = async (optionId) => {
    if (!currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const testQuestionId = currentQuestion.testQuestionId;
    const currentIds = currentQuestion.selectedOptionIds || [];

    const newIds = currentIds.includes(optionId)
      ? currentIds.filter(id => id !== optionId)
      : [...currentIds, optionId];

    setAnswers(prev => ({
      ...prev,
      [testQuestionId]: { ...prev[testQuestionId], selectedOptionId: null, selectedOptionIds: newIds, isAnswered: newIds.length > 0 }
    }));

    setCurrentQuestion(prev => ({ ...prev, selectedOptionId: null, selectedOptionIds: newIds, isAnswered: newIds.length > 0 }));

    try {
      await saveAnswer(attemptId, { testQuestionId, selectedOptionIds: newIds.length > 0 ? newIds : null, timeSpentSec: timeSpent });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  // Handle numeric answer
  const handleNumericChange = async (value) => {
    if (!currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const testQuestionId = currentQuestion.testQuestionId;

    setAnswers(prev => ({
      ...prev,
      [testQuestionId]: { ...prev[testQuestionId], selectedAnswer: value, isAnswered: Boolean(value) }
    }));

    setCurrentQuestion(prev => ({ ...prev, selectedAnswer: value, isAnswered: Boolean(value) }));

    try {
      await saveAnswer(attemptId, { testQuestionId, selectedAnswer: value || null, timeSpentSec: timeSpent });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  // Clear answer
  const handleClearAnswer = async () => {
    if (!currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const testQuestionId = currentQuestion.testQuestionId;

    setAnswers(prev => ({
      ...prev,
      [testQuestionId]: { ...prev[testQuestionId], selectedOptionId: null, selectedOptionIds: [], selectedAnswer: null, isAnswered: false }
    }));

    setCurrentQuestion(prev => ({ ...prev, selectedOptionId: null, selectedOptionIds: null, selectedAnswer: null, isAnswered: false }));

    try {
      await saveAnswer(attemptId, { testQuestionId, selectedOptionId: null, timeSpentSec: timeSpent });
    } catch (error) {
      console.error('Failed to clear answer:', error);
    }
  };

  // Mark for review
  const handleMarkReview = async () => {
    if (!currentQuestion) return;

    const testQuestionId = currentQuestion.testQuestionId;
    const newReviewState = !currentQuestion.isReviewed;

    setAnswers(prev => ({ ...prev, [testQuestionId]: { ...prev[testQuestionId], isReviewed: newReviewState } }));
    setCurrentQuestion(prev => ({ ...prev, isReviewed: newReviewState }));

    try {
      await markForReview(attemptId, { testQuestionId, isReviewed: newReviewState });
    } catch (error) {
      console.error('Failed to mark for review:', error);
    }
  };

  // Navigate to question
  const navigateToQuestion = async (sectionIdx, questionIdx) => {
    const fromQuestion = currentQuestion;
    const toSection = structure?.sections?.[sectionIdx];
    const toQuestion = toSection?.questions?.[questionIdx];

    if (!toQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);

    // Update indices immediately for responsive UI
    setCurrentSectionIndex(sectionIdx);
    setCurrentQuestionIndex(questionIdx);

    // Run navigate API and load question in parallel
    await Promise.all([
      // Log navigation (fire and forget, don't block on errors)
      navigateQuestion(attemptId, {
        fromQuestionId: fromQuestion?.testQuestionId,
        toQuestionId: toQuestion.testQuestionId,
        timeSpentSec: timeSpent
      }).catch(err => console.error('Failed to log navigation:', err)),

      // Load the next question
      loadQuestion(toQuestion.testQuestionId)
    ]);
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentSectionIndex, currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = structure?.sections?.[currentSectionIndex - 1];
      navigateToQuestion(currentSectionIndex - 1, prevSection.questions.length - 1);
    }
  };

  const handleNext = () => {
    const section = structure?.sections?.[currentSectionIndex];
    if (currentQuestionIndex < section?.questions?.length - 1) {
      navigateToQuestion(currentSectionIndex, currentQuestionIndex + 1);
    } else if (currentSectionIndex < structure?.sections?.length - 1) {
      navigateToQuestion(currentSectionIndex + 1, 0);
    }
  };

  // Format time
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Get question status for palette
  const getQuestionStatus = (q) => {
    const answer = answers[q.testQuestionId] || {};
    // Answered + Reviewed (green with violet corner)
    if (answer.isAnswered && answer.isReviewed) return QUESTION_STATUS.ANSWERED_AND_MARKED;
    // Only Reviewed (violet)
    if (answer.isReviewed) return QUESTION_STATUS.MARKED_FOR_REVIEW;
    // Answered (green)
    if (answer.isAnswered) return QUESTION_STATUS.ANSWERED;
    // Visited but not answered (red) - check both visited flag and visitedQuestions Set
    if (answer.visited || visitedQuestions.has(q.testQuestionId)) return QUESTION_STATUS.NOT_ANSWERED;
    // Not visited yet (gray)
    return QUESTION_STATUS.NOT_VISITED;
  };

  // Calculate stats
  const getStats = () => {
    let answered = 0, reviewed = 0;
    structure?.sections?.forEach(section => {
      section.questions?.forEach(q => {
        const a = answers[q.testQuestionId];
        if (a?.isAnswered) answered++;
        if (a?.isReviewed) reviewed++;
      });
    });
    return { answered, reviewed, total: structure?.totalQuestions || 0 };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-gray-400 mt-4">Loading test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Test</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentSection = structure?.sections?.[currentSectionIndex];
  const stats = getStats();
  const isLowTime = remainingTimeMs < 5 * 60 * 1000;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div>
            <h1 className="text-lg font-semibold text-white">Test Attempt</h1>
            <p className="text-xs text-gray-400">{stats.answered}/{stats.total} answered</p>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isLowTime ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700/50 text-white'}`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono text-xl font-bold">{formatTime(remainingTimeMs)}</span>
          </div>

          <Button variant="danger" onClick={() => setSubmitModal(true)}>
            <Send className="w-4 h-4 mr-2" />
            Submit Test
          </Button>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="bg-slate-800/50 border-b border-white/10 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 max-w-screen-2xl mx-auto">
          {structure?.sections?.map((section, idx) => (
            <button
              key={section.sectionId}
              onClick={() => navigateToQuestion(idx, 0)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${idx === currentSectionIndex ? 'bg-primary-500 text-white' : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'}`}
            >
              {section.name}
              <span className="ml-2 text-xs opacity-75">({section.questionCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loadingQuestion ? (
            <div className="flex items-center justify-center h-full"><Loader size="md" /></div>
          ) : currentQuestion ? (
            <div className="max-w-4xl mx-auto">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm font-medium">Q{currentQuestion.questionOrder}</span>
                  <span className="text-gray-400 text-sm">{getQuestionTypeLabel(currentQuestion.questionType)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-400">+{currentQuestion.marks} marks</span>
                  {currentQuestion.negativeMarks > 0 && <span className="text-red-400">-{currentQuestion.negativeMarks}</span>}
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 mb-6">
                <p className="text-white text-lg leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options?.map((option) => {
                  const isSelected = currentQuestion.questionType === 'MCQ_MULTI'
                    ? (currentQuestion.selectedOptionIds || []).includes(option.id)
                    : currentQuestion.selectedOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => currentQuestion.questionType === 'MCQ_MULTI' ? handleToggleMultiOption(option.id) : handleSelectOption(option.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isSelected ? 'bg-primary-500/20 border-primary-500 text-white' : 'bg-slate-800/30 border-white/10 text-gray-300 hover:border-white/30'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${isSelected ? 'bg-primary-500 text-white' : 'bg-slate-700 text-gray-400'}`}>{option.label}</div>
                      <span className="flex-1">{option.text}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary-400" />}
                    </button>
                  );
                })}

                {currentQuestion.questionType?.startsWith('NUM') && (
                  <div className="bg-slate-800/30 border border-white/10 rounded-xl p-4">
                    <label className="block text-gray-400 text-sm mb-2">
                      Your Answer:
                      {currentQuestion.questionType === 'NUM_DEC_2' && <span className="text-gray-500"> (up to 2 decimal places)</span>}
                      {currentQuestion.questionType === 'NUM_INT' && <span className="text-gray-500"> (integer only)</span>}
                    </label>
                    <input
                      type="number"
                      step={currentQuestion.questionType === 'NUM_INT' ? '1' : currentQuestion.questionType === 'NUM_DEC_2' ? '0.01' : 'any'}
                      value={currentQuestion.selectedAnswer || ''}
                      onChange={(e) => handleNumericChange(e.target.value)}
                      placeholder="Enter your answer"
                      className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-3 text-white text-lg focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleClearAnswer}><RotateCcw className="w-4 h-4 mr-2" />Clear</Button>
                  <Button variant={currentQuestion.isReviewed ? 'accent' : 'outline'} onClick={handleMarkReview}>
                    <Flag className={`w-4 h-4 mr-2 ${currentQuestion.isReviewed ? 'fill-current' : ''}`} />
                    {currentQuestion.isReviewed ? 'Marked' : 'Mark for Review'}
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handlePrev} disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}>
                    <ChevronLeft className="w-4 h-4 mr-1" />Previous
                  </Button>
                  <Button variant="primary" onClick={handleNext} disabled={currentSectionIndex === structure?.sections?.length - 1 && currentQuestionIndex === currentSection?.questions?.length - 1}>
                    Next<ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No question loaded</div>
          )}
        </div>

        {/* Question Palette Sidebar */}
        <aside className="w-80 bg-slate-800/30 border-l border-white/10 p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Question Palette</h3>

          <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${QUESTION_STATUS.ANSWERED}`}></div><span className="text-gray-400">Answered</span></div>
            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${QUESTION_STATUS.NOT_ANSWERED}`}></div><span className="text-gray-400">Not Answered</span></div>
            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${QUESTION_STATUS.MARKED_FOR_REVIEW}`}></div><span className="text-gray-400">Review</span></div>
            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${QUESTION_STATUS.NOT_VISITED}`}></div><span className="text-gray-400">Not Visited</span></div>
          </div>

          {structure?.sections?.map((section, sectionIdx) => (
            <div key={section.sectionId} className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">{section.name}</h4>
              <div className="grid grid-cols-5 gap-2">
                {section.questions?.map((q, qIdx) => {
                  const isActive = sectionIdx === currentSectionIndex && qIdx === currentQuestionIndex;
                  const status = getQuestionStatus(q);

                  return (
                    <button
                      key={q.testQuestionId}
                      onClick={() => navigateToQuestion(sectionIdx, qIdx)}
                      className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${status} ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''} text-white hover:scale-105`}
                    >
                      {q.questionOrder}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-slate-900/50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Answered</span><span className="text-emerald-400">{stats.answered}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">For Review</span><span className="text-violet-400">{stats.reviewed}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Remaining</span><span className="text-gray-300">{stats.total - stats.answered}</span></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal isOpen={submitModal} onClose={() => setSubmitModal(false)} title="Submit Test">
        <div className="space-y-6">
          <p className="text-gray-300">Are you sure you want to submit the test?</p>

          <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Total Questions</span><span className="text-white">{stats.total}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Answered</span><span className="text-emerald-400">{stats.answered}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Unanswered</span><span className="text-red-400">{stats.total - stats.answered}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Marked for Review</span><span className="text-violet-400">{stats.reviewed}</span></div>
          </div>

          {stats.total - stats.answered > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-sm">You have {stats.total - stats.answered} unanswered questions.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setSubmitModal(false)}>Continue Test</Button>
            <Button variant="danger" className="flex-1" onClick={() => handleSubmit()} isLoading={submitting}>Submit Test</Button>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Warning Modal */}
      <Modal isOpen={fullscreenWarning} onClose={() => { }} title="">
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Fullscreen Required!</h2>
          <p className="text-gray-400 mb-4">You have exited fullscreen mode. This has been recorded.</p>

          {violationCount > 2 && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">⚠️ Warning: {violationCount} violations recorded.</p>
            </div>
          )}

          <Button variant="primary" className="w-full bg-gradient-to-r from-primary-500 to-violet-600" onClick={requestFullscreen}>
            <Maximize className="w-4 h-4 mr-2" />Re-enter Fullscreen
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TestAttempt;
