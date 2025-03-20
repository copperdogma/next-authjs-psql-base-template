export default function GlobalLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
} 