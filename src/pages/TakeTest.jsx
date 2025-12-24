/**
 * TakeTest Page
 * Browse and start available tests
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Loader, PageHeader } from '../components/common';
import { useToast } from '../context';
import { getAvailableTests } from '../api/testsApi';
import { purchaseTest } from '../api/purchasesApi';
import {
  BookOpen,
  Clock,
  HelpCircle,
  Award,
  ShoppingCart,
  Play,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

const TakeTest = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, test: null, type: null }); // type: 'buy' | 'start'
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await getAvailableTests();
      if (response.success) {
        setTests(response.data || []);
      } else {
        showToast('Failed to load tests', 'error');
      }
    } catch (error) {
      showToast('Error loading tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (test) => {
    if (test.isPurchased) {
      setConfirmModal({ open: true, test, type: 'start' });
    } else {
      setConfirmModal({ open: true, test, type: 'buy' });
    }
  };

  const processAction = async () => {
    if (!confirmModal.test) return;
    setProcessing(true);

    try {
      if (confirmModal.type === 'buy') {
        const response = await purchaseTest(confirmModal.test.id);
        if (response.success) {
          showToast(response.message || `Successfully purchased ${confirmModal.test.name}!`, 'success');
          setConfirmModal({ open: false, test: null, type: null });
          await fetchTests(); // Refresh list to update status
        } else {
          showToast(response.message || 'Purchase failed', 'error');
        }
      } else {
        // Start test logic
        navigate(`/attempt/start/${confirmModal.test.id}`);
        setConfirmModal({ open: false, test: null, type: null });
      }
    } catch (error) {
      showToast('Action failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `₹${price.toFixed(2)}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'No limit';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div>
      <PageHeader
        icon={<BookOpen className="w-5 h-5" />}
        title="Available Quizzes"
        subtitle="Browse and purchase quizzes to upgrade your skills"
      />

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.length > 0 ? (
              tests.map((test) => (
                <Card key={test.id} hover className="flex flex-col h-full border-white/5 bg-slate-800/50">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="primary">
                        {typeof test.testType === 'string' ? test.testType : (test.testType?.name || 'Quiz')}
                      </Badge>
                      <span className={`text-lg font-bold ${test.isPurchased ? 'text-gray-400' : 'text-emerald-400'}`}>
                        {formatPrice(test.price)}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2 min-h-[3.5rem]" title={test.name}>{test.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">{test.description || 'No description available'}</p>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-blue-400" />
                          <span>{test.totalQuestions} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-violet-400" />
                          <span>{formatDuration(test.durationMin)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>{test.totalMarks} Marks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary-400 font-bold text-xs bg-primary-400/10 px-1.5 py-0.5 rounded">S</span>
                          <span>{test.totalSections || 1} Sec</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={test.isPurchased ? 'primary' : 'outline'}
                    className={`w-full mt-6 ${!test.isPurchased && 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'}`}
                    onClick={() => handleAction(test)}
                  >
                    {test.isPurchased ? (
                      <>
                        <Play className="w-4 h-4 mr-2" /> Start Attempt
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" /> Buy Now
                      </>
                    )}
                  </Button>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No quizzes available at the moment.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, test: null, type: null })}
        title={confirmModal.type === 'buy' ? 'Confirm Purchase' : 'Start Quiz'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmModal({ open: false, test: null, type: null })}>
              Cancel
            </Button>
            <Button
              variant={confirmModal.type === 'buy' ? 'success' : 'primary'}
              onClick={processAction}
              isLoading={processing}
            >
              {confirmModal.type === 'buy' ? `Pay ${formatPrice(confirmModal.test?.price)}` : 'Start Now'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-lg font-medium text-white">{confirmModal.test?.name}</p>

          {confirmModal.type === 'buy' ? (
            <p className="text-gray-400">
              Are you sure you want to purchase this quiz for <span className="text-white font-bold">{formatPrice(confirmModal.test?.price)}</span>?
              This will deduct the amount from your wallet.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-300">
                You are about to start the quiz. The timer of <span className="text-white font-bold">{formatDuration(confirmModal.test?.durationMin)}</span> will begin immediately.
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm flex gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>Do not refresh the page or close the window during the test.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TakeTest;
