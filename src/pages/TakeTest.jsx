/**
 * TakeTest Page
 * Browse and start available tests (Modified for Dummy Data Demo)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Loader, PageHeader } from '../components/common';
import { dummyQuizzes } from '../data/dummyQuizzes';
import { useToast } from '../context';
import {
  BookOpen,
  Clock,
  HelpCircle,
  Award,
  ShoppingCart,
  Play,
  AlertTriangle
} from 'lucide-react';

const TakeTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, test: null, type: null }); // type: 'buy' | 'start'
  const [processing, setProcessing] = useState(false);

  // Local state to track purchases for this session
  const [purchasedTestIds, setPurchasedTestIds] = useState([]);

  useEffect(() => {
    // Simulate fetching tests
    setTimeout(() => {
      setTests(dummyQuizzes);
      // Auto-purchase the free one
      const freeTestIds = dummyQuizzes.filter(t => t.price === 0).map(t => t.id);
      setPurchasedTestIds(freeTestIds);
      setLoading(false);
    }, 800);
  }, []);

  const handleAction = (test) => {
    const isPurchased = purchasedTestIds.includes(test.id);
    if (isPurchased) {
      setConfirmModal({ open: true, test, type: 'start' });
    } else {
      setConfirmModal({ open: true, test, type: 'buy' });
    }
  };

  const processAction = async () => {
    if (!confirmModal.test) return;
    setProcessing(true);

    // Simulate API delay
    setTimeout(() => {
      if (confirmModal.type === 'buy') {
        setPurchasedTestIds(prev => [...prev, confirmModal.test.id]);
        toast.success(`Successfully purchased ${confirmModal.test.title}!`);
        setConfirmModal({ open: false, test: null, type: null });
      } else {
        // Start test logic
        navigate(`/attempt/dummy/${confirmModal.test.id}`);
        setConfirmModal({ open: false, test: null, type: null });
      }
      setProcessing(false);
    }, 1000);
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
            {tests.map((test) => {
              const isPurchased = purchasedTestIds.includes(test.id);
              return (
                <Card key={test.id} hover className="flex flex-col h-full border-white/5 bg-slate-800/50">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant={isPurchased ? 'success' : 'accent'} dot>
                        {isPurchased ? 'Purchased' : 'Available'}
                      </Badge>
                      <span className={`text-lg font-bold ${isPurchased ? 'text-gray-400' : 'text-emerald-400'}`}>
                        {test.price === 0 ? 'Free' : `₹${test.price}`}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">{test.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">{test.description}</p>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-blue-400" />
                          <span>{test.totalQuestions} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-violet-400" />
                          <span>{test.duration} mins</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>{test.totalMarks} Marks</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={isPurchased ? 'primary' : 'outline'}
                    className={`w-full mt-6 ${!isPurchased && 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'}`}
                    onClick={() => handleAction(test)}
                  >
                    {isPurchased ? (
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
              );
            })}
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
              {confirmModal.type === 'buy' ? `Pay ₹${confirmModal.test?.price}` : 'Start Now'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-lg font-medium text-white">{confirmModal.test?.title}</p>

          {confirmModal.type === 'buy' ? (
            <p className="text-gray-400">
              Are you sure you want to purchase this quiz for <span className="text-white font-bold">₹{confirmModal.test?.price}</span>?
              This will deduct the amount from your wallet.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-300">
                You are about to start the quiz. The timer of <span className="text-white font-bold">{confirmModal.test?.duration} minutes</span> will begin immediately.
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
