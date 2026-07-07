import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ArtistCardSkeleton() {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-950/5 h-[340px] w-full">
      {/* Top Banner Skeleton */}
      <Skeleton className="absolute top-0 left-0 right-0 h-24 rounded-none rounded-t-2xl" />
      
      {/* Profile Image Skeleton */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 rounded-full ring-4 ring-white">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>

      <div className="mt-36 flex flex-1 flex-col px-4 text-center">
        {/* Name and Verification Skeleton */}
        <div className="mb-1 flex items-center justify-center gap-1.5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        {/* Category Badge Skeleton */}
        <div className="mb-4 flex justify-center">
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        {/* Info Grid Skeleton */}
        <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-2 border-t border-stone-100 py-4 pb-5">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtistCardSkeleton;
