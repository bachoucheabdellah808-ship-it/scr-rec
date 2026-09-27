/**
 * Formats seconds into hours, minutes, seconds and string representations.
 */
export interface TimeComponents {
  hours: string;
  minutes: string;
  seconds: string;
  formattedText: string;
}

export function formatTimeComponents(totalSeconds: number): TimeComponents {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  const hoursStr = hrs.toString().padStart(2, '0');
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');

  const formattedText = hrs > 0
    ? `${hoursStr}:${minsStr}:${secsStr}`
    : `${minsStr}:${secsStr}`;

  return {
    hours: hoursStr,
    minutes: minsStr,
    seconds: secsStr,
    formattedText,
  };
}
