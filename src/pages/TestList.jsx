/**
 * Quiz List Page
 * Admin "My Tests" card view with stats + published store tab
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, PageHeader } from '../components/common';
import { listTests, deleteTest, finalizeTest } from '../api';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Eye,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Search,
} from 'lucide-react';
import { AllocateModal } from '../components/quiz';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const QuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 9, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, quiz: null });
  const [finalizeModal, setFinalizeModal] = useState({ open: false, quiz: null });
  const [allocateModal, setAllocateModal] = useState({ open: false, quiz: null });

  const [activeTab, setActiveTab] = useState('my_quizzes');
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination((prev) => ({ ...prev, page: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchQuizzes = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const params = {
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      };

      const trimmedSearch = debouncedSearchTerm.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }
      if (activeTab === 'my_quizzes') {
        params.withStats = 'true';
        params.sortOrder = 'DESC';
      } else {
        params.isFinal = true;
      }

      const response = await listTests(params);
      if (fetchId !== fetchIdRef.current) return;

      if (response.success) {
        const list = (response.data?.list || []).map((item) => ({
          ...item,
          isFinal: item.isFinal ?? item.status === 'published',
          totalQuestions: item.questions ?? item.totalQuestions,
        }));
        setQuizzes(list);
        setPagination((prev) => ({
          ...prev,
          total: response.data?.totalRecords || 0,
        }));
      }
    } catch (error) {
      if (fetchId === fetchIdRef.current) {
        console.error('Failed to fetch quizzes:', error);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.page, pagination.pageSize, activeTab, debouncedSearchTerm]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleDelete = async () => {
    if (!deleteModal.quiz) return;
    try {
      await deleteTest(deleteModal.quiz.id);
      setDeleteModal({ open: false, quiz: null });
      fetchQuizzes();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  const handleFinalize = async () => {
    if (!finalizeModal.quiz) return;
    try {
      await finalizeTest(finalizeModal.quiz.id);
      setFinalizeModal({ open: false, quiz: null });
      fetchQuizzes();
    } catch (error) {
      console.error('Failed to finalize quiz:', error);
    }
  };

  const AdminTestCard = ({ quiz }) => {
    const questionCount = quiz.questions ?? quiz.totalQuestions ?? 0;
    const duration = quiz.durationMin || 0;

    return (
      <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-slate-800/70 transition-all duration-300 overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-white leading-snug flex-1 min-w-0" title={quiz.name}>
            {quiz.name}
          </h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {quiz.isFinal ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Draft
              </span>
            )}
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {questionCount} questions · {duration} min
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">
            <p className="text-xs font-medium text-blue-400 mb-1">Students</p>
            <p className="text-2xl font-bold text-white">{quiz.students ?? 0}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-xs font-medium text-emerald-400 mb-1">Revenue</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(quiz.revenue)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-white/5">
          <span className="text-gray-400">
            Avg Score: <span className="font-medium text-gray-200">{quiz.avgScore ?? 0}%</span>
          </span>
          <span className="font-semibold text-blue-400">{formatCurrency(quiz.price)}</span>
        </div>

        <div className="flex gap-2">
          {!quiz.isFinal ? (
            <>
              <button
                onClick={() => navigate(`/tests/${quiz.id}/details`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => navigate(`/tests/${quiz.id}/edit`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setFinalizeModal({ open: true, quiz })}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all text-sm font-medium"
              >
                <Lock className="w-4 h-4" />
                Publish
              </button>
              <button
                onClick={() => setDeleteModal({ open: true, quiz })}
                className="flex items-center justify-center w-9 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(`/tests/${quiz.id}/details`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={() => setAllocateModal({ open: true, quiz })}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all text-sm font-medium"
              >
                <CreditCard className="w-4 h-4" />
                Allocate
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const StoreQuizCard = ({ quiz }) => (
    <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-slate-800/70 transition-all duration-300 overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          Live
        </span>
      </div>

      <div className="pr-20 min-w-0">
        <h3 className="text-lg font-semibold text-white truncate capitalize" title={quiz.name}>
          {quiz.name}
        </h3>
        {quiz.description ? (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2 break-words" title={quiz.description}>
            {quiz.description}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1 italic">No description</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/5">
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-blue-500/10">
            <HelpCircle className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white mt-2 truncate">{quiz.totalQuestions || 0}</p>
          <p className="text-xs text-gray-500 truncate">Questions</p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-violet-500/10">
            <Clock className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-lg font-bold text-white mt-2 truncate">{quiz.durationMin || 0}</p>
          <p className="text-xs text-gray-500 truncate">Minutes</p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-emerald-500/10">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-white mt-2 truncate">{quiz.totalMarks || 0}</p>
          <p className="text-xs text-gray-500 truncate">Marks</p>
        </div>
      </div>

      <div className="flex gap-2 mt-5 pt-5 border-t border-white/5">
        <button
          onClick={() => setAllocateModal({ open: true, quiz })}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-all text-sm font-bold shadow-lg shadow-violet-500/25"
        >
          <CreditCard className="w-4 h-4" />
          Bulk Buy
        </button>
      </div>
    </div>
  );

  const isMyTests = activeTab === 'my_quizzes';

  return (
    <div>
      <PageHeader
        icon={<BookOpen className="w-5 h-5" />}
        title={isMyTests ? 'My Tests' : 'Quizzes'}
        subtitle={
          isMyTests
            ? 'Manage and track your published tests'
            : 'Create and manage your quizzes'
        }
        actions={
          <Button variant="primary" onClick={() => navigate('/tests/new')}>
            <Plus className="w-4 h-4" />
            {isMyTests ? 'Create Test' : 'Create Quiz'}
          </Button>
        }
      />

      <div className="flex p-1 mb-6 bg-slate-800/50 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => {
            setActiveTab('my_quizzes');
            setPagination((prev) => ({ ...prev, page: 0 }));
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isMyTests
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          My Tests
        </button>
        <button
          onClick={() => {
            setActiveTab('published_store');
            setPagination((prev) => ({ ...prev, page: 0 }));
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !isMyTests
              ? 'bg-violet-500 text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Published Store
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tests by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
        />
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-5 animate-pulse bg-slate-800/50 border border-white/10"
              >
                <div className="h-5 rounded w-3/4 mb-3 bg-slate-700" />
                <div className="h-4 rounded w-1/2 mb-5 bg-slate-700" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-16 rounded-xl bg-slate-700" />
                  <div className="h-16 rounded-xl bg-slate-700" />
                </div>
                <div className="h-4 rounded w-full bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {!loading && quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) =>
              isMyTests ? (
                <AdminTestCard key={quiz.id} quiz={quiz} />
              ) : (
                <StoreQuizCard key={quiz.id} quiz={quiz} />
              )
            )}
          </div>
        )}

        {!loading && quizzes.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
              {debouncedSearchTerm ? (
                <Search className="w-10 h-10 text-gray-500" />
              ) : (
                <BookOpen className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No tests found</h3>
            <p className="text-gray-400 mb-6">
              {debouncedSearchTerm
                ? `No tests match "${debouncedSearchTerm}"`
                : isMyTests
                  ? 'Create your first test to get started'
                  : 'There are no published quizzes available in the store yet.'}
            </p>
            {isMyTests && !debouncedSearchTerm && (
              <Button variant="primary" onClick={() => navigate('/tests/new')}>
                <Plus className="w-4 h-4" />
                Create Test
              </Button>
            )}
          </div>
        )}

        {pagination.total > pagination.pageSize && (
          <div className="flex justify-center gap-4 pt-6">
            <button
              disabled={pagination.page === 0}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-gray-400">
              Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, quiz: null })}
        title="Delete Test"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, quiz: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete &quot;{deleteModal.quiz?.name}&quot;?</p>
        <p className="text-sm text-gray-400 mt-2">This action cannot be undone.</p>
      </Modal>

      <Modal
        isOpen={finalizeModal.open}
        onClose={() => setFinalizeModal({ open: false, quiz: null })}
        title="Publish Test"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFinalizeModal({ open: false, quiz: null })}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleFinalize}>
              Publish
            </Button>
          </>
        }
      >
        <p>Are you sure you want to publish &quot;{finalizeModal.quiz?.name}&quot;?</p>
        <p className="text-sm text-amber-400 mt-2">
          Once published, the test cannot be edited or deleted.
        </p>
      </Modal>

      {allocateModal.open && (
        <AllocateModal
          isOpen={allocateModal.open}
          onClose={() => setAllocateModal({ open: false, quiz: null })}
          entityType="TEST"
          entity={allocateModal.quiz}
          onSuccess={() => setAllocateModal({ open: false, quiz: null })}
        />
      )}
    </div>
  );
};

export default QuizList;
