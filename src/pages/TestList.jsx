/**
 * TestList Page
 * Test/Quiz management with list view
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Table, PageHeader } from '../components/common';
import { listTests, deleteTest, finalizeTest } from '../api';
import { FileText, Plus, Pencil, Trash2, Lock, Eye } from 'lucide-react';

const TestList = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [deleteModal, setDeleteModal] = useState({ open: false, test: null });
  const [finalizeModal, setFinalizeModal] = useState({ open: false, test: null });

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await listTests({
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (response.success) {
        setTests(response.data.list || []);
        setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [pagination.page]);

  const handleDelete = async () => {
    if (!deleteModal.test) return;
    try {
      await deleteTest(deleteModal.test.id);
      setDeleteModal({ open: false, test: null });
      fetchTests();
    } catch (error) {
      console.error('Failed to delete test:', error);
    }
  };

  const handleFinalize = async () => {
    if (!finalizeModal.test) return;
    try {
      await finalizeTest(finalizeModal.test.id);
      setFinalizeModal({ open: false, test: null });
      fetchTests();
    } catch (error) {
      console.error('Failed to finalize test:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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
      key: 'name',
      title: 'Test',
      className: 'max-w-xl',
      render: (test) => (
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <p className="text-white font-semibold">{test.name}</p>
            <Badge variant={test.isFinal ? 'success' : 'warning'} dot>
              {test.isFinal ? 'Finalized' : 'Draft'}
            </Badge>
          </div>
          {test.description && (
            <p className="table-meta line-clamp-1">{test.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'questions',
      title: 'Questions',
      render: (test) => (
        <div className="space-y-1">
          <p className="text-white font-semibold">{test.totalQuestions || 0}</p>
          <p className="text-xs text-slate-400">{test.totalMarks || 0} marks</p>
        </div>
      ),
    },
    {
      key: 'duration',
      title: 'Duration',
      render: (test) => (
        <div className="space-y-1">
          <p className="text-white font-semibold">{test.durationMin || 0} mins</p>
          <p className="text-xs text-slate-400">{test.price > 0 ? `₹${test.price}` : 'Free'}</p>
        </div>
      ),
    },
    {
      key: 'window',
      title: 'Window',
      render: (test) => (
        <div className="space-y-1">
          <p className="text-white font-semibold">
            {test.startTime ? formatDate(test.startTime) : 'Not scheduled'}
          </p>
          <p className="text-xs text-slate-400">
            {test.endTime ? `Ends ${formatDate(test.endTime)}` : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (test) => (
        <div className="flex justify-end gap-2">
          {!test.isFinal ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/tests/${test.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => setFinalizeModal({ open: true, test })}
              >
                Finalize
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-400 hover:text-danger-300"
                onClick={() => setDeleteModal({ open: true, test })}
              >
                Delete
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/tests/${test.id}`)}
            >
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<FileText className="w-5 h-5" />}
        title="Tests"
        subtitle="Manage your tests and quizzes"
        actions={
          <Button variant="primary" onClick={() => navigate('/tests/new')}>
            <Plus className="w-4 h-4" />
            Create Test
          </Button>
        }
      />

      <div className="space-y-6">
        <Table
          columns={columns}
          data={tests}
          rowKey="id"
          isLoading={loading}
          emptyState={
            <Card className="text-center py-12 w-full">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-lg">No tests found</p>
                <p className="text-sm mt-1">Create your first test to get started</p>
                <Button variant="primary" className="mt-4" onClick={() => navigate('/tests/new')}>
                  + Create Test
                </Button>
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, test: null })}
        title="Delete Test"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, test: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete "{deleteModal.test?.name}"?</p>
        <p className="text-sm text-gray-400 mt-2">This action cannot be undone.</p>
      </Modal>

      {/* Finalize Modal */}
      <Modal
        isOpen={finalizeModal.open}
        onClose={() => setFinalizeModal({ open: false, test: null })}
        title="Finalize Test"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFinalizeModal({ open: false, test: null })}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleFinalize}>
              Finalize
            </Button>
          </>
        }
      >
        <p>Are you sure you want to finalize "{finalizeModal.test?.name}"?</p>
        <p className="text-sm text-warning-400 mt-2">
          ⚠️ Once finalized, the test cannot be edited or deleted.
        </p>
      </Modal>
    </div>
  );
};

export default TestList;
