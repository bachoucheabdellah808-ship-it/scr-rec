import React from 'react';
import type { ShortcutDefinition } from '../hooks/useKeyboardShortcuts';
import './KeyboardShortcutsModal.css';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutDefinition[];
  modKey: string;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
  modKey,
}) => {
  if (!isOpen) return null;

  // Group shortcuts by context
  const grouped = shortcuts.reduce<Record<string, ShortcutDefinition[]>>((acc, item) => {
    const ctx = item.context;
    if (!acc[ctx]) acc[ctx] = [];
    acc[ctx].push(item);
    return acc;
  }, {});

  return (
    <div
      className="shortcuts-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
    >
      <div
        className="shortcuts-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-modal-header">
          <div className="shortcuts-modal-title" id="shortcuts-dialog-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
              <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M6 12h.001M10 12h.001M14 12h.001M18 12h.001M8 16h8"/>
            </svg>
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            className="shortcuts-close-btn"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="shortcuts-modal-body">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName} className="shortcut-group">
              <h4 className="shortcut-group-title">{groupName}</h4>
              <div className="shortcut-list">
                {items.map((item) => (
                  <div key={item.id} className="shortcut-row">
                    <div className="shortcut-info">
                      <span className="shortcut-label">{item.label}</span>
                      <span className="shortcut-description">{item.description}</span>
                    </div>
                    <div className="shortcut-keys">
                      {item.keys.map((k, idx) => (
                        <React.Fragment key={k}>
                          {idx > 0 && <span className="shortcut-keys-plus">+</span>}
                          <kbd className="kbd-chip">{k}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-modal-footer">
          <span>Global shortcuts work anytime this tab is active</span>
          <span>
            Primary modifier: <kbd className="kbd-chip">{modKey}</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};
