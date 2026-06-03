// client/src/components/ui/ProgressBar.jsx
import React from 'react';

export function ProgressBar({ value = 0, label = '', showGlow = true }) {
  const roundedVal = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {(label || value !== undefined) && (
        <div className="flex items-center justify-between text-xs font-bold text-white/50 tracking-wider">
          <span>{label}</span>
          <span className="text-primary-hover">{roundedVal}%</span>
        </div>
      )}
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden premium-border relative">
        {/* Animated Progress Layer */}
        <div
          className={`bg-primary h-full rounded-full transition-all duration-300 ${
            showGlow ? 'shadow-glow' : ''
          }`}
          style={{ width: `${roundedVal}%` }}
        />
      </div>
    </div>
  );
}
