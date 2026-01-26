export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="px-4 py-6 sm:px-0 flex justify-center items-center min-h-screen">
      <div className="text-lg text-gray-600">{message}</div>
    </div>
  );
}
