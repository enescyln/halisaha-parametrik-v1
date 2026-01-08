
import React from 'react';

export const THEME = {
  primary: '#10b981', // emerald-500
  secondary: '#059669', // emerald-600
  background: '#f3f4f6',
  error: '#ef4444',
  warning: '#f59e0b',
};

export const Icons = {
  Soccer: (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m6.7 6.7 2.6 2.6" />
      <path d="m14.7 14.7 2.6 2.6" />
      <path d="m6.7 17.3 2.6-2.6" />
      <path d="m14.7 9.3 2.6-2.6" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.9 19.1l2.8-2.8" />
      <path d="M16.3 7.7l2.8-2.8" />
    </svg>
  )
};
