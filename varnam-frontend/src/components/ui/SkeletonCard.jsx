import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white p-0 shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square w-full bg-neutral-200" />
      
      {/* Text Blocks */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        <div className="h-3 w-1/4 rounded bg-neutral-200" />
        <div className="h-5 w-3/4 rounded bg-neutral-200" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded bg-neutral-200" />
          <div className="h-3.5 w-5/6 rounded bg-neutral-200" />
        </div>
        
        {/* Footer Base Skeleton */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-50">
          <div className="space-y-1">
            <div className="h-3 w-8 rounded bg-neutral-200" />
            <div className="h-4 w-14 rounded bg-neutral-200" />
          </div>
          <div className="h-8 w-14 rounded-xl bg-neutral-200" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;