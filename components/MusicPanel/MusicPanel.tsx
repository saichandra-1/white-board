'use client';

import React, { useEffect, useRef, useState } from 'react';

// Minimal types for the YouTube iframe player we use in this component.
type YouTubePlayerLike = {
  playVideo?: () => void;
  pauseVideo?: () => void;
  loadVideoById?: (videoId: string) => void;
  getDuration?: () => number;
  getCurrentTime?: () => number;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume?: (volume: number) => void;
  destroy?: () => void;
};

type YouTubePlayerEvent = {
  target: YouTubePlayerLike;
};

type YouTubePlayerStateChangeEvent = {
  data: number;
  target: YouTubePlayerLike;
};

type YouTubeGlobal = typeof window & {
  YT?: {
    Player?: new (
      elementId: string,
      options: {
        height: string;
        width: string;
        videoId: string;
        playerVars?: { modestbranding?: 0 | 1 };
        events?: {
          onReady?: (event: YouTubePlayerEvent) => void;
          onStateChange?: (event: YouTubePlayerStateChangeEvent) => void;
        };
      },
    ) => YouTubePlayerLike;
    PlayerState?: {
      PLAYING: number;
      PAUSED: number;
      ENDED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
};

const INITIAL_VOLUME = 50;

const TRACKS = [
  { id: 'nMfPqeZjc2c', title: 'White Noise' },
  { id: 'yIQd2Ya0Ziw', title: 'Rainstorm' },
];

function formatTime(totalSeconds: number): string {
  if (!totalSeconds || !isFinite(totalSeconds)) {
    return '0:00';
  }
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function MusicPanel() {
  const playerRef = useRef<YouTubePlayerLike | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(INITIAL_VOLUME);

  // Load YouTube Iframe API and initialize player
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as YouTubeGlobal;

    const createPlayer = () => {
      if (playerRef.current || !win.YT || !win.YT.Player) {
        return;
      }

      playerRef.current = new win.YT.Player('focus-music-player', {
        height: '0',
        width: '0',
        videoId: TRACKS[0].id,
        playerVars: {
          modestbranding: 1,
        },
        events: {
          onReady: (event: YouTubePlayerEvent) => {
            setIsReady(true);
            const d =
              typeof event.target.getDuration === 'function'
                ? event.target.getDuration()
                : undefined;
            if (typeof d === 'number' && !isNaN(d)) {
              setDuration(d);
            }
            // Set initial volume level
            if (typeof event.target.setVolume === 'function') {
              try {
                event.target.setVolume(INITIAL_VOLUME);
              } catch {
                // ignore player errors
              }
            }
          },
          onStateChange: (event: YouTubePlayerStateChangeEvent) => {
            if (!win.YT || !win.YT.PlayerState) return;
            const { PLAYING, PAUSED, ENDED } = win.YT.PlayerState;
            if (event.data === PLAYING) {
              setIsPlaying(true);
            } else if (event.data === PAUSED || event.data === ENDED) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (win.YT && win.YT.Player) {
      createPlayer();
    } else {
      const scriptId = 'youtube-iframe-api';
      const existingScript = document.getElementById(scriptId);
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = scriptId;
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }

      win.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    }

    return () => {
      if (playerRef.current) {
        if (typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
        playerRef.current = null;
      }
    };
  }, []);

  // Sync current track when index changes
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    const player = playerRef.current;
    const track = TRACKS[currentIndex];

    try {
      if (typeof player.loadVideoById === 'function') {
        player.loadVideoById(track.id);
      }
      const d = player.getDuration && player.getDuration();
      if (typeof d === 'number' && !isNaN(d) && d > 0) {
        setDuration(d);
      } else {
        setDuration(0);
      }
      setCurrentTime(0);
    } catch {
      // ignore runtime errors from YouTube player
    }
  }, [currentIndex, isReady]);

  // Progress polling
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const player = playerRef.current;
    const id = window.setInterval(() => {
      try {
        if (typeof player.getCurrentTime === 'function') {
          const t = player.getCurrentTime();
          if (typeof t === 'number' && !isNaN(t)) {
            setCurrentTime(t);
          }
        }
        if (typeof player.getDuration === 'function') {
          const d = player.getDuration();
          if (typeof d === 'number' && !isNaN(d) && d > 0) {
            setDuration(d);
          }
        }
      } catch {
        // ignore
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [isReady]);

  const togglePlayPause = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (isPlaying) {
        if (typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
      } else {
        if (typeof player.playVideo === 'function') {
          player.playVideo();
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSeek = (value: number) => {
    const player = playerRef.current;
    if (!player || !duration) return;
    try {
      if (typeof player.seekTo === 'function') {
        player.seekTo(value, true);
      }
      setCurrentTime(value);
    } catch {
      // ignore
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const applyVolume = (value: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    setVolume(clamped);
    const player = playerRef.current;
    if (player && typeof player.setVolume === 'function') {
      try {
        player.setVolume(clamped);
      } catch {
        // ignore player errors
      }
    }
  };

  const handleVolumeWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const step = 5;
    const delta = e.deltaY;
    if (delta === 0) return;
    const direction = delta > 0 ? -1 : 1; // scroll down = quieter, up = louder
    applyVolume(volume + direction * step);
  };

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="w-80 h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Focus Music</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          White noise &amp; rain... to help you stay in flow
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Now playing + disk */}
        <div className="flex items-center gap-4">
          <div
            className={`relative w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 via-sky-400 to-indigo-500 shadow-inner flex items-center justify-center ${
              isPlaying ? 'animate-spin' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white/80" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {TRACKS[currentIndex].title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              YouTube ambient sound · auto-loop
            </div>
          </div>
        </div>

        {/* Controls + progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={togglePlayPause}
              disabled={!isReady}
              className={`flex-1 px-4 py-2 text-sm rounded-full font-medium transition-colors ${
                isPlaying
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } ${!isReady ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ▶
            </button>
          </div>

          <div className="space-y-2">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              disabled={!duration}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div
            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pt-1 select-none"
            onWheel={handleVolumeWheel}
            title="Scroll to adjust volume"
          >
            <button
              type="button"
              onClick={() => applyVolume(volume === 0 ? 50 : 0)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-[10px] font-semibold">VOL</span>
            </button>
            <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${volume}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums">{volume}%</span>
          </div>
        </div>

        {/* Playlist */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Playlist
          </h3>
          <div className="space-y-1">
            {TRACKS.map((track, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-white' : 'bg-blue-400 dark:bg-blue-300'
                    }`}
                  />
                  <span className="flex-1 text-left truncate">{track.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hidden iframe host for YouTube player */}
      <div id="focus-music-player" className="hidden" />
    </div>
  );
}
