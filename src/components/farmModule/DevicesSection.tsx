/**
 * Devices Section
 * 
 * Manage sensors and actuators associated with this farm module.
 * Features: Add device, device list, device details drawer, calibration.
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, deleteField, Timestamp, addDoc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { DeviceType, SensorType, ActuatorType, ModuleDevice } from '../../types/farmModule';

interface DevicesSectionProps {
  moduleId: string;
  hardwareSerial: string;
}

export default function DevicesSection({ moduleId, hardwareSerial }: DevicesSectionProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);

  // Subscribe to gpioState from device document using hardware serial (with moduleId fallback)
  useEffect(() => {
    const deviceKey = hardwareSerial || moduleId;
    if (!deviceKey) {
      setLoading(false);
      return;
    }

    const deviceRef = doc(db, 'devices', deviceKey);
    const unsubscribe = onSnapshot(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const gpioState = data.gpioState || {};
        // Convert gpioState map to array, with pin number as id
        const deviceList = Object.entries(gpioState).map(([pin, pinData]: any) => {
          // Infer device type from GPIO pin name
          const name = pinData.name || '';
          let type = 'actuator'; // default
          if (name.includes('Sensor')) {
            type = 'sensor';
          } else if (name.includes('Camera')) {
            type = 'camera';
          }
          
          return {
            id: `${deviceKey}-${pin}`,
            pin: parseInt(pin),
            hardwareSerial: deviceKey,
            type,
            ...pinData,
          };
        });
        setDevices(deviceList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hardwareSerial, moduleId]);

  // Group devices by type
  const sensors = devices.filter(d => d.type === 'sensor');
  const actuators = devices.filter(d => d.type === 'actuator');
  const cameras = devices.filter(d => d.type === 'camera');

  if (loading) {
    return <DevicesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Devices</h2>
          <p className="text-sm text-gray-500 mt-1">
            {devices.length} {devices.length === 1 ? 'device' : 'devices'} registered
          </p>
        </div>
        <button
          onClick={() => setShowAddDevice(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Device</span>
        </button>
      </div>

      {/* Device Groups */}
      {devices.length === 0 ? (
        <EmptyState onAdd={() => setShowAddDevice(true)} />
      ) : (
        <div className="space-y-6">
          {/* Sensors */}
          {sensors.length > 0 && (
            <DeviceGroup
              title="Sensors"
              icon="📡"
              devices={sensors}
              onDeviceClick={setSelectedDevice}
              moduleId={moduleId}
              hardwareSerial={hardwareSerial}
            />
          )}

          {/* Actuators */}
          {actuators.length > 0 && (
            <DeviceGroup
              title="Actuators"
              icon="⚙️"
              devices={actuators}
              onDeviceClick={setSelectedDevice}
              moduleId={moduleId}
              hardwareSerial={hardwareSerial}
            />
          )}

          {/* Cameras */}
          {cameras.length > 0 && (
            <DeviceGroup
              title="Cameras"
              icon="📷"
              devices={cameras}
              onDeviceClick={setSelectedDevice}
              moduleId={moduleId}
              hardwareSerial={hardwareSerial}
            />
          )}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddDevice && (
        <AddDeviceModal
          moduleId={moduleId}
          hardwareSerial={hardwareSerial}
          onClose={() => setShowAddDevice(false)}
        />
      )}

      {/* Device Details Drawer */}
      {selectedDevice && (
        <>
          {console.log('📱 DeviceDetailsDrawer rendering with device:', selectedDevice)}
          <DeviceDetailsDrawer
            device={selectedDevice}
            onClose={() => setSelectedDevice(null)}
            onUpdate={(updated: ModuleDevice) => setSelectedDevice(updated)}
          />
        </>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function DeviceGroup({ title, icon, devices, onDeviceClick, moduleId, hardwareSerial }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">{icon}</span>
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">({devices.length})</span>
        </h3>
      </div>
      <div className="divide-y divide-gray-200">
        {devices.map((device: any) => (
          <DeviceRow key={device.id} device={device} onClick={() => onDeviceClick(device)} moduleId={moduleId} hardwareSerial={hardwareSerial} />
        ))}
      </div>
    </div>
  );
}

function DeviceRow({ device, onClick, moduleId, hardwareSerial }: { device: any; onClick: () => void; moduleId?: string; hardwareSerial?: string }) {
  const [toggling, setToggling] = useState(false);
  const [isOn, setIsOn] = useState(device.state === true);

  useEffect(() => {
    setIsOn(device.state === true);
  }, [device.state]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (device.type !== 'actuator' || !hardwareSerial) return;
    
    setToggling(true);
    try {
      const newState = !isOn;
      // Send pin_control command instead of directly updating gpioState
      // This ensures the backend Firebase listener will process the command
      await addDoc(collection(db, `devices/${hardwareSerial}/commands`), {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        type: 'pin_control',
        pin: device.pin,
        action: newState ? 'on' : 'off',
        issuedAt: Date.now(),
        status: 'pending',
      });
      // Don't set isOn here - let the Firestore listener update the state
      // This prevents optimistic updates from causing state oscillation
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(false);
    }
  };

  const getTypeIcon = () => {
    // For GPIO pins, use mode and type to determine icon
    if (device.type === 'sensor') {
      return '📡';
    } else if (device.type === 'camera') {
      return '📷';
    } else {
      // Actuator - check name for specific type
      const name = device.name || '';
      if (name.includes('Motor')) return '⚙️';
      if (name.includes('Pump')) return '🚰';
      if (name.includes('LED')) return '💡';
      if (name.includes('Relay')) return '🔌';
      return '⚙️';
    }
  };

  const getStatusColor = () => {
    if (!device.enabled) return 'bg-gray-400';
    if (device.lastHardwareRead) {
      const ageMinutes = (Date.now() - (device.lastHardwareRead as any).seconds * 1000) / (1000 * 60);
      if (ageMinutes < 5) return 'bg-green-500';
    }
    return 'bg-gray-400';
  };

  return (
    <div className="w-full px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            console.log('🔧 Device row clicked:', device);
            onClick();
          }}
          className="flex items-center space-x-4 flex-1 text-left"
        >
          <div className="text-3xl">{getTypeIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-medium text-gray-900 truncate">{device.name}</h4>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            </div>
            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
              <span className="capitalize">{device.mode || 'GPIO'}</span>
              {device.pin !== undefined && <span>Pin {device.pin}</span>}
              {device.type === 'sensor' && device.state !== undefined && (
                <span className="font-medium text-gray-900">
                  {device.state ? 'HIGH' : 'LOW'}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Toggle Switch for Actuators */}
        {device.type === 'actuator' && (
          <div className="flex items-center space-x-3 ml-4">
            <span className={`text-sm font-medium ${isOn ? 'text-green-600' : 'text-gray-500'}`}>
              {isOn ? 'ON' : 'OFF'}
            </span>
            <button
              onClick={handleToggle}
              disabled={toggling || device.pin === undefined}
              className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors ${
                isOn ? 'bg-green-500' : 'bg-gray-300'
              } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
            >
              <span className={`inline-block w-6 h-6 transform rounded-full bg-white shadow-md transition-transform ${
                isOn ? 'translate-x-7' : 'translate-x-0.5'
              }`}>
                {toggling && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </span>
                )}
              </span>
            </button>
          </div>
        )}

        <button onClick={onClick} className="ml-2 p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="text-6xl mb-4">🔧</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Registered</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Add sensors and actuators to start monitoring and controlling your farm module.
      </p>
      <button onClick={onAdd} className="btn-primary">
        Add Your First Device
      </button>
    </div>
  );
}

function AddDeviceModal({ moduleId, hardwareSerial, onClose }: { moduleId: string; hardwareSerial: string; onClose: () => void }) {
  const [allGpioPins, setAllGpioPins] = useState<any[]>([]);
  const [selectedPins, setSelectedPins] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load all GPIO pins from device
  useEffect(() => {
    const deviceKey = hardwareSerial || moduleId;
    if (!deviceKey) {
      setLoading(false);
      return;
    }

    const deviceRef = doc(db, 'devices', deviceKey);
    const unsubscribe = onSnapshot(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const gpioState = data.gpioState || {};
        const pinsList = Object.entries(gpioState)
          .map(([pin, pinData]: any) => ({
            pin: parseInt(pin),
            ...pinData,
          }))
          .sort((a, b) => a.pin - b.pin);
        setAllGpioPins(pinsList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hardwareSerial, moduleId]);

  const handleTogglePin = (pin: number) => {
    const newSelected = new Set(selectedPins);
    if (newSelected.has(pin)) {
      newSelected.delete(pin);
    } else {
      newSelected.add(pin);
    }
    setSelectedPins(newSelected);
  };

  const handleEnableSelected = async () => {
    if (selectedPins.size === 0) {
      alert('Please select at least one GPIO pin');
      return;
    }

    setSaving(true);
    try {
      const deviceRef = doc(db, 'devices', hardwareSerial || moduleId);
      const updateFields: Record<string, any> = {};

      selectedPins.forEach(pin => {
        updateFields[`gpioState.${pin}.enabled`] = true;
      });

      await updateDoc(deviceRef, updateFields);
      onClose();
    } catch (err) {
      console.error('Failed to enable pins:', err);
      alert('Failed to enable pins: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-center text-gray-500 mt-4">Loading GPIO pins...</p>
        </div>
      </div>
    );
  }

  const disabledPins = allGpioPins.filter(pin => !pin.enabled);
  const enabledPins = allGpioPins.filter(pin => pin.enabled);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enable GPIO Pins</h2>
              <p className="text-sm text-gray-500 mt-1">Select pins to enable them for use</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Disabled Pins Section */}
          {disabledPins.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Available to Enable ({disabledPins.length})</h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                {disabledPins.map(pin => (
                  <div key={pin.pin} className="flex items-center p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPins.has(pin.pin)}
                      onChange={() => handleTogglePin(pin.pin)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{pin.name}</p>
                          <p className="text-xs text-gray-500">Pin {pin.pin} · {pin.mode || 'output'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            pin.hardwareState ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pin.hardwareState ? 'HIGH' : 'LOW'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Already Enabled Pins Section */}
          {enabledPins.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Already Enabled ({enabledPins.length})</h3>
              <div className="space-y-2 bg-green-50 rounded-lg p-4 border border-green-200 max-h-48 overflow-y-auto">
                {enabledPins.map(pin => (
                  <div key={pin.pin} className="flex items-center p-3 bg-white rounded-lg border border-green-200">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{pin.name}</p>
                          <p className="text-xs text-gray-500">Pin {pin.pin} · {pin.mode || 'output'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pin.hardwareState ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pin.hardwareState ? 'HIGH' : 'LOW'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {disabledPins.length === 0 && enabledPins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No GPIO pins found on this device</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEnableSelected}
            disabled={saving || selectedPins.size === 0}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enabling...' : `Enable ${selectedPins.size} Pin${selectedPins.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeviceDetailsDrawer({ device, onClose, onUpdate }: any) {
  console.log('🎯 DeviceDetailsDrawer mounted with device:', device);
  
  // Safety check - if no device, don't render
  if (!device) {
    console.warn('⚠️ DeviceDetailsDrawer called without device');
    return null;
  }

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(device || {});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isACtuator = device?.type === 'actuator';
  const isSensor = device?.type === 'sensor';
  const isOn = device?.state === true;

  // Load schedules from Firestore when drawer opens
  // Path: devices/{hardwareSerial}/gpioState/{pin}/schedules/{scheduleId}
  useEffect(() => {
    if (!device?.hardwareSerial || device?.pin === undefined || !isACtuator) {
      setLoadingSchedules(false);
      return;
    }

    setLoadingSchedules(true);
    const schedulesRef = collection(db, 'devices', device.hardwareSerial, 'gpioState', device.pin.toString(), 'schedules');
    const unsubscribe = onSnapshot(schedulesRef, (snapshot) => {
      const loadedSchedules = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          durationSeconds: data.durationSeconds,
          frequencySeconds: data.frequencySeconds,
          durationDisplay: `${data.durationSeconds} seconds`,
          frequencyDisplay: `${data.frequencySeconds} seconds`,
          startTime: data.startTime,
          endTime: data.endTime,
          enabled: data.enabled,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        };
      });
      console.log('📅 Loaded schedules from Firestore at gpioState/' + device.pin + '/schedules:', loadedSchedules);
      setSchedules(loadedSchedules);
      setLoadingSchedules(false);
    }, (err) => {
      console.error('❌ Failed to load schedules:', err);
      setLoadingSchedules(false);
    });

    return () => unsubscribe();
  }, [device?.hardwareSerial, device?.pin, isACtuator]);

  const getTypeIcon = () => {
    const icons: Record<string, string> = {
      temperature: '🌡️',
      humidity: '💧',
      soil_moisture: '🌱',
      water_level: '💦',
      ec: '⚡',
      ph: '🧪',
      light: '💡',
      pump: '🚰',
      fan: '🌀',
      valve: '🚿',
      motor: '⚙️',
    };
    return icons[device?.subtype] || (device?.type === 'sensor' ? '📡' : device?.type === 'camera' ? '📷' : '🔧');
  };

  const handleToggleState = async () => {
    if (!isACtuator || !device?.hardwareSerial || device?.pin === undefined) return;
    setToggling(true);
    try {
      const deviceRef = doc(db, 'devices', device.hardwareSerial);
      await updateDoc(deviceRef, {
        [`gpioState.${device.pin}`]: {
          ...device,
          state: !isOn,
          lastUpdated: Timestamp.now(),
        }
      });
      onUpdate({ ...device, state: !isOn });
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    if (!device?.hardwareSerial || device?.pin === undefined) {
      console.error('Missing required fields for save');
      return;
    }
    setSaving(true);
    try {
      const deviceRef = doc(db, 'devices', device.hardwareSerial);
      await updateDoc(deviceRef, {
        [`gpioState.${device.pin}`]: {
          ...formData,
          lastUpdated: Timestamp.now(),
        }
      });
      onUpdate(formData);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update device:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    if (!device?.hardwareSerial || device?.pin === undefined) {
      console.error('Missing required fields for delete');
      return;
    }
    
    setDeleting(true);
    try {
      const deviceRef = doc(db, 'devices', device.hardwareSerial);
      await updateDoc(deviceRef, {
        [`gpioState.${device.pin}`]: deleteField(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to delete device:', err);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{getTypeIcon()}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{device?.name || 'Unnamed Device'}</h2>
              <p className="text-sm text-gray-600 capitalize mt-1">
                {device?.subtype?.replace('_', ' ') || device?.type || 'Unknown'} 
                {device?.pin !== undefined && ` • GPIO ${device.pin}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Status Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Status</p>
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${device?.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-lg font-semibold text-gray-900">
                    {device?.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {isACtuator && (
                <button
                  onClick={handleToggleState}
                  disabled={toggling || !device?.enabled}
                  className={`relative inline-flex items-center w-16 h-8 rounded-full transition-colors ${
                    isOn ? 'bg-green-500' : 'bg-gray-300'
                  } ${toggling || !device?.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                >
                  <span className={`inline-block w-7 h-7 transform rounded-full bg-white shadow-md transition-transform ${
                    isOn ? 'translate-x-8' : 'translate-x-0.5'
                  }`} />
                </button>
              )}
            </div>
            {isACtuator && (
              <p className="text-xs text-gray-500 mt-3">
                {isOn ? '🟢 Device is ON' : '⚪ Device is OFF'}
              </p>
            )}
          </div>

          {/* Device Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Device Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Type</span>
                <span className="font-medium text-gray-900 capitalize">{device?.type || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">GPIO Pin</span>
                <span className="font-mono font-medium text-gray-900">{device?.pin ?? 'N/A'}</span>
              </div>
              {device?.lastUpdated && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-sm text-gray-900">
                    {typeof device?.lastUpdated === 'object' && device?.lastUpdated?.seconds
                      ? new Date(device.lastUpdated.seconds * 1000).toLocaleTimeString()
                      : 'N/A'}
                  </span>
                </div>
              )}
              {isSensor && device?.lastReading !== undefined && (
                <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700 font-medium">Last Reading</span>
                  <span className="text-lg font-semibold text-blue-900">
                    {typeof device?.lastReading === 'number' ? device.lastReading.toFixed(2) : device?.lastReading}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Control Section for Actuators */}
          {isACtuator && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-900 mb-3">⚙️ Quick Control</h3>
              <div className="space-y-2">
                <button
                  onClick={handleToggleState}
                  disabled={toggling || !device?.enabled}
                  className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {toggling ? 'Switching...' : isOn ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            </div>
          )}

          {/* Scheduling Section */}
          {isACtuator && (
            <SchedulingSection device={device} schedules={schedules} setSchedules={setSchedules} showScheduleForm={showScheduleForm} setShowScheduleForm={setShowScheduleForm} />
          )}

          {/* Settings Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">⚙️ Settings</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Device Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="sensor">Sensor</option>
                    <option value="actuator">Actuator</option>
                    <option value="camera">Camera</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Enabled</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  device?.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {device?.enabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Delete */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-50 text-sm"
        >
          {deleting ? 'Deleting...' : '🗑️ Delete Device'}
        </button>
      </div>
    </div>
  );
}

// Scheduling component with precision interval-based scheduling
function SchedulingSection({ device, schedules, setSchedules, showScheduleForm, setShowScheduleForm }: any) {
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    durationValue: 30,
    durationUnit: 'seconds',
    frequencyValue: 5,
    frequencyUnit: 'minutes',
    startTime: '',
    endTime: '',
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const unitToSeconds: Record<string, number> = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
  };

  const handleCreateSchedule = async () => {
    if (!newSchedule.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    const durationSeconds = newSchedule.durationValue * unitToSeconds[newSchedule.durationUnit];
    const frequencySeconds = newSchedule.frequencyValue * unitToSeconds[newSchedule.frequencyUnit];

    const schedule = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      name: newSchedule.name,
      durationSeconds,
      frequencySeconds,
      durationDisplay: `${newSchedule.durationValue} ${newSchedule.durationUnit}`,
      frequencyDisplay: `${newSchedule.frequencyValue} ${newSchedule.frequencyUnit}`,
      startTime: newSchedule.startTime || null,
      endTime: newSchedule.endTime || null,
      enabled: newSchedule.enabled,
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      // Save to Firestore under devices/{hardwareSerial}/gpioState/{pin}/schedules/{scheduleId}
      const scheduleRef = doc(db, 'devices', device.hardwareSerial, 'gpioState', device.pin.toString(), 'schedules', schedule.id);
      await setDoc(scheduleRef, {
        name: schedule.name,
        durationSeconds: schedule.durationSeconds,
        frequencySeconds: schedule.frequencySeconds,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        enabled: schedule.enabled,
        pin: device.pin,
        createdAt: Timestamp.fromDate(new Date(schedule.createdAt)),
        updatedAt: Timestamp.now(),
      });

      console.log('✅ Schedule saved to Firestore at gpioState/' + device.pin + '/schedules:', schedule);
      setSchedules([...schedules, schedule]);
      setNewSchedule({
        name: '',
        durationValue: 30,
        durationUnit: 'seconds',
        frequencyValue: 5,
        frequencyUnit: 'minutes',
        startTime: '',
        endTime: '',
        enabled: true,
      });
      setShowScheduleForm(false);
    } catch (err) {
      console.error('❌ Failed to save schedule:', err);
      alert('Failed to save schedule to Firestore');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    setSaving(true);
    try {
      // Delete from Firestore at devices/{hardwareSerial}/gpioState/{pin}/schedules/{id}
      const scheduleRef = doc(db, 'devices', device.hardwareSerial, 'gpioState', device.pin.toString(), 'schedules', id);
      await deleteDoc(scheduleRef);
      
      console.log('✅ Schedule deleted from Firestore at gpioState/' + device.pin + '/schedules:', id);
      setSchedules(schedules.filter((s: any) => s.id !== id));
    } catch (err) {
      console.error('❌ Failed to delete schedule:', err);
      alert('Failed to delete schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">📅 Interval Schedules</h3>
        <button
          onClick={() => setShowScheduleForm(!showScheduleForm)}
          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"
          disabled={saving}
        >
          {showScheduleForm ? '✕ Close' : '+ Add Schedule'}
        </button>
      </div>

      {showScheduleForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-4">
          {/* Schedule Name */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Schedule Name</label>
            <input
              type="text"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              placeholder="e.g., Morning watering"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Run Duration</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={newSchedule.durationValue}
                onChange={(e) => setNewSchedule({ ...newSchedule, durationValue: Math.max(1, parseInt(e.target.value) || 1) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
              />
              <select
                value={newSchedule.durationUnit}
                onChange={(e) => setNewSchedule({ ...newSchedule, durationUnit: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
              >
                <option value="seconds">seconds</option>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Device will run for {newSchedule.durationValue} {newSchedule.durationUnit}</p>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Repeat Interval</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={newSchedule.frequencyValue}
                onChange={(e) => setNewSchedule({ ...newSchedule, frequencyValue: Math.max(1, parseInt(e.target.value) || 1) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
              />
              <select
                value={newSchedule.frequencyUnit}
                onChange={(e) => setNewSchedule({ ...newSchedule, frequencyUnit: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
              >
                <option value="seconds">seconds</option>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Schedule will repeat every {newSchedule.frequencyValue} {newSchedule.frequencyUnit}</p>
          </div>

          {/* Optional Time Window */}
          <div className="pt-2 border-t border-blue-200">
            <p className="text-xs font-medium text-gray-700 mb-2">⏰ Optional Time Window</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={newSchedule.startTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">End Time</label>
                <input
                  type="time"
                  value={newSchedule.endTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  disabled={saving}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave blank to run anytime</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-blue-200">
            <button
              onClick={() => setShowScheduleForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSchedule}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Display Schedules */}
      {schedules.length === 0 && !showScheduleForm ? (
        <p className="text-sm text-gray-500 text-center py-4">No schedules created yet</p>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule: any) => (
            <div key={schedule.id} className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1 text-sm">
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-gray-900">{schedule.name}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${schedule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Run for <span className="font-medium">{schedule.durationDisplay}</span> every <span className="font-medium">{schedule.frequencyDisplay}</span>
                </p>
                {(schedule.startTime || schedule.endTime) && (
                  <p className="text-gray-500 text-xs mt-1">
                    ⏰ {schedule.startTime ? `From ${schedule.startTime}` : ''} {schedule.endTime ? `To ${schedule.endTime}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteSchedule(schedule.id)}
                disabled={saving}
                className="text-red-600 hover:text-red-700 transition-colors font-bold text-lg ml-2 flex-shrink-0 disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DevicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(j => (
              <div key={j} className="w-full h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
