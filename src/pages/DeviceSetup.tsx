/**
 * Device Setup - Register and configure a new HarvestPilot device
 * 
 * Walk users through:
 * 1. Enter device ID from their Raspberry Pi
 * 2. Configure crop settings
 * 3. Set up automation parameters
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import NoOrganization from '../components/ui/NoOrganization';

interface CropPreset {
  name: string;
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

const CROP_PRESETS: Record<string, CropPreset> = {
  microgreens: {
    name: 'Microgreens',
    expectedHarvestDays: 10,
    lightOnHour: 6,
    lightOffHour: 22,
    irrigationIntervalHours: 6,
    irrigationDurationSeconds: 30,
    tempTargetMin: 65,
    tempTargetMax: 75,
    humidityTargetMin: 50,
    humidityTargetMax: 70,
  },
  lettuce: {
    name: 'Lettuce',
    expectedHarvestDays: 30,
    lightOnHour: 6,
    lightOffHour: 20,
    irrigationIntervalHours: 4,
    irrigationDurationSeconds: 45,
    tempTargetMin: 60,
    tempTargetMax: 70,
    humidityTargetMin: 50,
    humidityTargetMax: 70,
  },
  herbs: {
    name: 'Herbs (Basil, Cilantro)',
    expectedHarvestDays: 21,
    lightOnHour: 7,
    lightOffHour: 21,
    irrigationIntervalHours: 6,
    irrigationDurationSeconds: 30,
    tempTargetMin: 65,
    tempTargetMax: 80,
    humidityTargetMin: 40,
    humidityTargetMax: 60,
  },
  tomatoes: {
    name: 'Cherry Tomatoes',
    expectedHarvestDays: 60,
    lightOnHour: 6,
    lightOffHour: 20,
    irrigationIntervalHours: 4,
    irrigationDurationSeconds: 60,
    tempTargetMin: 65,
    tempTargetMax: 85,
    humidityTargetMin: 50,
    humidityTargetMax: 70,
  },
  peppers: {
    name: 'Peppers',
    expectedHarvestDays: 70,
    lightOnHour: 6,
    lightOffHour: 20,
    irrigationIntervalHours: 4,
    irrigationDurationSeconds: 45,
    tempTargetMin: 70,
    tempTargetMax: 85,
    humidityTargetMin: 50,
    humidityTargetMax: 70,
  },
  custom: {
    name: 'Custom',
    expectedHarvestDays: 30,
    lightOnHour: 6,
    lightOffHour: 20,
    irrigationIntervalHours: 4,
    irrigationDurationSeconds: 30,
    tempTargetMin: 65,
    tempTargetMax: 75,
    humidityTargetMin: 50,
    humidityTargetMax: 70,
  },
};

export default function DeviceSetup() {
  const { currentUser, currentOrganization, organizationLoading } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('microgreens');
  const [cropConfig, setCropConfig] = useState(CROP_PRESETS.microgreens);
  const [customCropType, setCustomCropType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [deviceExists, setDeviceExists] = useState<boolean | null>(null);

  // Show loading while checking organization
  if (organizationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show NoOrganization if user doesn't have an organization
  if (!currentOrganization) {
    return <NoOrganization />;
  }

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setCropConfig(CROP_PRESETS[presetKey]);
  };

  const verifyDevice = async () => {
    if (!deviceId.trim()) {
      setError('Please enter a device ID');
      return;
    }
    
    setVerifying(true);
    setError('');
    
    try {
      const deviceRef = doc(db, 'devices', deviceId.trim());
      const deviceSnap = await getDoc(deviceRef);
      
      if (deviceSnap.exists()) {
        const data = deviceSnap.data();
        
        // Check if device has access control and if user is allowed
        if (data.accessControl?.mode === 'whitelist') {
          // Device is locked to specific users
          if (!data.accessControl?.allowedUsers?.includes(currentUser?.uid)) {
            setError('You do not have permission to access this device. Contact the device owner.');
            setDeviceExists(false);
          } else {
            setDeviceExists(true);
            // Pre-fill config if device has one
            if (data.cropConfig) {
              setCropConfig(data.cropConfig);
              setSelectedPreset('custom');
            }
          }
        } else {
          // Device is open for all users
          setDeviceExists(true);
          // Pre-fill config if device has one
          if (data.cropConfig) {
            setCropConfig(data.cropConfig);
            setSelectedPreset('custom');
          }
        }
      } else {
        // Device doesn't exist - must power on Pi first
        setDeviceExists(false);
        setError('Device not found. Make sure your Raspberry Pi is powered on and connected to WiFi. Wait 30-60 seconds for it to register.');
      }
    } catch (err) {
      console.error('Error verifying device:', err);
      setError('Failed to verify device. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Device MUST exist to be added
      const deviceRef = doc(db, 'devices', deviceId.trim());
      const deviceSnap = await getDoc(deviceRef);
      
      if (!deviceSnap.exists()) {
        setError('Device not found. Your Raspberry Pi must be powered on and registered first. Please try again.');
        setLoading(false);
        return;
      }

      const existingData = deviceSnap.data();
      const isFirstUser = !existingData.firstOwnerId;
      
      // Prepare update data
      const updateData: any = {
        deviceId: deviceId.trim(),
        deviceName: deviceName || `HarvestPilot ${deviceId.slice(-4)}`,
        organizationId: currentOrganization.id,
        status: 'connecting', // Will be set to online when Pi syncs
        autopilotMode: 'on',
        lastHeartbeat: 0,
        lastSyncAt: null,
        currentReading: null,
        cropConfig: {
          cropType: selectedPreset === 'custom' ? customCropType : selectedPreset,
          plantedAt: Date.now(),
          ...cropConfig,
        },
        failsafeTriggered: false,
        failsafeReason: null,
        firmwareVersion: 'unknown',
        lightsOn: false,
        lastIrrigationAt: null,
        nextIrrigationAt: null,
        updatedAt: Date.now(),
      };

      // If first user, set up multi-user sharing structure
      if (isFirstUser) {
        updateData.firstOwnerId = currentUser.uid;
        // Default: open access (allow any user)
        updateData.accessControl = {
          mode: 'open', // 'open' | 'whitelist'
          allowedUsers: [currentUser.uid],
          lockedAt: null,
        };
        // Track all users who have access
        updateData.users = [currentUser.uid];
      } else {
        // Existing device: add current user if not already added
        const currentUsers = existingData.users || [];
        
        if (!currentUsers.includes(currentUser.uid)) {
          updateData.users = [...currentUsers, currentUser.uid];
        }

        // If device is in open mode, grant access automatically
        if (existingData.accessControl?.mode === 'open') {
          updateData.accessControl = {
            ...existingData.accessControl,
            allowedUsers: [...(existingData.accessControl?.allowedUsers || []), currentUser.uid],
          };
        }
      }

      await setDoc(deviceRef, updateData, { merge: true });

      // Store device ID locally for quick access
      localStorage.setItem('harvestpilot_device_id', deviceId.trim());
      
      // Navigate to device dashboard
      navigate('/device');
    } catch (err: any) {
      console.error('Error registering device:', err);
      setError(err.message || 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-white">
          <h1 className="text-2xl font-bold">Set Up Your Device</h1>
          <p className="text-primary-100 mt-1">
            Connect your HarvestPilot hardware to start growing
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex border-b">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 py-3 text-center text-sm font-medium ${
                step === s
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : step > s
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {step > s ? '✓ ' : ''}
              {s === 1 && 'Device ID'}
              {s === 2 && 'Crop Settings'}
              {s === 3 && 'Confirm'}
            </div>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Device ID */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device ID
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Find this on your Raspberry Pi display or in the HarvestPilot terminal output
                </p>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    setDeviceExists(null);
                  }}
                  placeholder="e.g., hp-12345678"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {deviceExists === true && (
                  <p className="mt-2 text-sm text-green-600">✓ Device found!</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name (optional)
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Kitchen Garden, Greenhouse #1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">📋 Finding Your Device ID</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Power on your Raspberry Pi with HarvestPilot installed</li>
                  <li>Wait for the system to boot (about 30 seconds)</li>
                  <li>Look for the Device ID on the LCD screen or terminal</li>
                  <li>It starts with "hp-" followed by 8 characters</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={verifyDevice}
                  disabled={verifying || !deviceId.trim()}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Verify Device'}
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!deviceId.trim()}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Crop Settings */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you growing?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CROP_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetChange(key)}
                      className={`p-3 border rounded-lg text-left ${
                        selectedPreset === key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl mr-2">
                        {key === 'microgreens' && '🌿'}
                        {key === 'lettuce' && '🥬'}
                        {key === 'herbs' && '🌱'}
                        {key === 'tomatoes' && '🍅'}
                        {key === 'peppers' && '🌶️'}
                        {key === 'custom' && '⚙️'}
                      </span>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPreset === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Type Name
                  </label>
                  <input
                    type="text"
                    value={customCropType}
                    onChange={(e) => setCustomCropType(e.target.value)}
                    placeholder="e.g., Spinach, Kale, etc."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Growing Parameters</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500">Harvest Days</label>
                    <input
                      type="number"
                      value={cropConfig.expectedHarvestDays}
                      onChange={(e) => setCropConfig({ ...cropConfig, expectedHarvestDays: parseInt(e.target.value) })}
                      className="w-full border rounded px-2 py-1 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500">Light Schedule</label>
                    <div className="flex gap-1 mt-1">
                      <input
                        type="number"
                        value={cropConfig.lightOnHour}
                        onChange={(e) => setCropConfig({ ...cropConfig, lightOnHour: parseInt(e.target.value) })}
                        className="w-16 border rounded px-2 py-1"
                        min="0"
                        max="23"
                      />
                      <span className="py-1">to</span>
                      <input
                        type="number"
                        value={cropConfig.lightOffHour}
                        onChange={(e) => setCropConfig({ ...cropConfig, lightOffHour: parseInt(e.target.value) })}
                        className="w-16 border rounded px-2 py-1"
                        min="0"
                        max="23"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500">Irrigation Every (hours)</label>
                    <input
                      type="number"
                      value={cropConfig.irrigationIntervalHours}
                      onChange={(e) => setCropConfig({ ...cropConfig, irrigationIntervalHours: parseInt(e.target.value) })}
                      className="w-full border rounded px-2 py-1 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500">Irrigation Duration (sec)</label>
                    <input
                      type="number"
                      value={cropConfig.irrigationDurationSeconds}
                      onChange={(e) => setCropConfig({ ...cropConfig, irrigationDurationSeconds: parseInt(e.target.value) })}
                      className="w-full border rounded px-2 py-1 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500">Target Temp (°F)</label>
                    <div className="flex gap-1 mt-1">
                      <input
                        type="number"
                        value={cropConfig.tempTargetMin}
                        onChange={(e) => setCropConfig({ ...cropConfig, tempTargetMin: parseInt(e.target.value) })}
                        className="w-16 border rounded px-2 py-1"
                      />
                      <span className="py-1">-</span>
                      <input
                        type="number"
                        value={cropConfig.tempTargetMax}
                        onChange={(e) => setCropConfig({ ...cropConfig, tempTargetMax: parseInt(e.target.value) })}
                        className="w-16 border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500">Target Humidity (%)</label>
                    <div className="flex gap-1 mt-1">
                      <input
                        type="number"
                        value={cropConfig.humidityTargetMin}
                        onChange={(e) => setCropConfig({ ...cropConfig, humidityTargetMin: parseInt(e.target.value) })}
                        className="w-16 border rounded px-2 py-1"
                      />
                      <span className="py-1">-</span>
                      <input
                        type="number"
                        value={cropConfig.humidityTargetMax}
                        onChange={(e) => setCropConfig({ ...cropConfig, humidityTargetMax: parseInt(e.target.value) })}
                        className="w-16 border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3">✓ Ready to Connect!</h4>
                <div className="text-sm text-green-700 space-y-2">
                  <p><strong>Device:</strong> {deviceId} {deviceName && `(${deviceName})`}</p>
                  <p><strong>Crop:</strong> {selectedPreset === 'custom' ? customCropType : CROP_PRESETS[selectedPreset].name}</p>
                  <p><strong>Light Schedule:</strong> {cropConfig.lightOnHour}:00 - {cropConfig.lightOffHour}:00</p>
                  <p><strong>Irrigation:</strong> Every {cropConfig.irrigationIntervalHours}h for {cropConfig.irrigationDurationSeconds}s</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📡 What happens next?</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Your device settings will be saved to the cloud</li>
                  <li>When your Raspberry Pi connects, it will receive these settings</li>
                  <li>Automation will begin based on your configuration</li>
                  <li>You can monitor and control everything from the dashboard</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading ? 'Setting Up...' : 'Complete Setup 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
