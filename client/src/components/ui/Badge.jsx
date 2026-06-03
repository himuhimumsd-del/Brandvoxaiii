// client/src/components/ui/Badge.jsx
import React from 'react';

export function Badge({
  children,
  variant = 'primary',
  className = ''
}) {
  const styles = {
    primary: 'bg-primary/20 text-primary border border-primary/20',
    secondary: 'bg-white/5 text-white/60 border border-white/5',
    success: 'bg-success/15 text-success border border-success/20',
    error: 'bg-error/15 text-error border border-error/20',
    warning: 'bg-warning/15 text-warning border border-warning/20',
    featured: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xs'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${styles[variant] || styles.primary} ${className}`}
    >
      {children}
    </span>
  );
}
