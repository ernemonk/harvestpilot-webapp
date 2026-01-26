/**
 * AlertList - List of alerts with filtering
 */

import type { Alert } from '../../hooks/useAlerts';
import { AlertCard } from './AlertCard';

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => Promise<void>;
  emptyMessage?: string;
}

export function AlertList({ 
  alerts, 
  onAcknowledge, 
  emptyMessage = 'No alerts' 
}: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl mb-2 block">✓</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  );
}
