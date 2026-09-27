import React, { useMemo } from 'react';
import type { VideoFormat, AutoFormatRecommendation } from '../hooks/useScreenRecorder';
import { getAutoFormatRecommendation } from '../hooks/useScreenRecorder';
import './FormatSelector.css';

export interface FormatSelectorProps {
  selectedFormat: VideoFormat;
  onSelectFormat: (format: VideoFormat) => void;
  recommendation?: AutoFormatRecommendation;
  disabled?: boolean;
}

interface FormatOption {
  format: VideoFormat;
  name: string;
  ext: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: 'webm',
    name: 'WebM',
    ext: '.webm',
    description: 'Ultra-fast capture with VP9/Opus compression. Plays instantly in all modern web browsers.',
  },
  {
    format: 'mp4',
    name: 'MP4',
    ext: '.mp4',
    description: 'Universal H.264/AAC standard. Maximum compatibility with video editors, QuickTime, and mobile.',
  },
];

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onSelectFormat,
  recommendation: propRecommendation,
  disabled = false,
}) => {
  const recommendation = useMemo(() => {
    return propRecommendation || getAutoFormatRecommendation();
  }, [propRecommendation]);

  return (
    <div className="format-selector-container">
      <div className="format-selector-header">
        <span className="format-selector-label">Recording Container Format</span>
        <span className="format-selector-help">Auto-configured for your browser</span>
      </div>

      {/* Auto-suggested recommendation banner */}
      <div className="format-rec-banner" role="status">
        <div className="format-rec-text">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>
            Auto-suggested: <strong>{recommendation.recommendedFormat.toUpperCase()}</strong> — {recommendation.reason}
          </span>
        </div>
        {selectedFormat !== recommendation.recommendedFormat && !disabled && (
          <button
            type="button"
            className="format-rec-action"
            onClick={() => onSelectFormat(recommendation.recommendedFormat)}
            title={`Switch back to suggested ${recommendation.recommendedFormat.toUpperCase()}`}
          >
            Use Suggested
          </button>
        )}
      </div>

      <div
        className="format-options-grid"
        role="radiogroup"
        aria-label="Video recording format"
      >
        {FORMAT_OPTIONS.map((opt) => {
          const isSelected = selectedFormat === opt.format;
          const isRecommended = recommendation.recommendedFormat === opt.format;
          const formatInfo = recommendation[opt.format];
          const isSupported = formatInfo.supported;

          return (
            <button
              key={opt.format}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              className={`format-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectFormat(opt.format)}
            >
              <div className="format-card-top">
                <div className="format-name-badge">
                  <span className="format-title">{opt.name}</span>
                  <span className="format-ext-tag">{opt.ext}</span>
                </div>
                <div className="format-card-top-right">
                  {isRecommended && (
                    <span className="format-rec-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Suggested
                    </span>
                  )}
                  <div className="format-check-icon" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="format-desc">{opt.description}</p>

              <div className={`format-compat-badge ${isSupported ? 'supported' : 'fallback'}`}>
                <span className="format-compat-dot" />
                <span>
                  {isSupported
                    ? `Native Engine · ${formatInfo.codecsLabel}`
                    : `Fallback container (transcoded or WebM)`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
