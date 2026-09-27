# Screen Recorder SaaS

A private, client-side Screen Recorder built with React 19, TypeScript, and Vite. Record your entire screen, an application window, or a browser tab entirely inside the browser without third-party uploads, account requirements, or tracking.

![Screen Recorder Preview](src/assets/hero.png)

---

## Key Features

- **100% Client-Side Privacy**: Video processing and encoding run entirely within your local browser sandbox via the HTML5 `MediaStream` and `MediaRecorder` APIs. Nothing is ever uploaded to remote servers.
- **Smart Container Auto-Recommendation**:
  - Automatically queries `MediaRecorder.isTypeSupported` to detect browser-native codecs and recommend the optimal container format (**WebM** for Chromium/Firefox, **MP4** for Safari / Apple Silicon).
  - One-click format switcher with codec diagnostics (`VP9 · Opus` vs. `H.264 · AAC`).
- **Real-Time Visual Timer HUD**:
  - Floating live preview timer overlay with pulsing recording status.
  - Multi-segmented monospace console display (Hours : Minutes : Seconds).
  - Active 60-second progression ring and live estimated file size calculator.
- **Ergonomic Keyboard Shortcuts**:
  - `Alt + R` / `Option + R`: Start or stop recording
  - `Alt + P` / `Option + P` or `Space`: Pause and resume recording
  - `Alt + S` / `Option + S`: Finish recording
  - `Alt + D` / `Option + D`: Download WebM/MP4 recording file
  - `?`: Open shortcut cheat-sheet modal
  - `Esc`: Dismiss modal or reset session
- **Professional Scrolling Experience**:
  - Custom dark-mode slim scrollbars with soft accent glow on hover.
  - Viewport-aware layout without flexbox top-clipping.
  - Contextual auto-scroll to the preview HUD on start, and to the download console upon completion.
  - Floating smooth "Back to Top" control.
- **Robust Hardware & Memory Safety**:
  - Full Blob URL lifecycle management with automatic cleanup to prevent memory leaks.
  - Graceful cancellation handling for display picker dialogs.
  - Safe multi-stage system audio fallback to video capture if system audio is not available.
  - Immediate `MediaStreamTrack` disposal on `beforeunload` to prevent lingering capture indicators.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vite.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)
- **Styling**: Pure modern CSS with custom design tokens, backdrop filters, and CSS animations.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `yarn` or `pnpm`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/screen-recorder-saas.git

# 2. Navigate to project root
cd screen-recorder-saas

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## Build & Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

---

## Browser Support

| Browser | Screen / Tab Capture | WebM (VP9/Opus) | MP4 (H.264/AAC) |
|---|---|---|---|
| Google Chrome | Full | Native | Supported |
| Microsoft Edge | Full | Native | Supported |
| Mozilla Firefox | Full | Native | Fallback to WebM |
| Apple Safari (macOS) | Full | Supported | Native |

---

## License

MIT License — Feel free to use and customize for personal or commercial projects.
