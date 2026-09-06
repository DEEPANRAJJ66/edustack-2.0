// ==============================================================================
// EDUSTACK 2.0 — STRICT NUMERICAL ANSWER TYPE (NAT) VALIDATION
// ==============================================================================

/**
 * Strict NAT Regex:
 * Allows only non-negative integers or decimal numbers.
 * The '-' character is strictly forbidden.
 * Examples valid: "5", "5.25", "0.5", "125.75"
 * Examples invalid: "-5", "12a", "5+2", "5-2", "abc", "12 50", "5.2.5", "."
 */
export const STRICT_NAT_REGEX = /^\d+(\.\d+)?$/;

/**
 * Regex for checking partially typed valid NAT input in real-time.
 * Allows trailing dot while user is typing (e.g. "5.") or leading dot (".5" -> normalized to "0.5").
 */
export const PARTIAL_NAT_TYPING_REGEX = /^(\d+(\.\d*)?|\.\d+)?$/;

/**
 * Validates whether a string is a complete, well-formed final NAT value.
 */
export function isValidFinalNat(value: string | undefined | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return STRICT_NAT_REGEX.test(trimmed);
}

/**
 * Validates clipboard content for strict paste behavior.
 * RULE: Pasting invalid content must NOT silently change the student's intended answer
 * into a different numerical value (e.g., "12a50" must NOT become "1250").
 * Returns TRUE if paste content is strictly valid, FALSE if it should be rejected.
 */
export function isValidNatPaste(pastedText: string, currentValue: string = ''): boolean {
  if (!pastedText) return false;
  const trimmed = pastedText.trim();
  
  // Must only contain digits and at most one dot, absolutely no negative sign or letters
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(trimmed)) {
    return false;
  }

  // Combined result check: If current input already has a dot, pasted text cannot also have a dot
  if (currentValue.includes('.') && trimmed.includes('.')) {
    return false;
  }

  return true;
}

/**
 * Normalizes valid numerical input on blur or before saving.
 * e.g., "5." -> "5", ".5" -> "0.5", "005" -> "5" (while keeping decimals intact).
 */
export function normalizeNatValue(value: string): string {
  if (!value) return '';
  let trimmed = value.trim();

  // Normalize ".5" to "0.5"
  if (trimmed.startsWith('.')) {
    trimmed = '0' + trimmed;
  }

  // Normalize "5." to "5"
  if (trimmed.endsWith('.')) {
    trimmed = trimmed.slice(0, -1);
  }

  // If after normalization it doesn't match final strict regex, return empty string
  if (!STRICT_NAT_REGEX.test(trimmed)) {
    return '';
  }

  return trimmed;
}
