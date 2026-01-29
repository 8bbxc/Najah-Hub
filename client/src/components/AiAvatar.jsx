import React from 'react';

export default function AiAvatar({ size = 32, className = '' }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  return (
    <div className={`ai-core inline-flex items-center justify-center rounded-full ${className}`} style={{ width: s, height: s }} aria-hidden>
      <div className="ai-core-inner" />
    </div>
  );
}
