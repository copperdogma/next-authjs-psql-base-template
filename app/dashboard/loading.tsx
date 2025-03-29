export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Loading skeleton cards */}
        {[1, 2, 3].map(item => (
          <div key={item} className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
