interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

export default function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex justify-between items-center">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="text-red-800 hover:text-red-900 ml-4">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
