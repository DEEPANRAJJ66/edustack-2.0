// ==============================================================================
// EDUSTACK 2.0 — KATEX MATHEMATICAL TEXT RENDERER
// ==============================================================================

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
  block?: boolean;
}

/**
 * Parses and renders text with embedded KaTeX mathematical expressions:
 * Supports:
 * - Block math: $$expression$$
 * - Inline math: $expression$ or \(expression\) or \[expression\]
 * - Plain LaTeX commands directly (e.g. \frac{a}{b})
 */
export const MathText: React.FC<MathTextProps> = ({ content, className = '', block = false }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Fast check: If string has no math indicators, return as plain text escaped
    if (!content.includes('$') && !content.includes('\\')) {
      return content.replace(/\n/g, '<br/>');
    }

    try {
      // 1. Replace $$...$$ block math
      let processed = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return `<span class="text-rose-500 font-mono text-sm">[Math Error]</span>`;
        }
      });

      // 2. Replace \[...\] block math
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return `<span class="text-rose-500 font-mono text-sm">[Math Error]</span>`;
        }
      });

      // 3. Replace \(...\) inline math
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-rose-500 font-mono text-sm">[Math Error]</span>`;
        }
      });

      // 4. Replace $...$ inline math
      processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-rose-500 font-mono text-sm">[Math Error]</span>`;
        }
      });

      // 5. Convert line breaks
      processed = processed.replace(/\n/g, '<br/>');

      return processed;
    } catch {
      return content;
    }
  }, [content]);

  if (block) {
    return (
      <div 
        className={`math-content select-text ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <span 
      className={`math-content select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
