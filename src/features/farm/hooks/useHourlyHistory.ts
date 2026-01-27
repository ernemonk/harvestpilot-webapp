/**
 * useHourlyHistory - Fetch hourly sensor data history from Firestore
 * 
 * Used for trend charts on the dashboard.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface HourlySummary {
  hour: number;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  humidityMin: number;
  humidityMax: number;
  humidityAvg: number;
  soilMoistureAvg: number;
  waterLevelAvg: number;
  lightOnMinutes: number;
  pumpOnMinutes: number;
  readingCount: number;
}

interface UseHourlyHistoryResult {
  data: HourlySummary[];
  loading: boolean;
  error: Error | null;
}

export function useHourlyHistory(
  deviceId: string | null | undefined,
  hours: number = 24
): UseHourlyHistoryResult {
  const [data, setData] = useState<HourlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    
    const q = query(
      collection(db, `devices/${deviceId}/hourly`),
      where('hour', '>=', cutoff),
      orderBy('hour', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const summaries = snapshot.docs.map((doc) => doc.data() as HourlySummary);
        setData(summaries);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Hourly history subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deviceId, hours]);

  return { data, loading, error };
}

/**
 * Format hourly data for chart display
 */
export function formatChartData(data: HourlySummary[]) {
  return data.map((summary) => ({
    time: new Date(summary.hour).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    timestamp: summary.hour,
    temperature: Math.round(summary.tempAvg * 10) / 10,
    tempMin: summary.tempMin,
    tempMax: summary.tempMax,
    humidity: Math.round(summary.humidityAvg * 10) / 10,
    humidityMin: summary.humidityMin,
    humidityMax: summary.humidityMax,
    waterLevel: Math.round(summary.waterLevelAvg),
    irrigationMinutes: summary.pumpOnMinutes,
  }));
}
