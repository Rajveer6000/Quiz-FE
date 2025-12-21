/**
 * QuestionList Page
 * Question bank management with CRUD operations
 */

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Modal, Table, PageHeader } from '../components/common';
import { listQuestions, deleteQuestion } from '../api';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../constants/constants';

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ questionType: '', subjectName: '', difficulty: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, question: null });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await listQuestions({
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      });
      if (response.success) {
        setQuestions(response.data.list || []);
        setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [pagination.page, filters]);

  const handleDelete = async () => {
    if (!deleteModal.question) return;
    try {
      await deleteQuestion(deleteModal.question.id);
      setDeleteModal({ open: false, question: null });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const getDifficultyVariant = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  };

  const columns = [
    {
      key: 'question',
      title: 'Question',
      className: 'max-w-2xl',
      render: (question) => (
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold shrink-0">
            {question.id}
          </span>
          <div className="space-y-2 min-w-0">
            <p
              className="text-white font-medium line-clamp-2"
              dangerouslySetInnerHTML={{ __html: question.questionText }}
            />
            <div className="flex flex-wrap gap-2">
              {question.subjectName && (
                <Badge variant="accent">{question.subjectName}</Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'questionType',
      title: 'Type',
      render: (question) => (
        <Badge variant="primary">
          {QUESTION_TYPE_LABELS[question.questionType] || question.questionType}
        </Badge>
      ),
    },
    {
      key: 'difficulty',
      title: 'Difficulty',
      render: (question) => (
        question.difficulty ? (
          <Badge variant={getDifficultyVariant(question.difficulty)}>
            {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
          </Badge>
        ) : (
          <span className="text-gray-500">-</span>
        )
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (question) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/questions/${question.id}/edit`;
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-400 hover:text-danger-300"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ open: true, question });
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="Q"
        title="Question Bank"
        subtitle="Manage your questions"
        actions={
          <Button variant="primary" onClick={() => window.location.href = '/questions/new'}>
            + Add Question
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-4">
            <select
              className="input max-w-xs"
              value={filters.questionType}
              onChange={(e) => setFilters({ ...filters, questionType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="MCQ_SINGLE">Single Choice</option>
              <option value="MCQ_MULTI">Multiple Choice</option>
              <option value="NUM">Numeric</option>
            </select>

            <Input
              placeholder="Filter by subject..."
              value={filters.subjectName}
              onChange={(e) => setFilters({ ...filters, subjectName: e.target.value })}
              className="max-w-xs"
            />

            <select
              className="input max-w-xs"
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </Card>

        {/* Questions List */}
        <Table
          columns={columns}
          data={questions}
          rowKey="id"
          isLoading={loading}
          emptyState={
            <Card className="text-center py-12 w-full">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">No questions found</p>
                <p className="text-sm mt-1">Start by adding your first question</p>
                <Button variant="primary" className="mt-4" onClick={() => window.location.href = '/questions/new'}>
                  + Add Question
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, question: null })}
        title="Delete Question"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, question: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this question?</p>
        <p className="text-sm text-gray-400 mt-2">This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default QuestionList;
