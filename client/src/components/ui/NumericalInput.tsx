// ==============================================================================
// EDUSTACK 2.0 — STRICT NUMERICAL INPUT COMPONENT
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { 
  isValidFinalNat, 
  isValidNatPaste, 
  normalizeNatValue, 
  PARTIAL_NAT_TYPING_REGEX 
} from '../../utils/natValidation';

interface NumericalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const NumericalInput: React.FC<NumericalInputProps> = ({
  value,
  onChange,
  onSave,
  disabled = false,
  placeholder = 'Enter numerical answer (e.g. 5.25)',
  className = '',
}) => {
  const [localVal, setLocalVal] = useState(value || '');
  const [rejectedFeedback, setRejectedFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  const showFeedback = (msg: string) => {
    setRejectedFeedback(msg);
    setTimeout(() => setRejectedFeedback(null), 2500);
  };

  /**
   * Keystroke Filter: Intercepts before key reaches the DOM
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Allow standard control keys: Backspace, Tab, Enter, Arrows, Delete, Copy/Select All shortcuts
    if (
      e.key === 'Backspace' ||
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase()))
    ) {
      return;
    }

    // Strictly BLOCK negative sign '-'
    if (e.key === '-') {
      e.preventDefault();
      showFeedback('Negative numbers are not allowed');
      return;
    }

    // Allow at most ONE decimal point
    if (e.key === '.') {
      if (localVal.includes('.')) {
        e.preventDefault();
        showFeedback('Only one decimal point allowed');
      }
      return;
    }

    // Allow ONLY digits 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      showFeedback('Only digits (0-9) and decimal (.) are allowed');
      return;
    }
  };

  /**
   * BeforeInput filter: Extra layer for mobile keyboards and IME
   */
  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement> & { data?: string }) => {
    if (disabled || !e.data) return;

    if (e.data === '-') {
      e.preventDefault();
      showFeedback('Negative numbers are not allowed');
      return;
    }

    if (e.data === '.' && localVal.includes('.')) {
      e.preventDefault();
      showFeedback('Only one decimal point allowed');
      return;
    }

    if (!/^[0-9.]$/.test(e.data)) {
      e.preventDefault();
      showFeedback('Only digits (0-9) and decimal (.) are allowed');
    }
  };

  /**
   * Paste Handler:
   * RULE: Pasting invalid content must NOT silently change the student's intended answer
   * into a different numerical value (e.g. "12a50" must NOT become "1250").
   * The paste action is strictly rejected if invalid.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const pastedText = e.clipboardData.getData('text');
    if (!isValidNatPaste(pastedText, localVal)) {
      e.preventDefault();
      showFeedback(`Paste rejected: "${pastedText.slice(0, 10)}" contains invalid characters`);
      return;
    }

    // If valid, allow default or handle paste
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;

    // Validate partial typing state
    if (PARTIAL_NAT_TYPING_REGEX.test(newVal)) {
      setLocalVal(newVal);
      onChange(newVal);
    }
  };

  const handleBlur = () => {
    const normalized = normalizeNatValue(localVal);
    setLocalVal(normalized);
    onChange(normalized);
    if (onSave) {
      onSave(normalized);
    }
  };

  const isCompleteValid = isValidFinalNat(localVal);

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={localVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBeforeInput={handleBeforeInput as any}
          onPaste={handlePaste}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
          className={`w-full px-4 py-3.5 text-lg font-mono tracking-wide rounded-xl border-2 transition-all duration-200 outline-none
            ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white'}
            ${localVal && isCompleteValid ? 'border-emerald-500 ring-2 ring-emerald-100 text-slate-900' : ''}
            ${localVal && !isCompleteValid ? 'border-amber-400 ring-2 ring-amber-100 text-slate-800' : ''}
            ${!localVal ? 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-900' : ''}
            ${className}`}
        />

        {localVal && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
            {isCompleteValid ? (
              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Valid NAT
              </span>
            ) : (
              <span className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Typing...
              </span>
            )}
          </div>
        )}
      </div>

      {rejectedFeedback && (
        <div className="mt-1.5 text-xs font-medium text-rose-600 flex items-center space-x-1 animate-pulse">
          <span>⚠️ {rejectedFeedback}</span>
        </div>
      )}

      <p className="mt-1.5 text-xs text-slate-500">
        Allowed: digits <span className="font-mono font-semibold text-slate-700">0-9</span> and at most one decimal point <span className="font-mono font-semibold text-slate-700">.</span>
      </p>
    </div>
  );
};
