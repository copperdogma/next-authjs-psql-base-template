import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="container mx-auto p-6 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Dashboard Page Not Found
      </h2>
      <p className="text-gray-600 mb-6">
        The dashboard page you requested doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href="/dashboard"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 