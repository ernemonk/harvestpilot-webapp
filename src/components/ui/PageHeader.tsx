interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function PageHeader({ title, actionLabel, onAction }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
      {actionLabel && onAction && (
        <button className="btn-primary w-full sm:w-auto" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
