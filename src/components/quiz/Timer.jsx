/**
 * Timer Component
 * Countdown timer for test attempts with warning states
 */

import { useState, useEffect, useCallback } from 'react';

const Timer = ({
  totalMinutes,
  remainingMinutes,
  onTimeUp,
  warningThresholdMinutes = 10,
  dangerThresholdMinutes = 5,
}) => {
  const [timeLeft, setTimeLeft] = useState(Math.floor(remainingMinutes * 60));

  useEffect(() => {
    setTimeLeft(Math.floor(remainingMinutes * 60));
  }, [remainingMinutes]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  const formatTime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerClass = () => {
    const minutesLeft = timeLeft / 60;
    if (minutesLeft <= dangerThresholdMinutes) return 'timer-danger';
    if (minutesLeft <= warningThresholdMinutes) return 'timer-warning';
    return 'timer';
  };

  const progress = (timeLeft / (totalMinutes * 60)) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={getTimerClass()}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatTime(timeLeft)}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-32 h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            progress <= 20 ? 'bg-danger-500' :
            progress <= 40 ? 'bg-warning-500' :
            'bg-success-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Timer;
