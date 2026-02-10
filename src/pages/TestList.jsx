/**
 * Quiz List Page
 * Quiz management with card-based view - Tailwind only
 */

import { useState, useEffect } from 'react';
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
  Users,
  Calendar,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { AllocateModal } from '../components/quiz';

const QuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [deleteModal, setDeleteModal] = useState({ open: false, quiz: null });
  const [finalizeModal, setFinalizeModal] = useState({ open: false, quiz: null });
  const [allocateModal, setAllocateModal] = useState({ open: false, quiz: null });

  /* Tab State */
  const [activeTab, setActiveTab] = useState('my_quizzes'); // 'my_quizzes' | 'published_store'

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = {
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      };

      // Filter based on active tab
      if (activeTab === 'published_store') {
        params.isFinal = true;
      }

      const response = await listTests(params);
      if (response.success) {
        setQuizzes(response.data.list || []);
        setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [pagination.page, activeTab]);

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

  const QuizCard = ({ quiz }) => {
    const isPublishedStore = activeTab === 'published_store';

    return (
      <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-slate-800/70 transition-all duration-300 overflow-hidden">
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          {quiz.isFinal ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
              <AlertCircle className="w-3 h-3" />
              Draft
            </span>
          )}
        </div>

        {/* Quiz Info */}
        <div className="pr-20 min-w-0">
          <h3
            className="text-lg font-semibold text-white truncate capitalize"
            title={quiz.name}
          >
            {quiz.name}
          </h3>
          {quiz.description ? (
            <p
              className="text-sm text-gray-400 mt-1 line-clamp-2 break-words"
              title={quiz.description}
            >
              {quiz.description}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1 italic">No description</p>
          )}
        </div>

        {/* Stats Grid */}
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

        {/* Actions */}
        <div className="flex gap-2 mt-5 pt-5 border-t border-white/5">
          {isPublishedStore ? (
            /* Published Store Actions using simple button element to ensure no import issues */
            <button
              onClick={() => setAllocateModal({ open: true, quiz })}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-all text-sm font-bold shadow-lg shadow-violet-500/25"
            >
              <CreditCard className="w-4 h-4" />
              Bulk Buy
            </button>
          ) : (
            /* Normal Actions */
            !quiz.isFinal ? (
              <>
                <button
                  onClick={() => navigate(`/tests/${quiz.id}/details`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/tests/${quiz.id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setFinalizeModal({ open: true, quiz })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all text-sm font-medium"
                >
                  <Lock className="w-4 h-4" />
                  Publish
                </button>
                <button
                  onClick={() => setDeleteModal({ open: true, quiz })}
                  className="flex items-center justify-center w-10 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/tests/${quiz.id}/details`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => setAllocateModal({ open: true, quiz })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-all text-sm font-medium"
                >
                  <CreditCard className="w-4 h-4" />
                  Allocate
                </button>
              </>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        icon={<BookOpen className="w-5 h-5" />}
        title="Quizzes"
        subtitle="Create and manage your quizzes"
        actions={
          <Button variant="primary" onClick={() => navigate('/tests/new')}>
            <Plus className="w-4 h-4" />
            Create Quiz
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex p-1 mb-6 bg-slate-800/50 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => { setActiveTab('my_quizzes'); setPagination(prev => ({ ...prev, page: 0 })); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my_quizzes'
            ? 'bg-slate-700 text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          My Quizzes
        </button>
        <button
          onClick={() => { setActiveTab('published_store'); setPagination(prev => ({ ...prev, page: 0 })); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'published_store'
            ? 'bg-violet-500 text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <CreditCard className="w-4 h-4" />
          Published Store
        </button>
      </div>

      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-800/50 border border-white/10 rounded-2xl p-5 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-6" />
                <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/5">
                  <div className="h-20 bg-slate-700 rounded-xl" />
                  <div className="h-20 bg-slate-700 rounded-xl" />
                  <div className="h-20 bg-slate-700 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quiz Grid */}
        {!loading && quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && quizzes.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No quizzes found</h3>
            <p className="text-gray-400 mb-6">
              {activeTab === 'published_store'
                ? "There are no published quizzes available in the store yet."
                : "Create your first quiz to get started"}
            </p>
            {activeTab === 'my_quizzes' && (
              <Button variant="primary" onClick={() => navigate('/tests/new')}>
                <Plus className="w-4 h-4" />
                Create Quiz
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-center gap-4 pt-6">
            <button
              disabled={pagination.page === 0}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-gray-400">
              Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, quiz: null })}
        title="Delete Quiz"
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
        <p>Are you sure you want to delete "{deleteModal.quiz?.name}"?</p>
        <p className="text-sm text-gray-400 mt-2">This action cannot be undone.</p>
      </Modal>

      {/* Finalize Modal */}
      <Modal
        isOpen={finalizeModal.open}
        onClose={() => setFinalizeModal({ open: false, quiz: null })}
        title="Publish Quiz"
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
        <p>Are you sure you want to publish "{finalizeModal.quiz?.name}"?</p>
        <p className="text-sm text-amber-400 mt-2">
          ⚠️ Once published, the quiz cannot be edited or deleted.
        </p>
      </Modal>
      {
        allocateModal.open && (
          <AllocateModal
            isOpen={allocateModal.open}
            onClose={() => setAllocateModal({ open: false, quiz: null })}
            entityType="TEST"
            entity={allocateModal.quiz}
            onSuccess={() => setAllocateModal({ open: false, quiz: null })}
          />
        )
      }
    </div>
  );
};

export default QuizList;
