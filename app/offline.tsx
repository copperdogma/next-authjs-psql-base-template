export default function Offline() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">You are offline</h1>
      <p className="text-xl mb-6">Please check your internet connection and try again.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
