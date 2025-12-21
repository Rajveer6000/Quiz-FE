/**
 * History Page
 * View past test attempt history
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Table, PageHeader } from '../components/common';
import { getAttemptHistory } from '../api';

const History = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await getAttemptHistory({
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (response.success) {
        setAttempts(response.data.list || []);
        setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [pagination.page]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'test',
      title: 'Test',
      render: (attempt) => (
        <div>
          <p className="text-white font-semibold">Test #{attempt.testId}</p>
          <p className="text-xs text-slate-400">Attempt {attempt.attemptNumber}</p>
        </div>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      render: (attempt) => formatDate(attempt.startedAt),
    },
    {
      key: 'score',
      title: 'Score',
      render: (attempt) => (
        attempt.isCompleted ? (
          <span className="text-white font-semibold">
            {attempt.percentageScore?.toFixed(1)}%
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
          <Badge variant="success" dot>Completed</Badge>
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
          <Link to={`/results/${attempt.attemptId}`}>
            <Button variant="ghost" size="sm">View Result</Button>
          </Link>
        ) : (
          <Link to={`/attempt/${attempt.attemptId}`}>
            <Button variant="primary" size="sm">Resume</Button>
          </Link>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="H"
        title="Test History"
        subtitle="View your past test attempts"
      />

      <div className="space-y-6">
        <Table
          columns={columns}
          data={attempts}
          rowKey="attemptId"
          isLoading={loading}
          emptyState={
            <Card className="text-center py-12 w-full">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">No test attempts yet</p>
                <p className="text-sm mt-1">Start your first test to see history</p>
                <Link to="/take-test">
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
      </div>
    </div>
  );
};

export default History;
