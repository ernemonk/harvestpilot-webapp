/**
 * useGPIOActuator - Real-time GPIO actuator control with Firestore sync
 *
 * Manages GPIO pin states, subscribes to Firestore updates, and sends toggles
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
export function useGPIOActuators(deviceId) {
    const [actuators, setActuators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Subscribe to GPIO state from Firestore
    useEffect(() => {
        if (!deviceId) {
            setLoading(false);
            return;
        }
        const deviceRef = doc(db, 'devices', deviceId);
        const unsubscribe = onSnapshot(deviceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const gpioState = data.gpioState || {};
                // Convert Firestore GPIO state to actuators array
                const loadedActuators = Object.entries(gpioState).map(([key, value]) => ({
                    pin: value.pin || 0,
                    bcmPin: parseInt(key),
                    name: value.name || `GPIO${key}`,
                    mode: value.mode || 'output',
                    state: value.state || false,
                    function: value.function,
                    lastUpdated: value.lastUpdated || Date.now(),
                }));
                setActuators(loadedActuators);
            }
            setLoading(false);
        }, (err) => {
            console.error('GPIO state subscription error:', err);
            setError(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [deviceId]);
    // Toggle actuator state in Firestore
    const toggleActuator = async (bcmPin, newState) => {
        if (!deviceId)
            return;
        try {
            const deviceRef = doc(db, 'devices', deviceId);
            const updatePayload = {};
            updatePayload[`gpioState.${bcmPin}.state`] = newState;
            updatePayload[`gpioState.${bcmPin}.lastUpdated`] = Date.now();
            await updateDoc(deviceRef, updatePayload);
            // Optimistically update local state
            setActuators(prev => prev.map(a => a.bcmPin === bcmPin ? { ...a, state: newState, lastUpdated: Date.now() } : a));
        }
        catch (err) {
            console.error('Failed to toggle actuator:', err);
            setError(err);
        }
    };
    // Manual state update (for UI feedback)
    const updateActuatorState = (bcmPin, state) => {
        setActuators(prev => prev.map(a => a.bcmPin === bcmPin ? { ...a, state, lastUpdated: Date.now() } : a));
    };
    return { actuators, loading, error, toggleActuator, updateActuatorState };
}
