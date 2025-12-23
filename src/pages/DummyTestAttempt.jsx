/**
 * Dummy Test Attempt Page
 * Frontend-only version of the test interface for demo
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Loader } from '../components/common';
import { Timer, QuestionCard, QuestionPalette, SectionTabs } from '../components/quiz';
import { dummyQuizzes } from '../data/dummyQuizzes'; // Import data
import { QUESTION_TYPES } from '../constants/constants';
import {
    AlertTriangle,
    CheckCircle,
    Clock
} from 'lucide-react';

const DummyTestAttempt = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitModal, setSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [resultModal, setResultModal] = useState(false);
    const [score, setScore] = useState(0);

    // Timer logic
    const [remainingTime, setRemainingTime] = useState(0); // minutes

    useEffect(() => {
        // Find quiz from dummy data
        const foundQuiz = dummyQuizzes.find(q => q.id === parseInt(quizId));
        if (foundQuiz) {
            setQuiz(foundQuiz);
            setRemainingTime(foundQuiz.duration);
        } else {
            // Fallback for verification if ID doesn't match
            setQuiz(dummyQuizzes[0]);
            setRemainingTime(dummyQuizzes[0]?.duration || 10);
        }
        setLoading(false);
    }, [quizId]);

    const handleSelectOption = (value) => {
        const question = quiz.questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [question.id]: { ...answers[question.id], selectedOptionId: value, isAnswered: true }
        });
    };

    const handleNumericChange = (value) => {
        const question = quiz.questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [question.id]: { ...answers[question.id], selectedAnswer: value, isAnswered: !!value }
        });
    };

    const handleMarkReview = () => {
        const question = quiz.questions[currentQuestionIndex];
        const current = answers[question.id] || {};
        setAnswers({
            ...answers,
            [question.id]: { ...current, isReviewed: !current.isReviewed }
        });
    };

    const handleClearAnswer = () => {
        const question = quiz.questions[currentQuestionIndex];
        const current = answers[question.id] || {};
        setAnswers({
            ...answers,
            [question.id]: { ...current, selectedOptionId: null, selectedAnswer: null, isAnswered: false }
        });
    };

    const handleSubmit = () => {
        setSubmitting(true);

        // Calculate Score
        let calculatedScore = 0;
        quiz.questions.forEach(q => {
            const ans = answers[q.id];
            if (!ans) return;

            if (q.type === 'MCQ') {
                const selectedOpt = q.options.find(o => o.id === ans.selectedOptionId);
                if (selectedOpt?.isCorrect) calculatedScore += q.marks;
            } else if (q.type === 'NUMERIC') {
                if (ans.selectedAnswer === q.answer) calculatedScore += q.marks;
            }
        });

        setScore(calculatedScore);

        setTimeout(() => {
            setSubmitting(false);
            setSubmitModal(false);
            setResultModal(true);
        }, 1500);
    };

    const currentQuestion = quiz?.questions[currentQuestionIndex];
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] || {} : {};

    // Transform questions for palette
    const paletteQuestions = quiz?.questions.map(q => ({
        testQuestionId: q.id,
        isAnswered: answers[q.id]?.isAnswered,
        isReviewed: answers[q.id]?.isReviewed,
        isVisited: true // Simplified
    })) || [];

    if (loading) return <Loader fullScreen />;
    if (!quiz) return <div>Quiz not found</div>;

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-xl border-b border-glass-border">
                <div className="flex items-center justify-between px-6 py-3">
                    <h1 className="text-lg font-semibold text-white">{quiz.title}</h1>

                    <Timer
                        totalMinutes={quiz.duration}
                        remainingMinutes={remainingTime}
                        onTimeUp={handleSubmit}
                    />

                    <Button variant="danger" onClick={() => setSubmitModal(true)}>
                        Submit Test
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex">
                {/* Question Area */}
                <div className="flex-1 p-6">
                    <QuestionCard
                        question={{
                            ...currentQuestion,
                            testQuestionId: currentQuestion.id,
                            questionText: currentQuestion.text,
                            questionType: currentQuestion.type === 'MCQ' ? QUESTION_TYPES.MCQ_SINGLE : QUESTION_TYPES.NUMERIC, // Use constant
                            options: currentQuestion.options?.map(o => ({
                                id: o.id,
                                optionLabel: o.id,
                                optionText: o.text
                            }))
                        }}
                        selectedOptionId={currentAnswer.selectedOptionId}
                        selectedOptionIds={[]}
                        numericAnswer={currentAnswer.selectedAnswer}
                        onSelectOption={handleSelectOption}
                        onNumericChange={handleNumericChange}
                        isReviewed={currentAnswer.isReviewed}
                        questionNumber={currentQuestionIndex + 1}
                    />

                    <div className="flex items-center justify-between mt-6">
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={handleClearAnswer}>Clear</Button>
                            <Button variant={currentAnswer.isReviewed ? 'accent' : 'outline'} onClick={handleMarkReview}>
                                {currentAnswer.isReviewed ? 'Unmark Review' : 'Mark for Review'}
                            </Button>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="primary"
                                disabled={currentQuestionIndex === quiz.questions.length - 1}
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="w-72 p-6 border-l border-glass-border shrink-0">
                    <div className="grid grid-cols-4 gap-2">
                        {paletteQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all ${currentQuestionIndex === idx
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                    : q.isAnswered
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : q.isReviewed
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 space-y-2 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
                            <span>Marked for Review</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-slate-800" />
                            <span>Not Visited</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Submit Modal */}
            <Modal isOpen={submitModal} onClose={() => setSubmitModal(false)} title="Submit Test">
                <p>Are you sure you want to finish the test?</p>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={() => setSubmitModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleSubmit} isLoading={submitting}>Submit</Button>
                </div>
            </Modal>

            {/* Result Modal */}
            <Modal isOpen={resultModal} onClose={() => navigate('/examinee/tests')} title="Test Results">
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Test Completed!</h2>
                    <p className="text-gray-400 mb-6">You have successfully completed the test.</p>

                    <div className="p-4 bg-slate-800 rounded-xl mb-6">
                        <p className="text-sm text-gray-400">Your Score</p>
                        <p className="text-3xl font-bold text-white">{score} / {quiz.totalMarks}</p>
                    </div>

                    <Button variant="primary" onClick={() => navigate('/examinee/tests')} className="w-full">
                        Back to Dashboard
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default DummyTestAttempt;
