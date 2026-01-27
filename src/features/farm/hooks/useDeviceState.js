/**
 * useDeviceState - Real-time device state from Firestore
 *
 * Subscribes to the device document and provides live updates.
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
export function useDeviceState(deviceId) {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!deviceId) {
            setLoading(false);
            return;
        }
        const docRef = doc(db, 'devices', deviceId);
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                // Convert Firestore Timestamps to milliseconds
                const convertedData = {
                    ...data,
                    lastHeartbeat: data.lastHeartbeat?.toMillis?.() ?? data.lastHeartbeat ?? Date.now(),
                    lastSyncAt: data.lastSyncAt?.toMillis?.() ?? data.lastSyncAt ?? null,
                    currentReading: data.currentReading ? {
                        ...data.currentReading,
                        timestamp: data.currentReading.timestamp?.toMillis?.() ?? data.currentReading.timestamp ?? Date.now()
                    } : null,
                    cropConfig: data.cropConfig ? {
                        ...data.cropConfig,
                        plantedAt: data.cropConfig.plantedAt?.toMillis?.() ?? data.cropConfig.plantedAt ?? Date.now()
                    } : null
                };
                setState(convertedData);
            }
            else {
                setState(null);
            }
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error('Device state subscription error:', err);
            setError(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [deviceId]);
    return { state, loading, error };
}
/**
 * Helper: Check if device is online based on heartbeat
 */
export function isDeviceOnline(state, maxAgeMs = 5 * 60 * 1000) {
    if (!state)
        return false;
    const age = Date.now() - state.lastHeartbeat;
    return age < maxAgeMs;
}
/**
 * Helper: Get time since last heartbeat
 */
export function getTimeSinceHeartbeat(state) {
    if (!state)
        return 'Unknown';
    const ageMs = Date.now() - state.lastHeartbeat;
    const ageMin = Math.floor(ageMs / (60 * 1000));
    if (ageMin < 1)
        return 'Just now';
    if (ageMin < 60)
        return `${ageMin}m ago`;
    const ageHours = Math.floor(ageMin / 60);
    if (ageHours < 24)
        return `${ageHours}h ago`;
    const ageDays = Math.floor(ageHours / 24);
    return `${ageDays}d ago`;
}
