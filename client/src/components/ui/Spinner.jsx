// client/src/components/ui/Spinner.jsx
import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-primary border-r-transparent border-b-primary/30 border-l-primary/30 ${sizes[size] || sizes.md}`}
        role="status"
      />
    </div>
  );
}
