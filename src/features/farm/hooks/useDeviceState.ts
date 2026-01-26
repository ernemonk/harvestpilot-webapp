/**
 * useDeviceState - Real-time device state from Firestore
 * 
 * Subscribes to the device document and provides live updates.
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

// Types from contracts (inline for now, will be imported from schema)
export interface SensorReading {
  timestamp: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  waterLevel: number;
  lightOn: boolean;
  pumpOn: boolean;
}

export interface CropConfig {
  cropType: string;
  plantedAt: number;
  expectedHarvestDays: number;
  lightOnHour: number;
  lightOffHour: number;
  irrigationIntervalHours: number;
  irrigationDurationSeconds: number;
  tempTargetMin: number;
  tempTargetMax: number;
  humidityTargetMin: number;
  humidityTargetMax: number;
}

export type DeviceStatus = 'online' | 'offline' | 'error';
export type AutopilotMode = 'on' | 'off' | 'paused';

export interface DeviceState {
  deviceId: string;
  ownerId: string;
  status: DeviceStatus;
  autopilotMode: AutopilotMode;
  lastHeartbeat: number;
  lastSyncAt: number | null;
  currentReading: SensorReading | null;
  cropConfig: CropConfig | null;
  failsafeTriggered: boolean;
  failsafeReason: string | null;
  firmwareVersion: string;
  lightsOn: boolean;
  lastIrrigationAt: number | null;
  nextIrrigationAt: number | null;
}

interface UseDeviceStateResult {
  state: DeviceState | null;
  loading: boolean;
  error: Error | null;
}

export function useDeviceState(deviceId: string | null | undefined): UseDeviceStateResult {
  const [state, setState] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'devices', deviceId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setState(snapshot.data() as DeviceState);
        } else {
          setState(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Device state subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deviceId]);

  return { state, loading, error };
}

/**
 * Helper: Check if device is online based on heartbeat
 */
export function isDeviceOnline(state: DeviceState | null, maxAgeMs: number = 5 * 60 * 1000): boolean {
  if (!state) return false;
  const age = Date.now() - state.lastHeartbeat;
  return age < maxAgeMs;
}

/**
 * Helper: Get time since last heartbeat
 */
export function getTimeSinceHeartbeat(state: DeviceState | null): string {
  if (!state) return 'Unknown';
  
  const ageMs = Date.now() - state.lastHeartbeat;
  const ageMin = Math.floor(ageMs / (60 * 1000));
  
  if (ageMin < 1) return 'Just now';
  if (ageMin < 60) return `${ageMin}m ago`;
  
  const ageHours = Math.floor(ageMin / 60);
  if (ageHours < 24) return `${ageHours}h ago`;
  
  const ageDays = Math.floor(ageHours / 24);
  return `${ageDays}d ago`;
}
