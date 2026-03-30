import { Skeleton } from "@/components/ui/skeleton";

export default function AdsLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4">
        <Skeleton className="h-4 w-12 mb-4" />
        <Skeleton className="h-8 w-96 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex-1 min-h-0 px-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 h-full">
          <div className="flex flex-col gap-4">
            <Skeleton className="flex-1 rounded-xl min-h-[200px]" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="flex-1 rounded-xl min-h-[200px]" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
