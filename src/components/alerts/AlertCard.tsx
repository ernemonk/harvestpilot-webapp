/**
 * AlertCard - Individual alert display with acknowledgment
 */

import { useState } from 'react';
import type { Alert } from '../../hooks/useAlerts';
import { formatAlertTime } from '../../hooks/useAlerts';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => Promise<void>;
}

export function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    if (!onAcknowledge || alert.acknowledgedAt) return;
    setAcknowledging(true);
    try {
      await onAcknowledge(alert.id);
    } finally {
      setAcknowledging(false);
    }
  };

  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          icon: '🔴',
          iconBg: 'bg-red-100',
        };
      case 'warning':
        return {
          border: 'border-amber-200',
          bg: 'bg-amber-50',
          icon: '🟡',
          iconBg: 'bg-amber-100',
        };
      default:
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          icon: '🔵',
          iconBg: 'bg-blue-100',
        };
    }
  };

  const styles = getSeverityStyles();
  const isResolved = !!alert.resolvedAt;
  const isAcknowledged = !!alert.acknowledgedAt;

  return (
    <div 
      className={`rounded-lg border ${styles.border} ${
        isResolved ? 'opacity-60' : ''
      }`}
    >
      <div className={`p-4 ${styles.bg} rounded-t-lg`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              {styles.icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{alert.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatAlertTime(alert.triggeredAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isResolved && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Resolved
              </span>
            )}
            {isAcknowledged && !isResolved && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Acknowledged
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Expandable details */}
      <div className="p-4 bg-white rounded-b-lg">
        {(alert.explanation || alert.suggestedAction) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2"
          >
            {expanded ? '▼ Hide details' : '▶ Show details'}
          </button>
        )}
        
        {expanded && (
          <div className="space-y-3 mt-2">
            {alert.explanation && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 uppercase">Why this happened</h5>
                <p className="text-sm text-gray-700 mt-1">{alert.explanation}</p>
              </div>
            )}
            
            {alert.suggestedAction && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 uppercase">What to do</h5>
                <p className="text-sm text-gray-700 mt-1">{alert.suggestedAction}</p>
              </div>
            )}
            
            {alert.readingSnapshot && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 uppercase">Sensor readings at time of alert</h5>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span>🌡️ {Math.round(alert.readingSnapshot.temperature)}°F</span>
                  <span>💧 {Math.round(alert.readingSnapshot.humidity)}%</span>
                  <span>💦 {Math.round(alert.readingSnapshot.waterLevel)}%</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!isResolved && !isAcknowledged && onAcknowledge && (
          <button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        )}
      </div>
    </div>
  );
}
