/**
 * Results Page
 * Display test attempt results with premium aesthetics
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Badge, Button, Loader } from '../components/common';
import { getResult } from '../api';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart2,
  History,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';

const Results = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await getResult(attemptId);
        if (response.success) {
          setResult(response.data);
        } else {
          setError(response.message || 'Failed to fetch result');
        }
      } catch (error) {
        console.error('Failed to fetch result:', error);
        setError('An error occurred while loading your results.');
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-gray-400 mt-4 animate-pulse">Analyzing your performance...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-white/5 bg-slate-800/50 backdrop-blur-sm">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{error || 'We couldn\'t find your result.'}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={() => navigate(-1)}>Go Back</Button>
            <Link to="/history">
              <Button variant="ghost">View History</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const toNumber = (value, fallback = 0) => {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toPercent = (value, fallback = 0) => {
    const numeric = toNumber(value, fallback);
    return Math.max(0, Math.min(100, numeric));
  };

  // Parse values safely since API returns strings for numbers
  const score = toPercent(result.percentageScore);
  const accuracy = toPercent(result.accuracyPercentage);
  const marksObtained = toNumber(result.totalMarksObtained);
  const marksPossible = toNumber(result.totalMarksPossible);
  const negativeMarks = toNumber(result.totalNegativeMarks);
  const timeTaken = toNumber(result.actualTimeConsumedMin);
  const percentileValue = toNumber(result.percentile, null);
  const totalQuestions = toNumber(result.totalQuestions);
  const totalCorrect = toNumber(result.totalCorrect);
  const totalIncorrect = toNumber(result.totalIncorrect);
  const totalSkipped = toNumber(result.totalSkipped);
  const percentOfTotal = (value) => {
    if (totalQuestions <= 0) return 0;
    const ratio = value / totalQuestions;
    return Number.isFinite(ratio) ? Math.max(0, ratio * 100) : 0;
  };

  // Use pass status from API or calculate from threshold (e.g., 40%)
  const isPassed = result.isPassed === true || (result.isPassed === null && score >= 40);

  // Safe score for visualization (clamped to 0-100)
  const visualScore = Math.max(0, Math.min(100, score));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-12">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] opacity-20 ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-primary-500 rounded-full blur-[120px] opacity-10" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pt-8">
        {/* Header/Hero Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-white/5 text-xs font-medium text-gray-400 mb-6">
            <Award className="w-3 h-3" />
            Performance Review
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Test Results
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Review your performance for <span className="text-primary-400 font-medium">Test ID #{result.testId}</span>.
            Submitted on {new Date(result.submittedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Score Card */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="overflow-hidden border-white/5 bg-slate-800/40 backdrop-blur-md p-8">
              <div className="flex flex-col md:flex-row items-center gap-10">
                {/* Score Circle */}
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center relative bg-slate-900/50 ${isPassed ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                    <span className={`text-4xl font-bold tracking-tight ${score < 0 ? 'text-red-400' : 'text-white'}`}>{score.toFixed(1)}%</span>
                    <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Score</span>

                    {/* SVG Progress Circle placeholder or decoration */}
                    <svg className="absolute -inset-2 w-44 h-44 -rotate-90 pointer-events-none">
                      <circle
                        cx="88"
                        cy="88"
                        r="84"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={2 * Math.PI * 84}
                        strokeDashoffset={2 * Math.PI * 84 * (1 - visualScore / 100)}
                        className={`transition-all duration-1000 ease-out ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 justify-center md:justify-start">
                    <h2 className="text-3xl font-bold text-white">
                      {isPassed ? 'Passed Successfully' : 'Requires Improvement'}
                    </h2>
                    <Badge variant={isPassed ? 'success' : 'danger'} className="text-sm px-3 py-1 w-fit mx-auto md:mx-0">
                      {isPassed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {isPassed
                      ? "Great job! You've successfully passed this test. Your performance shows a good understanding of the topics covered."
                      : "You didn't reach the passing threshold this time. Focus on the incorrect answers and try again to improve your score."
                    }
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      <BarChart2 className="w-4 h-4 text-primary-400" />
                      Rank: <span className="font-bold text-white">#{result.rank || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Accuracy: <span className="font-bold text-white">{accuracy.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-800/60 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5 text-primary-400" />
                </div>
                <div className="text-2xl font-bold text-white">{marksObtained.toFixed(1)}</div>
                <div className="text-xs text-gray-400 font-medium">Marks Obtained</div>
                <div className="text-[10px] text-gray-500 mt-1">out of {marksPossible.toFixed(1)}</div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 hover:bg-emerald-500/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">{totalCorrect}</div>
                <div className="text-xs text-gray-400 font-medium">Correct Answers</div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 hover:bg-red-500/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-400">{totalIncorrect}</div>
                <div className="text-xs text-gray-400 font-medium">Incorrect Answers</div>
              </div>

              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-800/60 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">{timeTaken.toFixed(1)}m</div>
                <div className="text-xs text-gray-400 font-medium">Time Taken</div>
              </div>
            </div>

            {/* Question Breakdown */}
            <Card className="border-white/5 bg-slate-800/40 backdrop-blur-md">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-white">Attempt Breakdown</h3>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Total Questions: {result.totalQuestions}</span>
              </div>
              <div className="p-6">
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-700/50 mb-8">
                  <div
                    title={`Correct: ${totalCorrect}`}
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${percentOfTotal(totalCorrect)}%` }}
                  />
                  <div
                    title={`Incorrect: ${totalIncorrect}`}
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${percentOfTotal(totalIncorrect)}%` }}
                  />
                  <div
                    title={`Skipped: ${totalSkipped}`}
                    className="h-full bg-slate-500 transition-all"
                    style={{ width: `${percentOfTotal(totalSkipped)}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{totalCorrect}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Correct</div>
                    </div>
                    <div className="text-xs text-gray-400">{percentOfTotal(totalCorrect).toFixed(0)}%</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{totalIncorrect}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Incorrect</div>
                    </div>
                    <div className="text-xs text-gray-400">{percentOfTotal(totalIncorrect).toFixed(0)}%</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{totalSkipped}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Skipped</div>
                    </div>
                    <div className="text-xs text-gray-400">{percentOfTotal(totalSkipped).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Actions */}
            <div className="space-y-4">
              <Button
                variant="primary"
                className="w-full justify-between h-14 group"
                onClick={() => navigate('/take-test')}
              >
                <span>Take Another Test</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link to="/history" className="block">
                <Button variant="ghost" className="w-full justify-center h-12">
                  <History className="w-4 h-4 mr-2" />
                  View All History
                </Button>
              </Link>
            </div>

            {/* Performance Insights */}
            <Card className="border-white/5 bg-slate-800/40 backdrop-blur-md">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-400" />
                  Insights
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Percentile
                  </span>
                  <span className="font-bold text-white">{Number.isFinite(percentileValue) ? `${percentileValue.toFixed(1)}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary-400" />
                    Attempted
                  </span>
                  <span className="font-bold text-white">{result.totalAttempted} / {Number.isFinite(totalQuestions) ? totalQuestions : 'N/A'}</span>
                </div>
                {negativeMarks > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Neg. Marks
                    </span>
                    <span className="font-bold text-red-400">-{negativeMarks.toFixed(1)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5">
                  <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">Goal Accuracy</div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${accuracy >= 80 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                    <span>Target: 80%</span>
                    <span>Current: {accuracy.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-primary-600/20 to-primary-900/40 border border-primary-500/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-primary-400" />
                Ready for a re-take?
              </h4>
              <p className="text-xs text-primary-200/60 leading-relaxed mb-4">
                Practice makes perfect. You can re-take this test after some review to boost your confidence.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10"
                onClick={() => navigate(`/take-test`)}
              >
                Start Practice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
