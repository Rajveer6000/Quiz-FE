/**
 * Student Detail Page
 * Purchases, attempts, and spending for one student
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Badge, PageHeader } from '../components/common';
import { getStudent } from '../api/studentsApi';
import { ATTEMPT_STATUS_LABELS } from '../constants/constants';
import { GraduationCap, ArrowLeft } from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getStudent(id);
        if (response.success) {
          setStudent(response.data);
        } else {
          setError(response.message || 'Student not found');
        }
      } catch (err) {
        setError(err?.result?.responseDescription || 'Failed to load student');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStudent();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading student...</div>;
  }

  if (error || !student) {
    return (
      <div className="text-center py-12">
        <p className="text-danger-400 mb-4">{error || 'Student not found'}</p>
        <Button variant="outline" onClick={() => navigate('/examinees')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<GraduationCap className="w-5 h-5" />}
        title={`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email}
        subtitle={student.email}
        actions={
          <Button variant="ghost" onClick={() => navigate('/examinees')}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-400">Total Spent</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(student.totalSpent)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-400">Test Purchases</p>
            <p className="text-2xl font-bold text-white mt-1">{student.purchases?.tests?.length || 0}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-400">Avg Score</p>
            <p className="text-2xl font-bold text-white mt-1">{student.avgScore}%</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-400">Last Activity</p>
            <p className="text-lg font-semibold text-white mt-1">
              {student.lastActivity
                ? new Date(student.lastActivity).toLocaleDateString()
                : '—'}
            </p>
          </Card>
        </div>

        <Card>
          <Card.Header><Card.Title>Test Purchases</Card.Title></Card.Header>
          <Card.Content>
            {(student.purchases?.tests || []).length === 0 ? (
              <p className="text-gray-500">No test purchases</p>
            ) : (
              <div className="space-y-2">
                {student.purchases.tests.map((p) => (
                  <div key={p.id} className="flex justify-between p-3 rounded-lg bg-slate-800/50">
                    <span className="text-white">{p.testName}</span>
                    <span className="text-gray-300">{formatCurrency(p.pricePaid)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header><Card.Title>Recent Attempts</Card.Title></Card.Header>
          <Card.Content>
            {(student.recentAttempts || []).length === 0 ? (
              <p className="text-gray-500">No attempts yet</p>
            ) : (
              <div className="space-y-2">
                {student.recentAttempts.map((a) => (
                  <div key={a.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="text-white">{a.testName}</p>
                      <p className="text-xs text-gray-400">
                        {a.startedAt ? new Date(a.startedAt).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.percentageScore != null && (
                        <span className="text-white font-medium">{a.percentageScore}%</span>
                      )}
                      <Badge variant="primary">
                        {ATTEMPT_STATUS_LABELS[a.status] || a.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default StudentDetail;
