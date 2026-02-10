import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Badge, Loader, PageHeader } from '../components/common';
import { seriesApi } from '../api';
import {
  Layers,
  ArrowLeft,
  Calendar,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  Tag
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

const ExamineeSeriesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    }
  }, [id]);

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
        <Card.Content className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant} dot>{statusLabel}</Badge>
              <Badge variant="accent">{series.currency || 'INR'}</Badge>
            </div>
            <p className="text-3xl font-bold text-emerald-400 leading-tight">
              {formatPrice(series.currency, series.offerPrice)}
            </p>
            <p className="text-sm text-gray-500 line-through">
              {formatPrice(series.currency, series.listPrice)}
            </p>
            {series.description && (
              <p className="text-gray-300">{series.description}</p>
            )}
          </div>

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
                  <div className="flex items-center gap-2">
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
              </div>
            );
          })}
        </Card.Content>
      </Card>
    </div>
  );
};

export default ExamineeSeriesDetails;
