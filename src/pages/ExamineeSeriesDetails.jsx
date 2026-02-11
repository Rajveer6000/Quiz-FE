import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Badge, Loader, PageHeader, Modal } from '../components/common';
import { seriesApi } from '../api';
import { createOrder, getPaymentConfig, verifyPayment } from '../api/paymentsApi';
import { useToast } from '../context';
import {
  Layers,
  ArrowLeft,
  Calendar,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  Tag,
  ShoppingCart,
  Shield,
  CreditCard,
  Sparkles,
  XCircle,
  RefreshCw,
  Play
} from 'lucide-react';
import { STATUS, STATUS_LABELS } from '../constants/constants';

const formatPrice = (currency, amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  const symbol = currency === 'INR' ? '₹' : currency ? `${currency} ` : '';
  const value = typeof amount === 'number' ? amount.toFixed(0) : amount;
  return `${symbol}${value}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

// Payment Result Modal Component (Shared pattern from TakeTest)
const PaymentResultModal = ({ isOpen, onClose, status, seriesName, onRetry }) => {
  const isSuccess = status === 'success';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
    >
      <div className="flex flex-col items-center py-6 px-4">
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
          {isSuccess && (
            <>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
              <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-emerald-300 animate-ping" style={{ animationDuration: '2s' }} />
              <Sparkles className="absolute top-0 -left-4 w-4 h-4 text-blue-400 animate-pulse" />
            </>
          )}
        </div>

        <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h2>

        <p className="text-gray-400 text-center mb-2">
          {isSuccess
            ? `You have successfully purchased "${seriesName}"`
            : 'Something went wrong with your payment'}
        </p>

        <p className="text-sm text-gray-500 text-center mb-6">
          {isSuccess
            ? 'You now have access to all tests in this series. Good luck! 🎯'
            : 'Don\'t worry, no amount was deducted. Please try again.'}
        </p>

        <div className="flex gap-3 w-full mt-2">
          {isSuccess ? (
            <Button
              variant="primary"
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 h-11"
              onClick={onClose}
            >
              Continue
            </Button>
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

const ExamineeSeriesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentResult, setPaymentResult] = useState({ open: false, status: null, seriesName: '' });

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await seriesApi.getSeriesDetailsPublic(id);
      if (response.success) {
        setSeries(response.data);
      } else {
        setError(response.message || 'Unable to load series details.');
      }
    } catch (err) {
      console.error('Failed to fetch series detail', err);
      setError('Unable to load series details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
      fetchPaymentConfig();
    }

    // Confetti effect style
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
  }, [id]);

  const fetchPaymentConfig = async () => {
    try {
      const response = await getPaymentConfig();
      if (response.success) {
        setPaymentConfig(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment config:', err);
    }
  };

  const handleVerifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    try {
      const verifyResponse = await verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (verifyResponse.success) {
        setPaymentResult({ open: true, status: 'success', seriesName: series.name });
        fetchDetails(); // Refresh to show purchased status
      } else {
        setPaymentResult({ open: true, status: 'failed', seriesName: series.name });
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setPaymentResult({ open: true, status: 'failed', seriesName: series.name });
    } finally {
      setProcessing(false);
    }
  };

  const initializeRazorpayPayment = useCallback(async (orderData) => {
    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: paymentConfig?.name || 'Quiz Platform',
      description: paymentConfig?.description || `Purchase: ${orderData.notes?.entityName || 'Series'}`,
      order_id: orderData.razorpayOrderId,
      handler: async function (response) {
        await handleVerifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: orderData.notes?.userName || '',
        email: orderData.notes?.userEmail || '',
      },
      notes: orderData.notes || {},
      theme: { color: '#6366f1' },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          showToast('Payment cancelled', 'info');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      setPaymentResult({ open: true, status: 'failed', seriesName: series.name });
      setProcessing(false);
    });
    razorpay.open();
  }, [paymentConfig, series, showToast]);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      const orderResponse = await createOrder('SERIES', id);
      if (orderResponse.success) {
        if (window.Razorpay) {
          await initializeRazorpayPayment(orderResponse.data);
        } else {
          showToast('Payment gateway not available. Please refresh.', 'error');
          setProcessing(false);
        }
      } else {
        showToast(orderResponse.message || 'Failed to create order', 'error');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      showToast('Action failed. Please try again.', 'error');
      setProcessing(false);
    }
  };

  const tests = useMemo(() => {
    if (!series?.seriesTests) return [];
    return [...series.seriesTests].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [series]);

  if (loading) {
    return <Loader fullScreen />;
  }

  if (error || !series) {
    return (
      <div className="max-w-3xl mx-auto pt-10">
        <Card className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-red-400">{error || 'Series not found.'}</p>
          <Button variant="primary" onClick={() => navigate('/examinee/series')}>
            Back to Series
          </Button>
        </Card>
      </div>
    );
  }

  const statusVariant = series.status === STATUS.PUBLISHED ? 'success' : 'warning';
  const statusLabel = STATUS_LABELS[series.status] || 'Draft';

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        icon={<Layers className="w-5 h-5" />}
        title={series.name}
        subtitle={series.code}
        actions={
          <Button variant="ghost" onClick={() => navigate('/examinee/series')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />

      <Card>
        <Card.Content className="grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant} dot>{statusLabel}</Badge>
              <Badge variant="accent">{series.currency || 'INR'}</Badge>
              {series.isPurchased && (
                <Badge variant="success">Purchased</Badge>
              )}
            </div>
            {!series.isPurchased && (
              <>
                <p className="text-3xl font-bold text-emerald-400 leading-tight">
                  {formatPrice(series.currency, series.offerPrice)}
                </p>
                <p className="text-sm text-gray-500 line-through">
                  {formatPrice(series.currency, series.listPrice)}
                </p>
              </>
            )}
            {series.description && (
              <p className="text-gray-300">{series.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs mb-1">Created</p>
                <p className="font-medium">{formatDate(series.created_at)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs mb-1">Updated</p>
                <p className="font-medium">{formatDate(series.updated_at)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs mb-1">Validity</p>
                <p className="font-medium">
                  {series.validityDays ? `${series.validityDays} days` : 'No expiry'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs mb-1">Tests Included</p>
                <p className="font-medium">{tests.length}</p>
              </div>
            </div>

            {!series.isPurchased && (
              <Button
                variant="primary"
                className="w-full bg-emerald-500 hover:bg-emerald-600 border-none h-12 text-lg font-bold shadow-lg shadow-emerald-500/20"
                onClick={handlePurchase}
                isLoading={processing}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Buy Series Now
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-400" />
              <Card.Title className="mb-0">Included Tests</Card.Title>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Ordered as shown
            </span>
          </div>
        </Card.Header>
        <Card.Content className="space-y-3">
          {tests.length === 0 && (
            <div className="text-gray-500 text-center py-6">
              No tests found in this series.
            </div>
          )}
          {tests.map((item, idx) => {
            const test = item.test || {};
            return (
              <div
                key={item.id || test.id || idx}
                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">#{item.displayOrder || idx + 1}</span>
                    <p className="font-semibold text-white">{test.name || 'Untitled Test'}</p>
                    <Badge variant={test.isPublished ? 'success' : 'warning'}>
                      {test.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {test.durationMin ? `${test.durationMin} min` : 'No limit'}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {test.totalMarks ?? 0} marks
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      Mandatory: {item.isMandatory ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                {series.isPurchased && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                    onClick={() => navigate(`/attempt/start/${test.id}`)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Take Test
                  </Button>
                )}
              </div>
            );
          })}
        </Card.Content>
      </Card>

      <PaymentResultModal
        isOpen={paymentResult.open}
        onClose={() => setPaymentResult({ ...paymentResult, open: false })}
        status={paymentResult.status}
        seriesName={paymentResult.seriesName}
        onRetry={handlePurchase}
      />
    </div>
  );
};

export default ExamineeSeriesDetails;
