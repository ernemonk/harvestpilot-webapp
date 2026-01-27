/**
 * useFarmModule - Fetch and subscribe to farm module data
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
export function useFarmModule(moduleId) {
    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!moduleId) {
            setLoading(false);
            return;
        }
        // Subscribe to device document (farm modules map to devices)
        const deviceRef = doc(db, 'devices', moduleId);
        const unsubscribe = onSnapshot(deviceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                // Convert Firebase snake_case fields to camelCase and Timestamps to milliseconds
                const convertedData = {
                    id: snapshot.id,
                    deviceId: data.deviceId || data.config_id || snapshot.id,
                    deviceName: data.deviceName || snapshot.id,
                    name: data.deviceName || snapshot.id,
                    status: data.status || 'offline',
                    ipAddress: data.ip_address || data.ipAddress,
                    macAddress: data.mac_address || data.macAddress,
                    hostname: data.hostname,
                    hardwareSerial: data.hardware_serial || data.hardwareSerial,
                    platform: data.platform,
                    os: data.os,
                    firmwareVersion: data.firmwareVersion || data.firmware_version,
                    lastHeartbeat: data.lastHeartbeat?.toMillis?.() ?? data.lastHeartbeat ?? Date.now(),
                    lastSyncAt: data.lastSyncAt?.toMillis?.() ?? data.lastSyncAt ?? null,
                    initializedAt: data.initialized_at || data.initializedAt,
                    organizationId: data.organizationId || 'default-org',
                    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
                    updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
                };
                setModule(convertedData);
            }
            else {
                setModule(null);
                setError(new Error('Module not found'));
            }
            setLoading(false);
        }, (err) => {
            console.error('Module subscription error:', err);
            setError(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [moduleId]);
    return { module, loading, error };
}
// TODO: Add API integration when backend endpoints are ready
// For now, using Firestore directly. Future: REST API or Firebase Functions
