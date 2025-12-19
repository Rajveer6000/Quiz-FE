/**
 * Results Page
 * Display test attempt results
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Badge, Button, Loader } from '../components/common';
import { Header } from '../components/layout';
import { getResult } from '../api';

const Results = () => {
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const response = await getResult(attemptId);
      if (response.success) {
        setResult(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <p className="text-gray-400 mb-4">Result not found</p>
          <Link to="/history">
            <Button variant="primary">View History</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isPassed = result.isPassed || result.percentageScore >= 40;

  return (
    <div>
      <Header title="Test Results" />

      <div className="space-y-6 mt-6 max-w-4xl mx-auto">
        {/* Score Overview */}
        <Card className="text-center">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-4xl font-bold mb-4
            ${isPassed 
              ? 'bg-success-500/20 text-success-400 border-4 border-success-500/50' 
              : 'bg-danger-500/20 text-danger-400 border-4 border-danger-500/50'
            }`}>
            {result.percentageScore?.toFixed(1)}%
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {isPassed ? '🎉 Congratulations!' : 'Keep Trying!'}
          </h2>
          
          <Badge variant={isPassed ? 'success' : 'danger'} className="text-lg px-4 py-1">
            {result.resultStatus?.toUpperCase() || (isPassed ? 'PASSED' : 'FAILED')}
          </Badge>

          <p className="text-gray-400 mt-4">
            Submitted on {new Date(result.submittedAt).toLocaleString()}
          </p>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <p className="text-3xl font-bold text-white">{result.totalMarksObtained}</p>
            <p className="text-sm text-gray-400">Marks Obtained</p>
            <p className="text-xs text-gray-500">out of {result.totalMarksPossible}</p>
          </Card>

          <Card className="text-center">
            <p className="text-3xl font-bold text-success-400">{result.totalCorrect}</p>
            <p className="text-sm text-gray-400">Correct</p>
          </Card>

          <Card className="text-center">
            <p className="text-3xl font-bold text-danger-400">{result.totalIncorrect}</p>
            <p className="text-sm text-gray-400">Incorrect</p>
          </Card>

          <Card className="text-center">
            <p className="text-3xl font-bold text-gray-400">{result.totalSkipped}</p>
            <p className="text-sm text-gray-400">Skipped</p>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card>
          <Card.Header>
            <Card.Title>Performance Summary</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {/* Progress Bars */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Questions Attempted</span>
                  <span className="text-white">{result.totalAttempted} / {result.totalQuestions}</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(result.totalAttempted / result.totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Accuracy</span>
                  <span className="text-white">{result.accuracyPercentage?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success-500 rounded-full"
                    style={{ width: `${result.accuracyPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-glass-border">
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Taken:</span>
                  <span className="text-white">{result.actualTimeConsumedMin?.toFixed(1)} minutes</span>
                </div>
                {result.rank && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rank:</span>
                    <span className="text-white">#{result.rank}</span>
                  </div>
                )}
                {result.percentile && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Percentile:</span>
                    <span className="text-white">{result.percentile?.toFixed(1)}%</span>
                  </div>
                )}
                {result.totalNegativeMarks > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Negative Marks:</span>
                    <span className="text-danger-400">-{result.totalNegativeMarks}</span>
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link to="/take-test">
            <Button variant="primary">Take Another Test</Button>
          </Link>
          <Link to="/history">
            <Button variant="ghost">View All Results</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Results;
