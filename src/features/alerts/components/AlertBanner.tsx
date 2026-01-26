/**
 * AlertBanner - Critical alert banner at top of dashboard
 */

import type { Alert } from '../../hooks/useAlerts';

interface AlertBannerProps {
  alert: Alert;
  onViewDetails?: () => void;
}

export function AlertBanner({ alert, onViewDetails }: AlertBannerProps) {
  const bgColor = alert.severity === 'critical' 
    ? 'bg-red-600' 
    : alert.severity === 'warning' 
      ? 'bg-amber-500' 
      : 'bg-blue-500';

  return (
    <div className={`${bgColor} text-white px-4 py-3`}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <div>
            <span className="font-semibold">{alert.title}</span>
            <span className="mx-2">—</span>
            <span>{alert.message}</span>
          </div>
        </div>
        
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="px-3 py-1 bg-white/20 rounded text-sm font-medium hover:bg-white/30"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
