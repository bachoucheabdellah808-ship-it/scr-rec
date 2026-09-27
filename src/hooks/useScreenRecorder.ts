import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

export type VideoFormat = 'webm' | 'mp4';

export interface FormatSupportInfo {
  supported: boolean;
  preferredMime: string | null;
  codecsLabel: string;
}

export interface AutoFormatRecommendation {
  recommendedFormat: VideoFormat;
  reason: string;
  isAutoSuggested: boolean;
  webm: FormatSupportInfo;
  mp4: FormatSupportInfo;
}

export interface UseScreenRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  elapsedTime: number;
  recordingBlob: Blob | null;
  error: string | null;
  mediaStream: MediaStream | null;
  format: VideoFormat;
  setFormat: (format: VideoFormat) => void;
  actualFormat: VideoFormat;
  recommendation: AutoFormatRecommendation;
  startRecording: (sourceType?: 'screen' | 'window' | 'tab') => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Blob | null;
  downloadRecording: () => void;
  stopStream: () => void;
}

const WEBM_MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

const MP4_MIME_CANDIDATES = [
  'video/mp4;codecs=avc1,opus',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1',
  'video/mp4;codecs=h264',
  'video/mp4',
];

export function checkFormatSupport(targetFormat: VideoFormat): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  const candidates = targetFormat === 'mp4' ? MP4_MIME_CANDIDATES : WEBM_MIME_CANDIDATES;
  return candidates.some((mime) => MediaRecorder.isTypeSupported(mime));
}

export function getAutoFormatRecommendation(): AutoFormatRecommendation {
  const isBrowser = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

  if (!isBrowser) {
    return {
      recommendedFormat: 'webm',
      reason: 'Standard browser default container',
      isAutoSuggested: false,
      webm: { supported: true, preferredMime: 'video/webm', codecsLabel: 'VP9 · Opus' },
      mp4: { supported: false, preferredMime: null, codecsLabel: 'H.264 · AAC' },
    };
  }

  // 1. Evaluate WebM support
  let webmMime: string | null = null;
  for (const mime of WEBM_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      webmMime = mime;
      break;
    }
  }

  // 2. Evaluate MP4 support
  let mp4Mime: string | null = null;
  for (const mime of MP4_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      mp4Mime = mime;
      break;
    }
  }

  const isWebMSupported = webmMime !== null;
  const isMp4Supported = mp4Mime !== null;

  // Check user agent context
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);
  const isChromeOrEdge = /chrome|chromium|edg/i.test(ua);

  let recommendedFormat: VideoFormat = 'webm';
  let reason = '';

  if (isMp4Supported && !isWebMSupported) {
    recommendedFormat = 'mp4';
    reason = 'MP4 (H.264) is the natively supported video container in your browser.';
  } else if (isWebMSupported && !isMp4Supported) {
    recommendedFormat = 'webm';
    reason = 'WebM (VP9/VP8) is the natively supported video container in your browser.';
  } else if (isWebMSupported && isMp4Supported) {
    if (isSafari) {
      recommendedFormat = 'mp4';
      reason = 'MP4 (H.264) is optimized for Apple Safari and macOS hardware playback.';
    } else if (isChromeOrEdge) {
      recommendedFormat = 'webm';
      reason = 'WebM (VP9) provides the highest compression efficiency and speed in Chrome/Edge.';
    } else if (isFirefox) {
      recommendedFormat = 'webm';
      reason = 'WebM is the primary high-performance container in Mozilla Firefox.';
    } else {
      recommendedFormat = 'webm';
      reason = 'WebM is suggested for optimal streaming and encoding balance.';
    }
  } else {
    recommendedFormat = 'webm';
    reason = 'WebM default container.';
  }

  return {
    recommendedFormat,
    reason,
    isAutoSuggested: true,
    webm: {
      supported: isWebMSupported,
      preferredMime: webmMime,
      codecsLabel: webmMime?.includes('vp9')
        ? 'VP9 · Opus'
        : webmMime?.includes('vp8')
        ? 'VP8 · Opus'
        : 'WebM Default',
    },
    mp4: {
      supported: isMp4Supported,
      preferredMime: mp4Mime,
      codecsLabel: mp4Mime?.includes('avc1')
        ? 'H.264 · AAC'
        : 'MP4 Standard',
    },
  };
}

export function getBestMimeType(targetFormat: VideoFormat): { mimeType: string; isFallback: boolean; extension: VideoFormat } {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return { mimeType: 'video/webm', isFallback: false, extension: 'webm' };
  }

  const preferredCandidates = targetFormat === 'mp4' ? MP4_MIME_CANDIDATES : WEBM_MIME_CANDIDATES;
  for (const mime of preferredCandidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return { mimeType: mime, isFallback: false, extension: targetFormat };
    }
  }

  // Graceful fallback if preferred format is unsupported on this browser
  const fallbackCandidates = targetFormat === 'mp4' ? WEBM_MIME_CANDIDATES : MP4_MIME_CANDIDATES;
  for (const mime of fallbackCandidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      const ext: VideoFormat = mime.includes('mp4') ? 'mp4' : 'webm';
      return { mimeType: mime, isFallback: true, extension: ext };
    }
  }

  return { mimeType: 'video/webm', isFallback: false, extension: 'webm' };
}

