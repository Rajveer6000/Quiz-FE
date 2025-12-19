/**
 * TestList Page
 * Test/Quiz management with list view
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Loader } from '../components/common';
import { Header } from '../components/layout';
import { listTests, deleteTest, finalizeTest } from '../api';

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

  return (
    <div>
      <Header
        title="Tests"
        actions={
          <Button variant="primary" onClick={() => navigate('/tests/new')}>
            + Create Test
          </Button>
        }
      />

      <div className="space-y-6 mt-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : tests.length === 0 ? (
          <Card className="text-center py-12">
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
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <Card key={test.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                      {test.isFinal ? (
                        <Badge variant="success" dot>Finalized</Badge>
                      ) : (
                        <Badge variant="warning" dot>Draft</Badge>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-gray-400 mt-1 line-clamp-2">{test.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {test.totalQuestions || 0} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {test.durationMin || 0} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {test.totalMarks || 0} Marks
                      </span>
                      {test.price > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ₹{test.price}
                        </span>
                      )}
                    </div>
                    {test.startTime && (
                      <p className="text-xs text-gray-500 mt-2">
                        Window: {formatDate(test.startTime)} - {formatDate(test.endTime)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!test.isFinal && (
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
                    )}
                    {test.isFinal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tests/${test.id}`)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

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
