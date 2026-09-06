// ==============================================================================
// EDUSTACK 2.0 — SVG DIAGRAM VIEWER
// ==============================================================================

import React from 'react';

interface SvgViewerProps {
  svgContent?: string;
  title?: string;
  className?: string;
}

export const SvgViewer: React.FC<SvgViewerProps> = ({ svgContent, title, className = '' }) => {
  if (!svgContent) return null;

  return (
    <div className={`my-4 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {title}
        </span>
      )}
      <div 
        className="w-full flex justify-center items-center [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }} 
      />
    </div>
  );
};
