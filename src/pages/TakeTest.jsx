/**
 * TakeTest Page
 * Browse and start available tests
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Loader } from '../components/common';
import { Header } from '../components/layout';
import { listTests, startAttempt } from '../api';

const TakeTest = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startModal, setStartModal] = useState({ open: false, test: null });
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await listTests({ pageSize: 50 });
      if (response.success) {
        // Filter only finalized tests
        setTests((response.data.list || []).filter(t => t.isFinal));
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!startModal.test) return;
    setStarting(true);
    try {
      const response = await startAttempt(startModal.test.id);
      if (response.success) {
        navigate(`/attempt/${response.data.attemptId}`);
      }
    } catch (error) {
      console.error('Failed to start test:', error);
      alert(error.message || 'Failed to start test');
    } finally {
      setStarting(false);
      setStartModal({ open: false, test: null });
    }
  };

  return (
    <div>
      <Header title="Take a Test" />

      <div className="space-y-6 mt-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : tests.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">No tests available</p>
              <p className="text-sm mt-1">Check back later for new tests</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card key={test.id} hover className="flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="success" dot>Available</Badge>
                    {test.price > 0 && (
                      <span className="text-lg font-bold text-gradient">₹{test.price}</span>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">{test.name}</h3>
                  {test.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{test.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{test.totalQuestions || 0} Questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{test.durationMin || 0} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>{test.totalMarks || 0} marks</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full mt-6"
                  onClick={() => setStartModal({ open: true, test })}
                >
                  Start Test
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Start Test Confirmation */}
      <Modal
        isOpen={startModal.open}
        onClose={() => setStartModal({ open: false, test: null })}
        title="Start Test"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStartModal({ open: false, test: null })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStartTest} isLoading={starting}>
              Start Now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-white font-medium">{startModal.test?.name}</p>
          
          <div className="p-4 bg-dark-800 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Questions:</span>
              <span className="text-white">{startModal.test?.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{startModal.test?.durationMin} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Marks:</span>
              <span className="text-white">{startModal.test?.totalMarks}</span>
            </div>
          </div>

          <div className="p-4 bg-warning-500/10 border border-warning-500/30 rounded-xl">
            <p className="text-warning-400 text-sm">
              ⚠️ Once you start, the timer will begin. Make sure you have enough time to complete the test.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TakeTest;
