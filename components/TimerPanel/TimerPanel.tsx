'use client';

import React, { useEffect, useState } from 'react';

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
  }

  return [minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

export function TimerPanel() {
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch');

  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  const [countdownRunning, setCountdownRunning] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [countdownTotal, setCountdownTotal] = useState(0);
  const [countdownHours, setCountdownHours] = useState('');
  const [countdownMinutes, setCountdownMinutes] = useState('');

  // Stopwatch ticking
  useEffect(() => {
    if (!stopwatchRunning) return;

    const id = setInterval(() => {
      setStopwatchSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [stopwatchRunning]);

  // Countdown ticking
  useEffect(() => {
    if (!countdownRunning || countdownRemaining <= 0) return;

    const id = setInterval(() => {
      setCountdownRemaining((prev) => {
        if (prev <= 1) {
          setCountdownRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [countdownRunning, countdownRemaining]);

  const handleStopwatchStartPause = () => {
    setStopwatchRunning((prev) => !prev);
  };

  const handleStopwatchReset = () => {
    setStopwatchRunning(false);
    setStopwatchSeconds(0);
  };

  const handleCountdownStart = () => {
    const hours = parseInt(countdownHours, 10) || 0;
    const minutes = parseInt(countdownMinutes, 10) || 0;
    const totalSeconds = hours * 3600 + minutes * 60;
    
    if (totalSeconds <= 0) {
      return;
    }
    
    setCountdownTotal(totalSeconds);
    setCountdownRemaining(totalSeconds);
    setCountdownRunning(true);
  };

  const handleCountdownPause = () => {
    setCountdownRunning(false);
  };

  const handleCountdownReset = () => {
    setCountdownRunning(false);
    setCountdownRemaining(0);
    setCountdownTotal(0);
  };

  const activeDisplaySeconds = mode === 'stopwatch' ? stopwatchSeconds : countdownRemaining;

  const countdownProgress = countdownTotal > 0
    ? Math.max(0, Math.min(100, (countdownRemaining / countdownTotal) * 100))
    : 0;

  return (
    <div className="w-80 h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timer</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Stopwatch &amp; countdown</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Mode selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Mode</h3>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'stopwatch'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMode('stopwatch')}
            >
              Stopwatch
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                mode === 'countdown'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMode('countdown')}
            >
              Countdown
            </button>
          </div>
        </div>

        {/* Time display */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Time</h3>
          <div className="text-4xl font-mono text-center text-gray-900 dark:text-white">
            {formatTime(activeDisplaySeconds)}
          </div>
        </div>

        {/* Stopwatch controls */}
        {mode === 'stopwatch' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Stopwatch</h3>
            <div className="flex gap-2">
              <button
                onClick={handleStopwatchStartPause}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                {stopwatchRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={handleStopwatchReset}
                className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Countdown controls */}
        {mode === 'countdown' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Countdown settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hours</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={countdownHours}
                    onChange={(e) => setCountdownHours(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={countdownMinutes}
                    onChange={(e) => setCountdownMinutes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Controls</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCountdownStart}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Start
                </button>
                <button
                  onClick={handleCountdownPause}
                  disabled={!countdownRunning}
                  className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Pause
                </button>
                <button
                  onClick={handleCountdownReset}
                  disabled={countdownTotal === 0}
                  className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Progress</h3>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${countdownProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
