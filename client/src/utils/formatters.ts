// ==============================================================================
// EDUSTACK 2.0 — FORMATTING UTILITIES
// ==============================================================================

/**
 * Formats seconds into HH:MM:SS or MM:SS for CBT timer and analysis.
 */
export function formatSecondsToTimer(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats time spent for question analysis (e.g., "2m 15s" or "45s")
 */
export function formatDurationHuman(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Returns ordinal attempt label, e.g. 1 -> "#1 First Attempt", 2 -> "#2 Second Attempt"
 */
export function getAttemptLabel(attemptNumber: number): string {
  const ordinals = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  const name = ordinals[attemptNumber] || `${attemptNumber}th`;
  return `#${attemptNumber} ${name} Attempt`;
}

/**
 * Formats ISO date string to readable format
 */
export function formatReadableDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
