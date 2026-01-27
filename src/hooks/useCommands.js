/**
 * useCommands - Send commands to device via Firestore
 *
 * Commands are written to Firestore, polled by device every 30 seconds.
 */
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
// Generate a UUID using crypto API
const generateId = () => {
    return crypto.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
};
export function useCommands(deviceId) {
    const [sending, setSending] = useState(false);
    const [lastError, setLastError] = useState(null);
    const sendCommand = async (type, payload = {}) => {
        if (!deviceId) {
            throw new Error('No device ID');
        }
        setSending(true);
        setLastError(null);
        try {
            await addDoc(collection(db, `devices/${deviceId}/commands`), {
                id: generateId(),
                type,
                payload,
                issuedAt: Date.now(),
                status: 'pending',
                executedAt: null,
                errorMessage: null,
            });
        }
        catch (err) {
            setLastError(err);
            throw err;
        }
        finally {
            setSending(false);
        }
    };
    // Convenience methods
    const pumpOn = (durationSeconds) => sendCommand('pump_on', { duration_seconds: durationSeconds });
    const pumpOff = () => sendCommand('pump_off');
    const lightsOn = () => sendCommand('lights_on');
    const lightsOff = () => sendCommand('lights_off');
    const lightsBrightness = (brightness) => sendCommand('lights_brightness', { brightness });
    const setAutopilot = (mode) => sendCommand('set_autopilot_mode', { mode });
    const emergencyStop = () => sendCommand('emergency_stop');
    return {
        sending,
        lastError,
        sendCommand,
        pumpOn,
        pumpOff,
        lightsOn,
        lightsOff,
        lightsBrightness,
        setAutopilot,
        emergencyStop,
    };
}
