/**
 * useCommands - Send commands to device via Firestore
 * 
 * Commands are written to Firestore, polled by device every 30 seconds.
 */

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Generate a UUID using crypto API
const generateId = (): string => {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

export type CommandType =
  | 'pump_on'
  | 'pump_off'
  | 'lights_on'
  | 'lights_off'
  | 'lights_brightness'
  | 'pwm_control'
  | 'set_autopilot_mode'
  | 'update_crop_config'
  | 'emergency_stop'
  | 'reboot';

export type AutopilotMode = 'on' | 'off' | 'paused';

interface UseCommandsResult {
  sending: boolean;
  lastError: Error | null;
  sendCommand: (type: CommandType, payload?: Record<string, unknown>) => Promise<void>;
  pumpOn: (durationSeconds: number) => Promise<void>;
  pumpOff: () => Promise<void>;
  lightsOn: () => Promise<void>;
  lightsOff: () => Promise<void>;
  lightsBrightness: (brightness: number) => Promise<void>;
  pwmControl: (pin: number, dutyCycle: number) => Promise<void>;
  setAutopilot: (mode: AutopilotMode) => Promise<void>;
  emergencyStop: () => Promise<void>;
}

export function useCommands(deviceId: string | null | undefined): UseCommandsResult {
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const sendCommand = async (
    type: CommandType,
    payload: Record<string, unknown> = {}
  ): Promise<void> => {
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
    } catch (err) {
      setLastError(err as Error);
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Convenience methods
  const pumpOn = (durationSeconds: number) =>
    sendCommand('pump_on', { duration_seconds: durationSeconds });

  const pumpOff = () => sendCommand('pump_off');

  const lightsOn = () => sendCommand('lights_on');

  const lightsOff = () => sendCommand('lights_off');

  const lightsBrightness = (brightness: number) =>
    sendCommand('lights_brightness', { brightness });

  const pwmControl = (pin: number, dutyCycle: number) =>
    sendCommand('pwm_control', { pin, duty_cycle: dutyCycle });

  const setAutopilot = (mode: AutopilotMode) =>
    sendCommand('set_autopilot_mode', { mode });

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
    pwmControl,
    setAutopilot,
    emergencyStop,
  };
}
