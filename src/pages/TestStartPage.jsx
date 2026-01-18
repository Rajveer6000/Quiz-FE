/**
 * TestStartPage
 * Pre-test confirmation page with STRICT fullscreen enforcement
 * Fetches test details from API and starts test attempt
 * Handles existing attempts and stores data in localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Loader, Modal } from '../components/common';
import { useToast } from '../context';
import { getTestDetails, startAttempt } from '../api/testAttemptApi';
import { STORAGE_KEYS } from '../constants/constants';
import {
    Maximize,
    Monitor,
    Clock,
    HelpCircle,
    Award,
    AlertTriangle,
    CheckCircle,
    Shield,
    Play,
    ArrowLeft,
    BookOpen,
    Eye,
    Lock,
    Zap,
    XCircle,
    RefreshCw,
    Layers,
    RotateCcw
} from 'lucide-react';

// Helper functions for localStorage
const saveAttemptToStorage = (attemptData) => {
    try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_ATTEMPT, JSON.stringify({
            ...attemptData,
            savedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Failed to save attempt to storage:', error);
    }
};

const getAttemptFromStorage = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ATTEMPT);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to get attempt from storage:', error);
        return null;
    }
};

const clearAttemptFromStorage = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ATTEMPT);
    } catch (error) {
        console.error('Failed to clear attempt from storage:', error);
    }
};

const TestStartPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenSupported, setFullscreenSupported] = useState(true);
    const [agreed, setAgreed] = useState(false);
    const [starting, setStarting] = useState(false);
    const [fullscreenWarning, setFullscreenWarning] = useState(false);
    const [exitAttempts, setExitAttempts] = useState(0);
    const [testData, setTestData] = useState(null);
    const [existingAttempt, setExistingAttempt] = useState(null);

    // Check if currently in fullscreen
    const checkFullscreen = useCallback(() => {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }, []);

    // Fetch test details from API
    const fetchTestDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Check for existing attempt in localStorage first
            const storedAttempt = getAttemptFromStorage();
            if (storedAttempt && String(storedAttempt.testId) === String(testId) && storedAttempt.status === 'in_progress') {
                setExistingAttempt(storedAttempt);
            }

            const response = await getTestDetails(testId);

            if (response.success) {
                const data = response.data;

                // Check if user can attempt
                if (!data.canAttempt) {
                    if (!data.isPurchased && data.requiresPurchase) {
                        setError('You need to purchase this test before attempting.');
                    } else if (data.timeStatus === 'not_started') {
                        setError('This test has not started yet.');
                    } else if (data.timeStatus === 'ended') {
                        setError('This test has ended.');
                    } else {
                        setError('You cannot attempt this test at this time.');
                    }
                    setLoading(false);
                    return;
                }

                // Build instructions based on test data
                const instructions = [
                    'Read each question carefully before answering',
                    'All questions are mandatory',
                ];

                if (data.sections && data.sections.length > 0) {
                    const firstSection = data.sections[0];
                    if (firstSection.marksPerQuestion) {
                        instructions.push(`Each correct answer carries ${firstSection.marksPerQuestion} marks`);
                    }
                }

                instructions.push('You can mark questions for review and revisit them later');
                instructions.push('The test will auto-submit when time expires');

                setTestData({
                    ...data,
                    instructions,
                    negativeMarking: false
                });
            } else {
                setError(response.message || 'Failed to load test details');
            }
        } catch (err) {
            console.error('Error fetching test details:', err);
            setError('Failed to load test details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [testId]);

    useEffect(() => {
        const supported = !!(
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled
        );
        setFullscreenSupported(supported);

        const handleFullscreenChange = () => {
            const nowFullscreen = checkFullscreen();
            const wasFullscreen = isFullscreen;

            setIsFullscreen(nowFullscreen);

            if (wasFullscreen && !nowFullscreen && supported) {
                setExitAttempts(prev => prev + 1);
                setFullscreenWarning(true);
                showToast('⚠️ Fullscreen is required to start the test!', 'warning');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        setIsFullscreen(checkFullscreen());
        fetchTestDetails();

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [testId, checkFullscreen, fetchTestDetails, showToast]);

    const requestFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                await elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
            setFullscreenWarning(false);
        } catch (error) {
            console.error('Fullscreen request failed:', error);
            showToast('Could not enter fullscreen mode. Please try again.', 'error');
        }
    }, [showToast]);

    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
        } catch (error) {
            console.error('Exit fullscreen failed:', error);
        }
    }, []);

    const handleStartTest = async () => {
        if (!agreed) {
            showToast('Please accept the terms to continue', 'warning');
            return;
        }

        if (fullscreenSupported && !isFullscreen) {
            showToast('⚠️ You must enter fullscreen mode before starting the test!', 'error');
            setFullscreenWarning(true);
            return;
        }

        setStarting(true);

        try {
            const response = await startAttempt(testData.id);

            if (response.success) {
                const attemptData = response.data;

                // Save attempt data to localStorage
                saveAttemptToStorage({
                    attemptId: attemptData.attemptId,
                    testId: attemptData.testId,
                    testName: testData.name,
                    attemptNumber: attemptData.attemptNumber,
                    startedAt: attemptData.startedAt,
                    totalDurationMin: attemptData.totalDurationMin,
                    remainingTimeMin: attemptData.remainingTimeMin,
                    totalSections: attemptData.totalSections,
                    totalQuestions: attemptData.totalQuestions,
                    status: attemptData.status
                });

                showToast('Test started successfully!', 'success');
                navigate(`/attempt/${attemptData.attemptId}`);
            } else {
                // Check if it's an existing attempt (422 with isExisting)
                // The response data will contain the existing attempt info even on 422
                showToast(response.message || 'Failed to start test', 'error');
                setStarting(false);
            }
        } catch (error) {
            console.error('Error starting test:', error);

            // Handle the case where API returns existing attempt data
            if (error?.data?.isExisting && error?.data?.attemptId) {
                const attemptData = error.data;
                setExistingAttempt(attemptData);

                // Save to localStorage
                saveAttemptToStorage({
                    attemptId: attemptData.attemptId,
                    testId: attemptData.testId,
                    testName: testData?.name,
                    attemptNumber: attemptData.attemptNumber,
                    startedAt: attemptData.startedAt,
                    totalDurationMin: attemptData.totalDurationMin,
                    remainingTimeMin: attemptData.remainingTimeMin,
                    totalSections: attemptData.totalSections,
                    totalQuestions: attemptData.totalQuestions,
                    status: attemptData.status,
                    isExisting: true
                });

                showToast('You have an existing attempt in progress', 'info');
            } else {
                showToast('Failed to start test. Please try again.', 'error');
            }
            setStarting(false);
        }
    };

    const handleResumeAttempt = async () => {
        if (fullscreenSupported && !isFullscreen) {
            await requestFullscreen();
        }

        const attemptId = existingAttempt?.attemptId;
        if (attemptId) {
            navigate(`/attempt/${attemptId}`);
        }
    };

    const handleGoBack = () => {
        if (isFullscreen) {
            exitFullscreen();
        }
        navigate(-1);
    };

    const handleReenterFullscreen = async () => {
        await requestFullscreen();
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'No limit';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} minutes` : ''}`;
        return `${mins} minutes`;
    };

    const canStart = agreed && (isFullscreen || !fullscreenSupported);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader size="lg" />
                    <p className="text-gray-400 mt-4">Loading test details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Cannot Start Test</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Button variant="primary" onClick={handleGoBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={handleGoBack}
                        className="p-2 rounded-lg bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-slate-700/50 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">{testData?.name}</h1>
                        {testData?.description && (
                            <p className="text-gray-400 text-sm mt-1">{testData.description}</p>
                        )}
                    </div>
                </div>

                {/* Existing Attempt Warning */}
                {existingAttempt && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <RotateCcw className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-amber-400">Active Attempt Found</h3>
                                    <p className="text-amber-300/80 text-sm">
                                        You have an in-progress attempt. Remaining time: {existingAttempt.remainingTimeMin} minutes
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                className="bg-amber-500 hover:bg-amber-600"
                                onClick={handleResumeAttempt}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Resume Attempt
                            </Button>
                        </div>
                    </div>
                )}

                {/* Fullscreen Warning Banner */}
                {fullscreenSupported && !isFullscreen && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400">Fullscreen Required</h3>
                                <p className="text-red-300/80 text-sm">You must enter fullscreen mode to start the test</p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            className="bg-red-500 hover:bg-red-600"
                            onClick={requestFullscreen}
                        >
                            <Maximize className="w-4 h-4 mr-2" />
                            Enter Fullscreen
                        </Button>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Test Info & Instructions */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Test Stats */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary-400" />
                                Test Overview
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                    <HelpCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-white">{testData?.totalQuestions || 0}</div>
                                    <div className="text-xs text-gray-400">Questions</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                    <Clock className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-white">{testData?.durationMin || 0}</div>
                                    <div className="text-xs text-gray-400">Minutes</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                    <Award className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-white">{testData?.totalMarks || 0}</div>
                                    <div className="text-xs text-gray-400">Total Marks</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                    <Layers className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-white">{testData?.sections?.length || 0}</div>
                                    <div className="text-xs text-gray-400">Sections</div>
                                </div>
                            </div>
                        </div>

                        {/* Sections */}
                        {testData?.sections && testData.sections.length > 0 && (
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-violet-400" />
                                    Sections
                                </h2>
                                <div className="space-y-3">
                                    {testData.sections.map((section, index) => (
                                        <div key={section.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{section.name}</p>
                                                    {section.subject && (
                                                        <p className="text-gray-400 text-xs">{section.subject}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-300 text-sm">{section.questionCount} Qs</p>
                                                <p className="text-gray-500 text-xs">+{section.marksPerQuestion} marks each</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-amber-400" />
                                Instructions
                            </h2>
                            <ul className="space-y-3">
                                {testData?.instructions?.map((instruction, index) => (
                                    <li key={index} className="flex items-start gap-3 text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>{instruction}</span>
                                    </li>
                                ))}
                            </ul>

                            {testData?.negativeMarking && (
                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                    <p className="text-amber-300 text-sm">
                                        <strong>Note:</strong> This test has negative marking.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Important Rules */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-400" />
                                Important Rules
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 text-gray-300">
                                    <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span>Do not switch tabs or windows during the test</span>
                                </div>
                                <div className="flex items-start gap-3 text-gray-300">
                                    <Monitor className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Test must be taken in fullscreen mode</strong></span>
                                </div>
                                <div className="flex items-start gap-3 text-gray-300">
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span>Exiting fullscreen may terminate your test</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Start Panel */}
                    <div className="space-y-6">
                        {/* Purchase Info */}
                        {testData?.isPurchased && testData?.purchaseDetails && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Purchased on {new Date(testData.purchaseDetails.purchaseDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Fullscreen Status */}
                        <div className={`rounded-2xl border p-6 transition-all ${isFullscreen
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-red-500/10 border-red-500/30 animate-pulse'
                            }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-xl ${isFullscreen ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    {isFullscreen ? (
                                        <Maximize className="w-6 h-6 text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Fullscreen Mode</h3>
                                    <p className={`text-sm ${isFullscreen ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isFullscreen ? '✓ Active' : '✗ Required to start'}
                                    </p>
                                </div>
                            </div>

                            {!isFullscreen && fullscreenSupported && (
                                <Button
                                    variant="primary"
                                    className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                                    onClick={requestFullscreen}
                                >
                                    <Maximize className="w-4 h-4 mr-2" />
                                    Enter Fullscreen Now
                                </Button>
                            )}

                            {isFullscreen && (
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Ready to start!</span>
                                </div>
                            )}

                            {!fullscreenSupported && (
                                <p className="text-amber-400 text-sm">
                                    Your browser doesn't support fullscreen. You can still take the test.
                                </p>
                            )}

                            {exitAttempts > 0 && (
                                <p className="text-amber-400 text-xs mt-3">
                                    ⚠️ Exit attempts: {exitAttempts}
                                </p>
                            )}
                        </div>

                        {/* Agreement & Start */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                            <h3 className="font-semibold text-white mb-4">Ready to Begin?</h3>

                            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                                <div className="relative mt-1">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${agreed
                                            ? 'bg-primary-500 border-primary-500'
                                            : 'border-gray-500 group-hover:border-primary-400'
                                        }`}>
                                        {agreed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                                <span className="text-gray-300 text-sm leading-relaxed">
                                    I have read and understood all the instructions and agree to follow the rules.
                                </span>
                            </label>

                            {/* Start/Resume Button */}
                            {existingAttempt ? (
                                <Button
                                    variant="primary"
                                    className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
                                    onClick={handleResumeAttempt}
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Resume Existing Attempt
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    className={`w-full py-4 text-lg font-semibold transition-all ${canStart
                                            ? 'bg-gradient-to-r from-primary-500 to-violet-600 hover:from-primary-600 hover:to-violet-700 shadow-lg shadow-primary-500/25'
                                            : 'opacity-50 cursor-not-allowed bg-gray-600'
                                        }`}
                                    onClick={handleStartTest}
                                    disabled={!canStart || starting}
                                    isLoading={starting}
                                >
                                    {starting ? (
                                        'Starting Test...'
                                    ) : !isFullscreen && fullscreenSupported ? (
                                        <>
                                            <Lock className="w-5 h-5 mr-2" />
                                            Enter Fullscreen First
                                        </>
                                    ) : !agreed ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Accept Terms First
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Start Test
                                        </>
                                    )}
                                </Button>
                            )}

                            <div className="mt-4 text-center">
                                {existingAttempt ? (
                                    <p className="text-amber-400 text-xs">
                                        ⏱️ Remaining: {existingAttempt.remainingTimeMin} minutes
                                    </p>
                                ) : !isFullscreen && fullscreenSupported ? (
                                    <p className="text-red-400 text-xs">
                                        🔒 You must enter fullscreen to start
                                    </p>
                                ) : !agreed ? (
                                    <p className="text-amber-400 text-xs">
                                        ☝️ Please accept the terms above
                                    </p>
                                ) : (
                                    <p className="text-gray-500 text-xs">
                                        Duration: {formatDuration(testData?.durationMin)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Exit Warning Modal */}
            <Modal
                isOpen={fullscreenWarning && !isFullscreen}
                onClose={() => { }}
                title=""
            >
                <div className="text-center py-4">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Fullscreen Required!</h2>
                    <p className="text-gray-400 mb-6">
                        You have exited fullscreen mode. You cannot start the test without fullscreen.
                    </p>

                    {exitAttempts > 1 && (
                        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-amber-400 text-sm">
                                ⚠️ You have exited fullscreen {exitAttempts} times.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={handleGoBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 bg-gradient-to-r from-primary-500 to-violet-600"
                            onClick={handleReenterFullscreen}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-enter Fullscreen
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TestStartPage;
