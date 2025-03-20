import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h2 className="mb-2 text-3xl font-bold">404</h2>
      <h3 className="mb-6 text-xl">Page Not Found</h3>
      <p className="mb-8 max-w-md text-gray-500">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
      >
        Return to Home
      </Link>
    </div>
  );
} 