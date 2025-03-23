export default function DashboardSkeleton() {
  return (
    <>
      {[1, 2, 3].map(item => (
        <div
          key={item}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="h-6 w-24 bg-gray-200 rounded mb-4 dark:bg-gray-700"></div>
          <div className="h-4 w-full bg-gray-200 rounded mb-2 dark:bg-gray-700"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      ))}
    </>
  );
}
