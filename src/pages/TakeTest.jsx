import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Loader, PageHeader } from '../components/common';
import { useToast } from '../context';
import { getAvailableTests } from '../api/testsApi';
import { createOrder, getPaymentConfig, verifyPayment } from '../api/paymentsApi';
import { purchaseTest } from '../api/purchasesApi';
import {
  BookOpen,
  Clock,
  HelpCircle,
  Award,
  ShoppingCart,
  Play,
  AlertTriangle,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';

// Payment Result Modal Component
const PaymentResultModal = ({ isOpen, onClose, status, testName, onRetry, onContinue }) => {
  const isSuccess = status === 'success';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
    >
      <div className="flex flex-col items-center py-6 px-4">
        {/* Animated Icon */}
        <div className={`relative mb-6 ${isSuccess ? 'animate-bounce' : 'animate-pulse'}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isSuccess
            ? 'bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-500/30'
            : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-lg shadow-red-500/30'
            }`}>
            {isSuccess ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : (
              <XCircle className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Sparkle effects for success */}
          {isSuccess && (
            <>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
              <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-emerald-300 animate-ping" style={{ animationDuration: '2s' }} />
              <Sparkles className="absolute top-0 -left-4 w-4 h-4 text-blue-400 animate-pulse" />
            </>
          )}
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-2">
          {isSuccess
            ? `You have successfully purchased "${testName}"`
            : 'Something went wrong with your payment'}
        </p>

        {isSuccess ? (
          <p className="text-sm text-gray-500 text-center mb-6">
            You can now start the test anytime you want. Good luck! 🎯
          </p>
        ) : (
          <p className="text-sm text-gray-500 text-center mb-6">
            Don't worry, no amount was deducted. Please try again.
          </p>
        )}

        {/* Confetti effect for success - CSS animation */}
        {isSuccess && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${10 + (i * 7)}%`,
                  backgroundColor: ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6'][i % 5],
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-2">
          {isSuccess ? (
            <>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={onClose}
              >
                Browse More
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                onClick={onContinue}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Test
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

const TakeTest = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, test: null, type: null });
  const [processing, setProcessing] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentResult, setPaymentResult] = useState({ open: false, status: null, testName: '', testId: null });

  useEffect(() => {
    fetchTests();
    fetchPaymentConfig();

    // Add confetti animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
      }
      .animate-confetti {
        animation: confetti 1.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await getAvailableTests();
      if (response.success) {
        setTests(response.data.content || []);
      } else {
        showToast('Failed to load tests', 'error');
      }
    } catch (error) {
      showToast('Error loading tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const response = await getPaymentConfig();
      if (response.success) {
        setPaymentConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
    }
  };

  const handleAction = (test) => {
    if (test.isPurchased) {
      setConfirmModal({ open: true, test, type: 'start' });
    } else {
      setConfirmModal({ open: true, test, type: 'buy' });
    }
  };

  const handleVerifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, testName, testId) => {
    try {
      const verifyResponse = await verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

      if (verifyResponse.success) {
        setPaymentResult({ open: true, status: 'success', testName, testId });
        await fetchTests(); // Refresh list to show updated purchase status
      } else {
        setPaymentResult({ open: true, status: 'failed', testName, testId });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentResult({ open: true, status: 'failed', testName, testId });
    } finally {
      setProcessing(false);
    }
  };

  const initializeRazorpayPayment = useCallback(async (orderData, testName, testId) => {
    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: paymentConfig?.name || 'Quiz Platform',
      description: paymentConfig?.description || `Purchase: ${orderData.notes?.entityName || 'Test'}`,
      order_id: orderData.razorpayOrderId,
      handler: async function (response) {
        // Payment successful - now verify with backend
        setConfirmModal({ open: false, test: null, type: null });

        await handleVerifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          testName,
          testId
        );
      },
      prefill: {
        name: orderData.notes?.userName || '',
        email: orderData.notes?.userEmail || '',
      },
      notes: orderData.notes || {},
      theme: {
        color: '#6366f1', // Primary indigo color
        backdrop_color: 'rgba(15, 23, 42, 0.95)',
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          showToast('Payment cancelled', 'info');
        },
        escape: true,
        animation: true,
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      setConfirmModal({ open: false, test: null, type: null });
      setPaymentResult({ open: true, status: 'failed', testName, testId });
      setProcessing(false);
    });

    razorpay.open();
  }, [paymentConfig, showToast]);

  const processAction = async () => {
    if (!confirmModal.test) return;
    setProcessing(true);

    try {
      if (confirmModal.type === 'buy') {
        const isFree = !confirmModal.test.price || confirmModal.test.price === 0;

        if (isFree) {
          // Direct purchase for free tests
          const response = await purchaseTest(confirmModal.test.id);
          if (response.success) {
            setPaymentResult({
              open: true,
              status: 'success',
              testName: confirmModal.test.name,
              testId: confirmModal.test.id
            });
            await fetchTests(); // Refresh list
            setConfirmModal({ open: false, test: null, type: null });
          } else {
            showToast(response.message || 'Failed to add free test', 'error');
            setPaymentResult({
              open: true,
              status: 'failed',
              testName: confirmModal.test.name,
              testId: confirmModal.test.id
            });
          }
          setProcessing(false);
          return;
        }

        // Paid test - Create order first
        const orderResponse = await createOrder('TEST', confirmModal.test.id);

        if (!orderResponse.success) {
          showToast(orderResponse.message || 'Failed to create order', 'error');
          setProcessing(false);
          return;
        }

        // Initialize Razorpay checkout
        if (window.Razorpay) {
          await initializeRazorpayPayment(
            orderResponse.data,
            confirmModal.test.name,
            confirmModal.test.id
          );
        } else {
          showToast('Payment gateway not available. Please refresh the page.', 'error');
          setProcessing(false);
        }
      } else {
        // Start test logic
        navigate(`/attempt/start/${confirmModal.test.id}`);
        setConfirmModal({ open: false, test: null, type: null });
        setProcessing(false);
      }
    } catch (error) {
      console.error('Action error:', error);
      showToast('Action failed. Please try again.', 'error');
      setProcessing(false);
    }
  };

  const handlePaymentResultClose = () => {
    setPaymentResult({ open: false, status: null, testName: '', testId: null });
  };

  const handleStartAfterPayment = () => {
    if (paymentResult.testId) {
      navigate(`/attempt/start/${paymentResult.testId}`);
    }
    handlePaymentResultClose();
  };

  const handleRetryPayment = () => {
    handlePaymentResultClose();
    // Find the test and reopen purchase modal
    const test = tests.find(t => t.id === paymentResult.testId);
    if (test) {
      setConfirmModal({ open: true, test, type: 'buy' });
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `₹${price.toFixed ? price.toFixed(2) : price}`;
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

      {/* Payment / Start Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => !processing && setConfirmModal({ open: false, test: null, type: null })}
        title={confirmModal.type === 'buy' ? 'Complete Purchase' : 'Start Quiz'}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmModal({ open: false, test: null, type: null })}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.type === 'buy' ? 'success' : 'primary'}
              onClick={processAction}
              isLoading={processing}
              disabled={processing}
            >
              {confirmModal.type === 'buy' ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formatPrice(confirmModal.test?.price)}
                </>
              ) : (
                'Start Now'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-lg font-medium text-white">{confirmModal.test?.name}</p>

          {confirmModal.type === 'buy' ? (
            <div className="space-y-4">
              {/* Price Summary */}
              <div className="p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">Test Price</span>
                  <span className="text-xl font-bold text-emerald-400">{formatPrice(confirmModal.test?.price)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  <span>Secure payment via Razorpay</span>
                </div>
              </div>

              {/* Test Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>{confirmModal.test?.totalQuestions} Questions</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>{formatDuration(confirmModal.test?.durationMin)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{confirmModal.test?.totalMarks} Marks</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Lifetime access</span>
                </div>
              </div>
            </div>
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

      {/* Payment Result Modal */}
      <PaymentResultModal
        isOpen={paymentResult.open}
        onClose={handlePaymentResultClose}
        status={paymentResult.status}
        testName={paymentResult.testName}
        onRetry={handleRetryPayment}
        onContinue={handleStartAfterPayment}
      />
    </div>
  );
};

export default TakeTest;
