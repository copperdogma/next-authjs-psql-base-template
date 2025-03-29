export default function ProfileLoading() {
  return (
    <div className="container mx-auto p-6 animate-pulse">
      <div className="h-8 w-48 bg-accent rounded mb-8"></div>

      <div className="rounded-lg border border-accent bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center space-y-6 md:flex-row md:items-start md:space-x-8 md:space-y-0">
          {/* Profile Image Skeleton */}
          <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-accent">
            <div className="h-full w-full bg-accent"></div>
          </div>

          {/* Profile Information Skeleton */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="h-4 w-24 bg-accent rounded mb-2"></div>
              <div className="h-6 w-48 bg-accent rounded"></div>
            </div>

            <div>
              <div className="h-4 w-24 bg-accent rounded mb-2"></div>
              <div className="h-6 w-64 bg-accent rounded"></div>
            </div>

            <div>
              <div className="h-4 w-24 bg-accent rounded mb-2"></div>
              <div className="h-6 w-16 bg-accent rounded"></div>
            </div>

            <div className="pt-4">
              <div className="h-10 w-24 bg-accent rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
