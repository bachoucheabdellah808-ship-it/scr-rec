import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

export interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  keys: string[];
  context: 'Ready to Record' | 'Recording' | 'Paused' | 'Review & Download' | 'Global';
}

export interface UseKeyboardShortcutsOptions {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  format?: 'webm' | 'mp4';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDownload?: () => void;
  onReset?: () => void;
}

export interface ShortcutToast {
  id: number;
  message: string;
  shortcut: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export function useKeyboardShortcuts({
  isRecording,
  isPaused,
  hasRecording,
  format,
  onStart,
  onPause,
  onResume,
  onStop,
  onDownload,
  onReset,
}: UseKeyboardShortcutsOptions) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toast, setToast] = useState<ShortcutToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  }, []);

  const modKey = isMac ? '⌥' : 'Alt';

  const showToast = useCallback((message: string, shortcut: string, type: ShortcutToast['type'] = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({ id, message, shortcut, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const shortcutsList: ShortcutDefinition[] = useMemo(() => [
    {
      id: 'start',
      label: 'Start Recording',
      description: 'Begins recording with the currently selected source',
      keys: [`${modKey}`, 'R'],
      context: 'Ready to Record',
    },
    {
      id: 'pause-resume',
      label: 'Pause / Resume',
      description: 'Toggles between paused and active recording',
      keys: [`${modKey}`, 'P'],
      context: 'Recording',
    },
    {
      id: 'quick-pause',
      label: 'Quick Pause / Resume',
      description: 'Quick toggle using the Space bar',
      keys: ['Space'],
      context: 'Recording',
    },
    {
      id: 'stop',
      label: 'Stop Recording',
      description: 'Finishes recording and compiles WebM file',
      keys: [`${modKey}`, 'S'],
      context: 'Recording',
    },
    {
      id: 'download',
      label: `Download ${(format || 'webm').toUpperCase()}`,
      description: `Instantly downloads the finished recording in ${(format || 'webm').toUpperCase()} format`,
      keys: [`${modKey}`, 'D'],
      context: 'Review & Download',
    },
    {
      id: 'reset',
      label: 'Reset / New Session',
      description: 'Discards or closes and starts fresh',
      keys: ['Esc'],
      context: 'Global',
    },
    {
      id: 'help',
      label: 'Keyboard Shortcuts',
      description: 'Shows or hides this keyboard shortcuts guide',
      keys: ['?'],
      context: 'Global',
    },
  ], [modKey, format]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is interacting with text inputs
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key;
      const code = event.code;
      const hasAlt = event.altKey;

      // 1. Toggle Help Modal ('?' or Shift + '/')
      if (key === '?' || (event.shiftKey && code === 'Slash')) {
        event.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // 2. Escape: Close modal if open, otherwise reset if finished
      if (key === 'Escape' || code === 'Escape') {
        if (isHelpOpen) {
          event.preventDefault();
          setIsHelpOpen(false);
          return;
        }
        if (hasRecording && onReset) {
          event.preventDefault();
          onReset();
          showToast('Session reset', 'Esc', 'info');
          return;
        }
      }

      // 3. Alt + R (or Option + R): Start recording if idle, or Stop if active
      if (hasAlt && (code === 'KeyR' || key.toLowerCase() === 'r' || key === '®')) {
        event.preventDefault();
        if (!isRecording && !hasRecording) {
          onStart();
          showToast('Recording started', `${modKey} + R`, 'success');
        } else if (isRecording || isPaused) {
          onStop();
          showToast('Recording stopped', `${modKey} + R`, 'danger');
        }
        return;
      }

      // 4. Alt + P (or Option + P): Toggle Pause / Resume
      if (hasAlt && (code === 'KeyP' || key.toLowerCase() === 'p' || key === 'π')) {
        event.preventDefault();
        if (isRecording && !isPaused) {
          onPause();
          showToast('Recording paused', `${modKey} + P`, 'warning');
        } else if (isPaused) {
          onResume();
          showToast('Recording resumed', `${modKey} + P`, 'success');
        }
        return;
      }

      // 5. Alt + S (or Option + S): Stop recording
      if (hasAlt && (code === 'KeyS' || key.toLowerCase() === 's' || key === 'ß')) {
        event.preventDefault();
        if (isRecording || isPaused) {
          onStop();
          showToast('Recording stopped', `${modKey} + S`, 'danger');
        }
        return;
      }

      // 6. Alt + D: Download recording when ready
      if (hasAlt && (code === 'KeyD' || key.toLowerCase() === 'd' || key === '∂')) {
        if (hasRecording && onDownload) {
          event.preventDefault();
          onDownload();
          showToast('Download started', `${modKey} + D`, 'success');
        }
        return;
      }

      // 7. Spacebar: Pause/Resume while recording, or Start when idle (when not on an active button)
      if (code === 'Space' || key === ' ') {
        // If a button is focused, let native click handler execute to avoid double fire
        if (target && target.tagName === 'BUTTON') {
          return;
        }

        if (isRecording && !isPaused) {
          event.preventDefault();
          onPause();
          showToast('Recording paused', 'Space', 'warning');
        } else if (isPaused) {
          event.preventDefault();
          onResume();
          showToast('Recording resumed', 'Space', 'success');
        } else if (!isRecording && !hasRecording && !isHelpOpen) {
          event.preventDefault();
          onStart();
          showToast('Recording started', 'Space', 'success');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isRecording,
    isPaused,
    hasRecording,
    isHelpOpen,
    modKey,
    onStart,
    onPause,
    onResume,
    onStop,
    onDownload,
    onReset,
    showToast,
  ]);

  return {
    isHelpOpen,
    setIsHelpOpen,
    toast,
    setToast,
    modKey,
    shortcutsList,
  };
}
