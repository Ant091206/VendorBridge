import React from 'react';

const block = 'animate-pulse rounded-[24px] bg-slate-200/80';

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className={`${block} h-52`} />
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <div className={`${block} h-36`} />
      <div className={`${block} h-36`} />
      <div className={`${block} h-36`} />
      <div className={`${block} h-36`} />
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      <div className={`${block} h-80`} />
      <div className={`${block} h-80`} />
    </div>
  </div>
);

export default DashboardSkeleton;
