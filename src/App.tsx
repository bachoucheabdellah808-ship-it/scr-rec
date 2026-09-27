import { useScreenRecorder } from './hooks/useScreenRecorder'
import { RecorderView } from './components/RecorderView'
import './App.css'

function App() {
  const {
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
  } = useScreenRecorder()

  return (
    <RecorderView
      isRecording={isRecording}
      isPaused={isPaused}
      hasRecording={hasRecording}
      elapsedTime={elapsedTime}
      recordingBlob={recordingBlob}
      error={error}
      mediaStream={mediaStream}
      format={format}
      onFormatChange={setFormat}
      actualFormat={actualFormat}
      recommendation={recommendation}
      onStart={(source) => startRecording(source)}
      onPause={pauseRecording}
      onResume={resumeRecording}
      onStop={() => stopRecording()}
      onDownload={downloadRecording}
      onStopStream={stopStream}
    />
  )
}

export default App
