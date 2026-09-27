import React, { useMemo } from 'react';
import { formatTimeComponents } from '../utils/formatTime';
import './VisualTimer.css';

export interface VisualTimerProps {
  /** Elapsed duration in seconds */
  elapsedTime: number;
  /** Whether recording is currently in progress */
  isRecording: boolean;
  /** Whether recording is currently paused */
  isPaused: boolean;
  /** Display variant: 'overlay' (floating preview HUD), 'panel' (rich dashboard card), or 'compact' (inline pill) */
  variant?: 'overlay' | 'panel' | 'compact';
  /** Optional custom class name */
  className?: string;
  /** Optional label for recording source (e.g. 'Screen', 'Window', 'Tab') */
  sourceLabel?: string;
  /** Optional video format label (e.g. 'WebM', 'MP4') */
  formatLabel?: string;
  /** Whether to show estimated file size based on recording duration */
  showEstimatedSize?: boolean;
}

export const VisualTimer: React.FC<VisualTimerProps> = ({
  elapsedTime,
  isRecording,
  isPaused,
  variant = 'overlay',
  className = '',
  sourceLabel,
  formatLabel = 'WebM',
  showEstimatedSize = true,
}) => {
  const { hours, minutes, seconds, formattedText } = useMemo(
    () => formatTimeComponents(elapsedTime),
    [elapsedTime]
  );

  const hasHours = Number(hours) > 0;
  const minuteProgressPercent = useMemo(() => {
    const s = Number(seconds);
    return Math.min(100, Math.round(((s % 60) / 60) * 100));
  }, [seconds]);

  // Estimated file size at standard 5 Mbps WebM stream (~625 KB/s)
  const estimatedSizeMb = useMemo(() => {
    if (elapsedTime <= 0) return '0.0';
    const mb = (elapsedTime * (5000000 / 8)) / (1024 * 1024);
    return mb.toFixed(1);
  }, [elapsedTime]);

  const statusClass = isPaused ? 'is-paused' : isRecording ? 'is-recording' : 'is-idle';
  const statusLabel = isPaused ? 'Paused' : isRecording ? 'Recording' : 'Standby';

  // 1. Overlay Variant (Floating HUD directly on top of video preview)
  if (variant === 'overlay') {
    return (
      <div
        className={`visual-timer-overlay ${statusClass} ${className}`}
        role="timer"
        aria-live="off"
        aria-label={`Recording time: ${formattedText}, status: ${statusLabel}`}
      >
        <div className={`timer-status-pill ${isPaused ? 'paused' : 'recording'}`}>
          <span className="timer-pulse-beacon" aria-hidden="true" />
          <span>{isPaused ? 'PAUSED' : 'REC'}</span>
        </div>

        <div className="timer-digits-display">
          {hasHours && (
            <>
              <span>{hours}</span>
              <span className="timer-separator">:</span>
            </>
          )}
          <span>{minutes}</span>
          <span className="timer-separator">:</span>
          <span>{seconds}</span>
        </div>

        {/* Live dynamic soundwave / activity visualizer bars */}
        <div className="timer-waveform-bars" aria-hidden="true">
          <span className="timer-bar" />
          <span className="timer-bar" />
          <span className="timer-bar" />
          <span className="timer-bar" />
        </div>
      </div>
    );
  }

  // 2. Compact Variant (For header or inline toolbar)
  if (variant === 'compact') {
    return (
      <div
        className={`timer-digits-display ${statusClass} ${className}`}
        style={{ fontSize: '14px', gap: '6px' }}
        role="timer"
        aria-live="off"
        aria-label={`Elapsed duration: ${formattedText}`}
      >
        <span className="timer-pulse-beacon" style={{ display: 'inline-block' }} aria-hidden="true" />
        <span>{formattedText}</span>
      </div>
    );
  }

  // 3. Panel Variant (Dedicated rich session timer card on the screen)
  return (
    <div
      className={`visual-timer-panel ${statusClass} ${className}`}
      role="timer"
      aria-live="off"
      aria-label={`Recording session duration: ${formattedText}`}
    >
      <div className="timer-panel-header">
        <div className="timer-panel-title">
          <div className={`timer-session-badge ${isPaused ? 'paused' : isRecording ? 'recording' : 'completed'}`}>
            <span className="timer-pulse-beacon" aria-hidden="true" />
            <span>{isPaused ? 'Session Paused' : isRecording ? 'Live Session Active' : 'Session Ready'}</span>
          </div>
          {sourceLabel && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              · {sourceLabel}
            </span>
          )}
        </div>

        <div className="timer-meta-tags">
          {showEstimatedSize && (
            <div className="timer-meta-item" title="Estimated video file size">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Est. ~{estimatedSizeMb} MB</span>
            </div>
          )}
          <div className="timer-meta-item" title="Recording specification">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>1080p · {formatLabel.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Large Segmented Monospace Clock Display */}
      <div className="timer-clock-segments">
        {hasHours && (
          <>
            <div className="timer-segment-box">
              <span className="timer-segment-value">{hours}</span>
              <span className="timer-segment-label">Hours</span>
            </div>
            <span className="timer-segment-colon">:</span>
          </>
        )}

        <div className="timer-segment-box">
          <span className="timer-segment-value">{minutes}</span>
          <span className="timer-segment-label">Minutes</span>
        </div>

        <span className="timer-segment-colon">:</span>

        <div className="timer-segment-box">
          <span className="timer-segment-value">{seconds}</span>
          <span className="timer-segment-label">Seconds</span>
        </div>
      </div>

      {/* Minute Progression Track */}
      <div className="timer-progress-track" title={`Current minute cycle: ${seconds}s / 60s`}>
        <div
          className="timer-progress-fill"
          style={{ width: `${minuteProgressPercent}%` }}
        />
      </div>

      <div className="timer-panel-footer">
        <div className="timer-live-hint">
          <span className={`timer-live-dot ${isPaused ? 'paused' : ''}`} style={isPaused ? { background: 'var(--warning)' } : undefined} />
          <span>{isPaused ? 'Timer paused — Click Resume to continue' : 'Recording frame capture in real-time'}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)' }}>
          {hours}:{minutes}:{seconds}
        </div>
      </div>
    </div>
  );
};

export default VisualTimer;
