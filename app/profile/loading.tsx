export default function ProfileLoading() {
  return (
    <div className="container mx-auto p-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-8 dark:bg-gray-700"></div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-center space-y-6 md:flex-row md:items-start md:space-x-8 md:space-y-0">
          {/* Profile Image Skeleton */}
          <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-gray-200">
            <div className="h-full w-full bg-gray-300 dark:bg-gray-600"></div>
          </div>
          
          {/* Profile Information Skeleton */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2 dark:bg-gray-700"></div>
              <div className="h-6 w-48 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
            
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2 dark:bg-gray-700"></div>
              <div className="h-6 w-64 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
            
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2 dark:bg-gray-700"></div>
              <div className="h-6 w-16 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>

            <div className="pt-4">
              <div className="h-10 w-24 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 