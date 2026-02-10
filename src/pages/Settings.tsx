/**
 * Settings Page - Crop config and device info
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDeviceState } from '../hooks/useDeviceState';
import type { CropConfig } from '../hooks/useDeviceState';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const CROP_TYPES = [
  { value: 'broccoli_microgreens', label: 'Broccoli Microgreens' },
  { value: 'basil', label: 'Basil' },
  { value: 'sunflower', label: 'Sunflower' },
  { value: 'radish', label: 'Radish' },
  { value: 'arugula', label: 'Arugula' },
  { value: 'chia', label: 'Chia' },
  { value: 'custom', label: 'Custom' },
];

export default function Settings() {
  const { currentUser } = useAuth();
  const deviceId = (currentUser as any)?.hardwareSerial || localStorage.getItem('harvestpilot_hardware_serial') || '';
  
  const { state, loading, error } = useDeviceState(deviceId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateCropConfig = async (updates: Partial<CropConfig>) => {
    if (!deviceId || !state?.cropConfig) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const docRef = doc(db, 'devices', deviceId);
      await updateDoc(docRef, {
        cropConfig: {
          ...state.cropConfig,
          ...updates,
        },
      });
      setMessage({ type: 'success', text: 'Settings saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
      console.error('Failed to update crop config:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">⚠️ Error loading settings</p>
          <p className="text-sm">{error?.message || 'Device not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Status message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Crop Configuration */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Crop Configuration</h2>
          
          {state.cropConfig ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Type
                </label>
                <select
                  value={state.cropConfig.cropType}
                  onChange={(e) => updateCropConfig({ cropType: e.target.value as any })}
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {CROP_TYPES.map((crop) => (
                    <option key={crop.value} value={crop.value}>
                      {crop.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planted Date
                  </label>
                  <input
                    type="date"
                    value={new Date(state.cropConfig.plantedAt).toISOString().split('T')[0]}
                    onChange={(e) =>
                      updateCropConfig({ plantedAt: new Date(e.target.value).getTime() })
                    }
                    disabled={saving}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Harvest (days)
                  </label>
                  <input
                    type="number"
                    value={state.cropConfig.expectedHarvestDays}
                    onChange={(e) =>
                      updateCropConfig({ expectedHarvestDays: parseInt(e.target.value) })
                    }
                    disabled={saving}
                    min={1}
                    max={30}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Light On Hour (0-23)
                  </label>
                  <input
                    type="number"
                    value={state.cropConfig.lightOnHour}
                    onChange={(e) =>
                      updateCropConfig({ lightOnHour: parseInt(e.target.value) })
                    }
                    disabled={saving}
                    min={0}
                    max={23}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Light Off Hour (0-23)
                  </label>
                  <input
                    type="number"
                    value={state.cropConfig.lightOffHour}
                    onChange={(e) =>
                      updateCropConfig({ lightOffHour: parseInt(e.target.value) })
                    }
                    disabled={saving}
                    min={0}
                    max={23}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Irrigation Interval (hours)
                  </label>
                  <input
                    type="number"
                    value={state.cropConfig.irrigationIntervalHours}
                    onChange={(e) =>
                      updateCropConfig({ irrigationIntervalHours: parseInt(e.target.value) })
                    }
                    disabled={saving}
                    min={1}
                    max={24}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Irrigation Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={state.cropConfig.irrigationDurationSeconds}
                    onChange={(e) =>
                      updateCropConfig({ irrigationDurationSeconds: parseInt(e.target.value) })
                    }
                    disabled={saving}
                    min={10}
                    max={300}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No crop configured yet.</p>
          )}
        </section>

        {/* Device Info */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Info</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Device ID</span>
              <span className="font-mono text-gray-900">{state.deviceId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Firmware Version</span>
              <span className="text-gray-900">{state.firmwareVersion || 'Unknown'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Last Heartbeat</span>
              <span className="text-gray-900">
                {new Date(state.lastHeartbeat).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Last Sync</span>
              <span className="text-gray-900">
                {state.lastSyncAt 
                  ? new Date(state.lastSyncAt).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
