/**
 * History Page
 * View past test attempt history with tabs for completed and paused tests
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Table, PageHeader, Loader } from '../components/common';
import { getAttemptHistory, getPausedTests } from '../api';
import { Clock, CheckCircle, Pause, Play, Eye, AlertCircle } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('completed');
  const [attempts, setAttempts] = useState([]);
  const [pausedTests, setPausedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [pausedPagination, setPausedPagination] = useState({ total: 0, hasMore: false });

  const fetchCompletedHistory = async () => {
    setLoading(true);
    try {
      const response = await getAttemptHistory({
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (response.success) {
        // Filter to only show completed tests (exclude paused/in-progress)
        const completedOnly = (response.data.list || []).filter(attempt => attempt.isCompleted === true);
        setAttempts(completedOnly);
        setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPausedTests = async () => {
    setLoading(true);
    try {
      const response = await getPausedTests({ limit: 50, offset: 0 });
      if (response.success) {
        setPausedTests(response.data.pausedTests || []);
        setPausedPagination(response.data.pagination || { total: 0, hasMore: false });
      }
    } catch (error) {
      console.error('Failed to fetch paused tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'completed') {
      fetchCompletedHistory();
    } else {
      fetchPausedTests();
    }
  }, [activeTab, pagination.page]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatScore = (value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    const safeValue = Number.isFinite(parsed) ? parsed : 0;
    return safeValue.toFixed(1);
  };

  const formatTimeRemaining = (minutes) => {
    if (!minutes || minutes <= 0) return 'Expired';
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const completedColumns = [
    {
      key: 'test',
      title: 'Test',
      render: (attempt) => (
        <div>
          <Link
            to={attempt.isCompleted ? `/examinee/results/${attempt.attemptId}` : '#'}
            className={`font-semibold ${attempt.isCompleted ? 'text-primary-400 hover:text-primary-300' : 'text-white'}`}
          >
            {attempt.testName || `Test #${attempt.testId}`}
          </Link>
          <p className="text-xs text-slate-400">Attempt {attempt.attemptNumber}</p>
        </div>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      render: (attempt) => (
        <span className="text-gray-300 text-sm">{formatDate(attempt.startedAt)}</span>
      ),
    },
    {
      key: 'score',
      title: 'Score',
      render: (attempt) => (
        attempt.isCompleted ? (
          <span className={`font-semibold ${parseFloat(attempt.percentageScore) >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatScore(attempt.percentageScore)}%
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (attempt) => (
        attempt.isCompleted ? (
          <Badge variant="success" dot>
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        ) : attempt.status === 'in_progress' ? (
          <Badge variant="warning" dot>In Progress</Badge>
        ) : (
          <Badge variant="danger" dot>{attempt.status}</Badge>
        )
      ),
    },
    {
      key: 'actions',
      title: 'Action',
      align: 'right',
      render: (attempt) => (
        attempt.isCompleted ? (
          <Link to={`/examinee/results/${attempt.attemptId}`}>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View Result
            </Button>
          </Link>
        ) : (
          <Link to={`/attempt/${attempt.attemptId}`}>
            <Button variant="primary" size="sm">
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          </Link>
        )
      ),
    },
  ];

  const pausedColumns = [
    {
      key: 'test',
      title: 'Test',
      render: (test) => (
        <div>
          <p className="text-white font-semibold">{test.testName || `Test #${test.testId}`}</p>
          <p className="text-xs text-slate-400">Attempt {test.attemptNumber}</p>
        </div>
      ),
    },
    // {
    //   key: 'progress',
    //   title: 'Progress',
    //   render: (test) => (
    //     <div className="text-sm">
    //       <p className="text-gray-300">
    //         {test.questionsAttempted} / {Math.round(test.totalMarks / 4)} questions
    //       </p>
    //       <p className="text-xs text-gray-500">
    //         {test.percentageScore?.toFixed(0) || 0}% score so far
    //       </p>
    //     </div>
    //   ),
    // },
    {
      key: 'timeRemaining',
      title: 'Time Left',
      render: (test) => (
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${test.remainingTimeMin > 10 ? 'text-emerald-400' : 'text-yellow-400'}`} />
          <span className={`font-medium ${test.remainingTimeMin > 10 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {formatTimeRemaining(test.remainingTimeMin)}
          </span>
        </div>
      ),
    },
    {
      key: 'pausedAt',
      title: 'Paused At',
      render: (test) => (
        <span className="text-gray-300 text-sm">{formatDate(test.pausedAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Action',
      align: 'right',
      render: (test) => (
        test.remainingTimeMin > 0 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/attempt/${test.attemptId}`)}
          >
            <Play className="w-4 h-4 mr-1" />
            Resume
          </Button>
        ) : (
          <Badge variant="danger">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<Clock className="w-5 h-5" />}
        title="Test History"
        subtitle="View your past test attempts"
      />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'completed'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <CheckCircle className="w-4 h-4" />
            Completed
            {pagination.total > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-white/10 rounded-full">
                {pagination.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('paused')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'paused'
              ? 'bg-yellow-500 text-white'
              : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Pause className="w-4 h-4" />
            Paused
            {pausedPagination.total > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-white/10 rounded-full">
                {pausedPagination.total}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'completed' ? (
          <>
            <Table
              columns={completedColumns}
              data={attempts}
              rowKey="attemptId"
              isLoading={loading}
              emptyState={
                <Card className="text-center py-12 w-full">
                  <div className="text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No completed tests yet</p>
                    <p className="text-sm mt-1">Complete a test to see it here</p>
                    <Link to="/examinee/tests">
                      <Button variant="primary" className="mt-4">Take a Test</Button>
                    </Link>
                  </div>
                </Card>
              }
            />

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  disabled={pagination.page === 0}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-gray-400">
                  Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <Button
                  variant="ghost"
                  disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Table
            columns={pausedColumns}
            data={pausedTests}
            rowKey="attemptId"
            isLoading={loading}
            emptyState={
              <Card className="text-center py-12 w-full">
                <div className="text-gray-500">
                  <Pause className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No paused tests</p>
                  <p className="text-sm mt-1">All your tests are completed!</p>
                  <Link to="/examinee/tests">
                    <Button variant="primary" className="mt-4">Take a New Test</Button>
                  </Link>
                </div>
              </Card>
            }
          />
        )}
      </div>
    </div>
  );
};

export default History;