export function useScreenRecorder(): UseScreenRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Automatically suggest the most compatible container format based on MediaRecorder.isTypeSupported
  const recommendation = useMemo(() => getAutoFormatRecommendation(), []);
  const [format, setFormat] = useState<VideoFormat>(() => recommendation.recommendedFormat);
  const [actualFormat, setActualFormat] = useState<VideoFormat>(() => recommendation.recommendedFormat);

  const actualFormatRef = useRef<VideoFormat>(recommendation.recommendedFormat);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const elapsedIntervalRef = useRef<number | null>(null);
  const pauseDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Clean up on unmount & on beforeunload — security: release all media tracks and blobs
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setMediaStream(null);
      setIsRecording(false);
      setIsPaused(false);
      setHasRecording(false);
      setRecordingBlob(null);
    };
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const startElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    startTimeRef.current = Date.now();
    pauseDurationRef.current = 0;
    pauseStartTimeRef.current = 0;
    isPausedRef.current = false;
    setElapsedTime(0);

    elapsedIntervalRef.current = window.setInterval(() => {
      if (isPausedRef.current) {
        return;
      }
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - startTimeRef.current - pauseDurationRef.current) / 1000));
      setElapsedTime(elapsed);
    }, 250);
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMediaStream(null);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    stopElapsedTimer();
    setIsRecording(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setElapsedTime(0);
    setHasRecording(false);
    setRecordingBlob(null);
  }, [stopElapsedTimer]);

  const startRecording = useCallback(async (sourceType: 'screen' | 'window' | 'tab' = 'screen') => {
    setError(null);
    chunksRef.current = [];

    // Security & Environment validation
    if (typeof window === 'undefined' || !navigator?.mediaDevices) {
      setError('Media capture is not supported in this browser environment or requires an HTTPS connection.');
      return;
    }

    if (!navigator.mediaDevices.getDisplayMedia) {
      setError('Screen recording is not supported in this browser. Please use Chrome, Edge, Firefox, or Safari.');
      return;
    }

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        stopStream();
      }

      const videoHints = {
        cursor: 'always',
        displaySurfaceFallback: 'window',
      } as unknown as MediaTrackConstraints;

      let stream: MediaStream | null = null;

      if (sourceType === 'screen' || sourceType === 'window' || sourceType === 'tab') {
        try {
          // Attempt capture with system audio first
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: videoHints,
            audio: true,
          });
        } catch (captureErr) {
          // If capture failed due to audio constraints or audio device absence, retry with video only
          if (captureErr instanceof Error && captureErr.name !== 'NotAllowedError' && captureErr.name !== 'AbortError') {
            stream = await navigator.mediaDevices.getDisplayMedia({
              video: videoHints,
              audio: false,
            });
          } else {
            throw captureErr;
          }
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      }

      if (!stream) {
        throw new Error('No media stream received');
      }

      streamRef.current = stream;
      setMediaStream(stream);

      const { mimeType, extension } = getBestMimeType(format);
      actualFormatRef.current = extension;
      setActualFormat(extension);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps for high quality
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopElapsedTimer();
        setIsRecording(false);
        setIsPaused(false);
        isPausedRef.current = false;
        pauseDurationRef.current = 0;
        pauseStartTimeRef.current = 0;

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setMediaStream(null);

        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setRecordingBlob(blob);
          setHasRecording(true);
        }
      };

      recorder.onerror = (event) => {
        setError(`Recording error: ${event.type}`);
        stopElapsedTimer();
        setIsRecording(false);
        setIsPaused(false);
        isPausedRef.current = false;
      };

      // Listen for user stopping share from browser UI bar
      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
      }

      // Start recording with 1-second intervals for chunk collection
      recorder.start(1000);
      setIsRecording(true);
      startElapsedTimer();
    } catch (err: unknown) {
      stopElapsedTimer();
      setIsRecording(false);
      setIsPaused(false);
      isPausedRef.current = false;

      if (err instanceof Error) {
        // User cancelled display media picker dialog or pressed Escape
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'AbortError' ||
          err.message.toLowerCase().includes('permission denied')
        ) {
          // Graceful return to standby without showing an alarming error banner
          setError(null);
          return;
        }
        setError(err.message || 'Failed to start screen recording.');
      } else {
        setError('An unexpected error occurred while starting screen recording.');
      }
    }
  }, [format, startElapsedTimer, stopElapsedTimer, stopStream]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.pause();
      setIsPaused(true);
      isPausedRef.current = true;
      pauseStartTimeRef.current = Date.now();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'paused') {
      recorder.resume();
      setIsPaused(false);
      isPausedRef.current = false;
      if (pauseStartTimeRef.current > 0) {
        pauseDurationRef.current += Date.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = 0;
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
      recorder.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setMediaStream(null);
      stopElapsedTimer();
      setIsRecording(false);
      setIsPaused(false);
      isPausedRef.current = false;
      return chunksRef.current.length > 0
        ? new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        : null;
    }
    return null;
  }, [stopElapsedTimer]);

  const downloadRecording = useCallback(() => {
    if (!recordingBlob) return;

    const ext = actualFormatRef.current || actualFormat || 'webm';
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordingBlob, actualFormat]);

  return {
    isRecording,
    isPaused,
    hasRecording,
    elapsedTime,
    recordingBlob,
    error,
    mediaStream,
    format,
    setFormat,
    actualFormat,
    recommendation,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadRecording,
    stopStream,
  };
}
