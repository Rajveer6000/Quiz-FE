/**
 * Admin tool — bulk seed questions into a test's sections via API.
 */

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Square, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import { PageHeader, Button, Card, Input } from '../components/common';
import { TEST_QUESTION_SEED } from '../constants/constants';
import { seedTestQuestions } from '../utils/seedTestQuestions';

const LOG_COLORS = {
  start: 'text-blue-600',
  'test-loaded': 'text-indigo-600',
  'section-start': 'text-violet-600',
  'section-skip': 'text-slate-500',
  'question-added': 'text-emerald-600',
  'question-failed': 'text-red-600',
  retry: 'text-amber-600',
  'section-done': 'text-indigo-500',
  complete: 'text-emerald-700 font-semibold',
  stopped: 'text-orange-600 font-semibold',
  error: 'text-red-700 font-semibold',
};

const SeedTestQuestions = () => {
  const [testId, setTestId] = useState(String(TEST_QUESTION_SEED.DEFAULT_TEST_ID || ''));
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const stopRef = useRef(false);

  const appendLog = (entry) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        time: new Date().toLocaleTimeString(),
        ...entry,
      },
    ]);
  };

  const handleStart = async () => {
    if (!testId.trim()) return;

    stopRef.current = false;
    setRunning(true);
    setLogs([]);

    try {
      await seedTestQuestions({
        testId: testId.trim(),
        maxRetries: TEST_QUESTION_SEED.MAX_RETRIES,
        shouldStop: () => stopRef.current,
        onProgress: (event) => {
          appendLog({
            type: event.type,
            message: event.message || event.error || JSON.stringify(event),
          });
        },
      });
    } catch (error) {
      appendLog({
        type: 'error',
        message: error?.message || error?.result?.responseDescription || 'Seed failed',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    appendLog({ type: 'stopped', message: 'Stop requested — finishing current request…' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seed Test Questions"
        subtitle="Auto-fill every section of a draft test with unique MCQ questions (retries on error)"
      />

      <Card className="space-y-5" padding={false}>
        <div className="p-6 space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Dev / admin tool</p>
            <p className="mt-1 text-amber-800">
              Enter a <strong>draft</strong> test ID. The tool fetches all sections, then calls{' '}
              <code className="rounded bg-white/70 px-1">POST /tests/:id/questions</code> for each
              empty slot until every section reaches its question limit.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Input
            label="Test ID"
            type="number"
            min={1}
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            placeholder="e.g. 68"
            disabled={running}
          />

          <Button
            onClick={handleStart}
            disabled={running || !testId.trim()}
            className="gap-2"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Running…' : 'Start seeding'}
          </Button>

          <Button
            variant="outline"
            onClick={handleStop}
            disabled={!running}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>

        <div className="text-sm text-slate-600">
          <p>Max retries on error: <strong>{TEST_QUESTION_SEED.MAX_RETRIES}</strong> · No delay between requests</p>
        </div>

        {testId && (
          <p className="text-sm text-slate-500">
            Open test:{' '}
            <Link to={`/tests/${testId}/edit`} className="text-indigo-600 hover:underline">
              /tests/{testId}/edit
            </Link>
          </p>
        )}
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          Activity log
        </div>
        <div className="max-h-[480px] overflow-y-auto p-4 font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">No activity yet. Enter a test ID and click Start.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`flex gap-2 ${LOG_COLORS[log.type] || 'text-slate-600'}`}>
                <span className="shrink-0 text-slate-400">[{log.time}]</span>
                {log.type === 'question-added' && <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                {(log.type === 'question-failed' || log.type === 'error') && (
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                )}
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SeedTestQuestions;
