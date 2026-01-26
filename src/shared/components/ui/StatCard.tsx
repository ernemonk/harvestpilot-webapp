interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
}

export default function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="card">
      <h3 className="text-xs sm:text-sm font-medium text-gray-500">{label}</h3>
      <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs sm:text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
