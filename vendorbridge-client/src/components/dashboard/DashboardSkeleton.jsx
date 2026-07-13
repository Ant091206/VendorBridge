import React from 'react';

const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-6 w-52 rounded" />
      <div className="skeleton h-4 w-72 rounded" />
    </div>

    {/* KPI cards */}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-8 rounded-[6px]" />
          </div>
          <div className="skeleton h-7 w-20 rounded" />
          <div className="skeleton h-3 w-32 rounded mt-2" />
        </div>
      ))}
    </div>

    {/* Content panels */}
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-5">
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="skeleton h-12 w-full" style={{ borderRadius: 0 }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-[#F3F4F6]">
              <div className="skeleton h-4 flex-1 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-5 w-16 rounded-[4px]" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-xl">
        <div className="skeleton h-12 w-full" style={{ borderRadius: '12px 12px 0 0' }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 border-t border-[#F3F4F6]">
            <div className="skeleton h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-full rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
