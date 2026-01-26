/**
 * useAlerts - Real-time alerts from Firestore
 * 
 * Provides active and historical alerts with acknowledgment support.
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SensorReading } from './useDeviceState';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 
  | 'water_low'
  | 'water_empty'
  | 'temp_high'
  | 'temp_low'
  | 'humidity_high'
  | 'humidity_low'
  | 'sensor_failure'
  | 'pump_failure'
  | 'offline';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  explanation: string | null;
  suggestedAction: string | null;
  triggeredAt: number;
  acknowledgedAt: number | null;
  resolvedAt: number | null;
  readingSnapshot: SensorReading | null;
}

interface UseAlertsResult {
  alerts: Alert[];
  activeAlerts: Alert[];
  criticalAlert: Alert | null;
  loading: boolean;
  error: Error | null;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

export function useAlerts(deviceId: string | null | undefined): UseAlertsResult {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `devices/${deviceId}/alerts`),
      orderBy('triggeredAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alertList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Alert[];
        setAlerts(alertList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Alerts subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deviceId]);

  // Filter active (unresolved) alerts
  const activeAlerts = alerts.filter((a) => !a.resolvedAt);
  
  // Find most recent critical alert
  const criticalAlert = activeAlerts.find((a) => a.severity === 'critical') || null;

  // Acknowledge an alert
  const acknowledgeAlert = async (alertId: string) => {
    if (!deviceId) return;
    
    const alertRef = doc(db, `devices/${deviceId}/alerts/${alertId}`);
    await updateDoc(alertRef, {
      acknowledgedAt: Date.now(),
    });
  };

  return { alerts, activeAlerts, criticalAlert, loading, error, acknowledgeAlert };
}

/**
 * Get severity color for styling
 */
export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'amber';
    case 'info':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Format alert timestamp
 */
export function formatAlertTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (60 * 1000));
  
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
