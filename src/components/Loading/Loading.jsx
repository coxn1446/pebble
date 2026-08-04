import React from 'react';

const Loading = ({ label = 'Loading…' }) => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted animate-soft-pulse">
    {label}
  </div>
);

export default Loading;
