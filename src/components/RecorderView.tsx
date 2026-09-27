import { useState, useRef, useEffect, useMemo } from 'react';
import { VisualTimer } from './VisualTimer';
import { formatTimeComponents } from '../utils/formatTime';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { FormatSelector } from './FormatSelector';
import type { VideoFormat, AutoFormatRecommendation } from '../hooks/useScreenRecorder';

export interface RecorderViewProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  elapsedTime: number;
  recordingBlob: Blob | null;
  error: string | null;
  mediaStream: MediaStream | null;
  format: VideoFormat;
  onFormatChange: (format: VideoFormat) => void;
  actualFormat: VideoFormat;
  recommendation?: AutoFormatRecommendation;
  onStart: (sourceType?: 'screen' | 'window' | 'tab') => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDownload: () => void;
  onStopStream: () => void;
}

export function RecorderView({
  isRecording,
  isPaused,
  hasRecording,
  elapsedTime,
  recordingBlob,
  error,
  mediaStream,
  format,
  onFormatChange,
  actualFormat,
  recommendation,
  onStart,
  onPause,
  onResume,
  onStop,
  onDownload,
  onStopStream,
}: RecorderViewProps) {
  const [activeSourceType, setActiveSourceType] = useState<'screen' | 'window' | 'tab'>('screen');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Manage recorded video Object URL lifecycle to prevent memory leaks
  const recordedVideoUrl = useMemo(() => {
    if (!recordingBlob) return null;
    return URL.createObjectURL(recordingBlob);
  }, [recordingBlob]);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewWrapperRef = useRef<HTMLDivElement | null>(null);
  const downloadSectionRef = useRef<HTMLDivElement | null>(null);

  // Track window scroll position for floating back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 260);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-scroll preview into view when recording begins
  useEffect(() => {
    if (isRecording) {
      previewWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isRecording]);

  // Auto-scroll to download console when recording is finished
  useEffect(() => {
    if (hasRecording && !mediaStream) {
      downloadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hasRecording, mediaStream]);

  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  // Bind mediaStream to video element with strictly enforced muted audio to eliminate feedback loops
  useEffect(() => {
    const video = liveVideoRef.current;
    if (!video) return;

    if (mediaStream) {
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      // Guaranteed muted audio on DOM element property to prevent feedback loops
      video.muted = true;
      video.volume = 0;
      video.play().catch((err) => {
        console.warn('Real-time preview play interrupted:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [mediaStream]);

  const sourceLabels: Record<'screen' | 'window' | 'tab', string> = {
    screen: 'Entire Screen',
    window: 'Application Window',
    tab: 'Browser Tab',
  };

  const handleStartRecording = (source: 'screen' | 'window' | 'tab') => {
    setActiveSourceType(source);
    onStart(source);
  };

  // Wire up global keyboard shortcuts
  const {
    isHelpOpen,
    setIsHelpOpen,
    toast,
    modKey,
    shortcutsList,
  } = useKeyboardShortcuts({
    isRecording,
    isPaused,
    hasRecording,
    format: actualFormat || format,
    onStart: () => handleStartRecording(activeSourceType),
    onPause,
    onResume,
    onStop,
    onDownload,
    onReset: onStopStream,
  });

  const formattedFinalDuration = formatTimeComponents(elapsedTime).formattedText;
  const currentFormatDisplay = (actualFormat || format).toUpperCase();

  return (
    <div className="recorder-app">
      <header className="recorder-header">
        <div className="brand">
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
            </svg>
          </div>
          <span>Screen Recorder</span>
        </div>
        <div className="header-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Local · No uploads
        </div>
        <div className="header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIsHelpOpen(true)}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
              <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M6 12h.001M10 12h.001M14 12h.001M18 12h.001M8 16h8"/>
            </svg>
            <span style={{ fontSize: '12px' }}>Shortcuts</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onStopStream} title="Reset (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 119 9"/>
              <path d="M3 3v6h6"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="recorder-main">
        {/* Preview Area */}
        <div className="preview-wrapper" ref={previewWrapperRef}>
          {mediaStream && (
            <>
              <video
                ref={liveVideoRef}
                className="preview-video"
                autoPlay
                playsInline
                muted
                aria-label="Real-time screen recording preview (audio muted to prevent feedback loops)"
                title="Live preview (Audio muted to prevent feedback loops)"
              />
              <div className="live-stream-badge">
                <span className="live-stream-dot" />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
                <span>Live Feed · Audio Muted</span>
              </div>
            </>
          )}

          {!mediaStream && !hasRecording && (
            <div className="preview-placeholder">
              <div className="placeholder-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
                </svg>
              </div>
              <h3>Your screen preview will appear here</h3>
              <p>Choose your source and format, then start recording</p>
            </div>
          )}

          {hasRecording && !mediaStream && (
            <video
              className="preview-video"
              src={recordedVideoUrl || undefined}
              controls
              autoPlay
              playsInline
            />
          )}

          {/* Dynamic Visual Timer Overlay on Screen Preview */}
          {(isRecording || isPaused) && (
            <VisualTimer
              elapsedTime={elapsedTime}
              isRecording={isRecording}
              isPaused={isPaused}
              variant="overlay"
            />
          )}
        </div>

        {/* Dynamic Visual Timer Session Console */}
        {(isRecording || isPaused) && (
          <VisualTimer
            elapsedTime={elapsedTime}
            isRecording={isRecording}
            isPaused={isPaused}
            variant="panel"
            sourceLabel={sourceLabels[activeSourceType]}
            formatLabel={currentFormatDisplay}
          />
        )}

        {/* Source Picker & Format Selector (Shown before starting a session) */}
        {!isRecording && !hasRecording && (
          <>
            <div className="source-picker-section">
              <h3 className="section-label">What would you like to record?</h3>
              <div className="source-options">
                <button
                  className={`source-card ${activeSourceType === 'screen' ? 'selected' : ''}`}
                  onClick={() => handleStartRecording('screen')}
                >
                  <div className="source-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <span>Entire Screen</span>
                  <span className="source-hint">Record your full display</span>
                </button>

                <button
                  className={`source-card ${activeSourceType === 'window' ? 'selected' : ''}`}
                  onClick={() => handleStartRecording('window')}
                >
                  <div className="source-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                      <line x1="10" y1="10" x2="14" y2="10"/>
                    </svg>
                  </div>
                  <span>Application Window</span>
                  <span className="source-hint">Pick a specific window</span>
                </button>

                <button
                  className={`source-card ${activeSourceType === 'tab' ? 'selected' : ''}`}
                  onClick={() => handleStartRecording('tab')}
                >
                  <div className="source-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <span>Browser Tab</span>
                  <span className="source-hint">Just the active tab</span>
                </button>
              </div>
            </div>

            {/* Video Format Selector Component (WebM vs MP4) */}
            <FormatSelector
              selectedFormat={format}
              onSelectFormat={onFormatChange}
              recommendation={recommendation}
              disabled={isRecording || isPaused}
            />
          </>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
            <button className="error-close" onClick={onStopStream}>×</button>
          </div>
        )}

        {/* Controls */}
        <div className="controls-section">
          {!isRecording && !hasRecording && (
            <button className="btn btn-primary btn-start" onClick={() => handleStartRecording(activeSourceType)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span>Start Recording ({currentFormatDisplay})</span>
              <span className="btn-shortcut-hint" title={`Shortcut: ${modKey} + R or Space`}>
                <kbd className="kbd-chip">{modKey}</kbd>
                <kbd className="kbd-chip">R</kbd>
              </span>
            </button>
          )}

          {isRecording && !isPaused && (
            <>
              <button className="btn btn-secondary" onClick={onPause}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
                <span>Pause</span>
                <span className="btn-shortcut-hint" title={`Shortcut: ${modKey} + P or Space`}>
                  <kbd className="kbd-chip">{modKey}</kbd>
                  <kbd className="kbd-chip">P</kbd>
                </span>
              </button>
              <button className="btn btn-danger" onClick={onStop}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                <span>Stop</span>
                <span className="btn-shortcut-hint" title={`Shortcut: ${modKey} + S`}>
                  <kbd className="kbd-chip">{modKey}</kbd>
                  <kbd className="kbd-chip">S</kbd>
                </span>
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button className="btn btn-primary" onClick={onResume}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span>Resume</span>
                <span className="btn-shortcut-hint" title={`Shortcut: ${modKey} + P or Space`}>
                  <kbd className="kbd-chip">{modKey}</kbd>
                  <kbd className="kbd-chip">P</kbd>
                </span>
              </button>
              <button className="btn btn-danger" onClick={onStop}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                <span>Stop</span>
                <span className="btn-shortcut-hint" title={`Shortcut: ${modKey} + S`}>
                  <kbd className="kbd-chip">{modKey}</kbd>
                  <kbd className="kbd-chip">S</kbd>
                </span>
              </button>
            </>
          )}

          {hasRecording && !mediaStream && (
            <div className="download-section" ref={downloadSectionRef}>
              <div className="download-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="download-label">Recording complete!</p>
                <p className="download-meta">
                  Duration: {formattedFinalDuration} · {currentFormatDisplay}
                  {recordingBlob?.size ? ` · ${(recordingBlob.size / 1024 / 1024).toFixed(2)} MB` : ''}
                </p>
              </div>
              <div className="download-actions">
                <button className="btn btn-primary" onClick={onDownload}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download {currentFormatDisplay}</span>
                  <span className="btn-shortcut-hint" title={`Shortcut: ${modKey} + D`}>
                    <kbd className="kbd-chip">{modKey}</kbd>
                    <kbd className="kbd-chip">D</kbd>
                  </span>
                </button>
                <button className="btn btn-secondary" onClick={onStopStream}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                  </svg>
                  <span>Record Again</span>
                  <span className="btn-shortcut-hint" title="Shortcut: Esc">
                    <kbd className="kbd-chip">Esc</kbd>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="info-footer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <pre
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
            }}
          >
            Recordings stay on your device. Nothing is uploaded. Press <kbd className="kbd-chip" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}>?</kbd> anytime for shortcuts.
          </pre>
          <span>&copy; {new Date().getFullYear()} Screen Recorder · Private, Local-Only In-Browser Recording</span>
        </div>
      </main>

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="shortcut-toast-container" role="status" aria-live="polite">
          <div className={`shortcut-toast-card ${toast.type}`}>
            <span>{toast.message}</span>
            <kbd className="kbd-chip">{toast.shortcut}</kbd>
          </div>
        </div>
      )}

        {/* Keyboard Shortcuts Cheatsheet Modal */}
        <KeyboardShortcutsModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          shortcuts={shortcutsList}
          modKey={modKey}
        />

        {/* Floating Back to Top Button */}
        {showScrollTop && (
          <button
            className="btn-scroll-top"
            onClick={scrollToTop}
            title="Back to top"
            aria-label="Back to top"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        )}
      </div>
    );
  }
