import React from 'react';

/**
 * LoadingSkeleton Component
 * Animated placeholder rows for table/list loading states.
 *
 * Props:
 *   rows  {number} — Number of skeleton rows to show (default: 5)
 *   cols  {number} — Number of skeleton columns per row (default: 4)
 */
const LoadingSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
      {/* Header skeleton */}
      <div className="bg-slate-950/40 border-b border-slate-800 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 rounded-full bg-slate-700 animate-pulse" style={{ width: `${Math.floor(Math.random() * 60 + 60)}px` }} />
          ))}
        </div>
      </div>

      {/* Row skeletons */}
      <div className="divide-y divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-3 rounded-full bg-slate-800 animate-pulse"
                style={{
                  width: `${Math.floor(Math.random() * 80 + 40)}px`,
                  animationDelay: `${(rowIndex * cols + colIndex) * 50}ms`
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
