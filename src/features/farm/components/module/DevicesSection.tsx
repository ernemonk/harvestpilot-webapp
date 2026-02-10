/**
 * Devices Section
 * 
 * Manage sensors and actuators associated with this farm module.
 * Features: Add device, device list, device details drawer, calibration.
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, deleteField, Timestamp, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import type { DeviceType, SensorType, ActuatorType, ModuleDevice } from '../../../../types/farmModule';

interface DevicesSectionProps {
  moduleId: string;
}

export default function DevicesSection({ moduleId }: DevicesSectionProps) {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  // Fetch hardwareSerial from user profile, with moduleId as fallback
  useEffect(() => {
    let serial = localStorage.getItem('harvestpilot_hardware_serial') || '';
    
    if (serial) {
      setDeviceId(serial);
      return;
    }
    
    if (!currentUser?.uid) {
      // Use moduleId as the device ID
      setDeviceId(moduleId);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    getDoc(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        setDeviceId(userData.hardwareSerial || moduleId);
      } else {
        setDeviceId(moduleId);
      }
    }).catch(err => {
      console.error('Failed to fetch user profile:', err);
      setDeviceId(moduleId);
    });
  }, [currentUser?.uid, moduleId]);

  // Subscribe to gpioState from device document
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
        // Convert gpioState map to array
        const deviceList = Object.entries(gpioState).map(([pin, pinData]: any) => {
          // Use device_type from Firestore (set by Pi), fallback to name-based inference
          const name = pinData.name || '';
          let type = pinData.device_type || pinData.type || 'actuator';
          // Normalize device_type to UI type categories
          if (['sensor'].includes(type)) {
            type = 'sensor';
          } else if (['camera'].includes(type)) {
            type = 'camera';
          } else if (['motor', 'pump', 'light', 'actuator'].includes(type)) {
            type = 'actuator';
          } else if (name.includes('Sensor')) {
            type = 'sensor';
          } else if (name.includes('Camera')) {
            type = 'camera';
          } else {
            type = 'actuator';
          }
          
          return {
            id: `${deviceId}-${pin}`,
            pin: parseInt(pin),
            deviceId,
            hardwareSerial: deviceId,
            type,
            ...pinData,
            // Re-apply computed type so pinData.type doesn't overwrite
            type,
          };
        });
        setDevices(deviceList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [deviceId]);

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
            />
          )}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddDevice && (
        <AddDeviceModal
          moduleId={moduleId}
          deviceId={deviceId}
          onClose={() => setShowAddDevice(false)}
        />
      )}

      {/* Device Details Drawer */}
      {selectedDevice && (
        <DeviceDetailsDrawer
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onUpdate={(updated) => setSelectedDevice(updated)}
        />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function DeviceGroup({ title, icon, devices, onDeviceClick, moduleId }: any) {
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
          <DeviceRow key={device.id} device={device} onClick={() => onDeviceClick(device)} moduleId={moduleId} />
        ))}
      </div>
    </div>
  );
}

function DeviceRow({ device, onClick, moduleId }: { device: any; onClick: () => void; moduleId?: string }) {
  const { currentUser } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [deviceId] = useState(() => 
    (currentUser as any)?.hardwareSerial || localStorage.getItem('harvestpilot_hardware_serial') || ''
  );

  // Use device state directly from props
  const isOn = device.state ?? false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the drawer
    if (device.type !== 'actuator' || !device.pin || !deviceId) return;
    
    setToggling(true);
    try {
      // Send pin_control command instead of directly updating gpioState
      // This ensures the backend Firebase listener will process the command
      await addDoc(collection(db, `devices/${deviceId}/commands`), {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        type: 'pin_control',
        pin: device.pin,
        action: !isOn ? 'on' : 'off',
        issuedAt: Date.now(),
        status: 'pending',
      });
      // Don't set state here - let the Firestore listener update the state
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
          onClick={onClick}
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

function AddDeviceModal({ moduleId, deviceId, onClose }: { moduleId: string; deviceId: string; onClose: () => void }) {
  const [allGpioPins, setAllGpioPins] = useState<any[]>([]);
  const [selectedPins, setSelectedPins] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load all GPIO pins from device
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
  }, [deviceId]);

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
      const deviceRef = doc(db, 'devices', deviceId);
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
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(device);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const deviceRef = doc(db, 'devices', device.deviceId);
      await updateDoc(deviceRef, {
        [`gpioState.${device.pin}`]: {
          name: formData.name,
          type: formData.type,
          subtype: formData.subtype,
          gpioPin: device.pin,
          enabled: formData.enabled,
          state: formData.state !== undefined ? formData.state : device.state,
          lastUpdated: Timestamp.now(),
          mode: device.mode || (formData.type === 'actuator' ? 'output' : 'input'),
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
    
    setDeleting(true);
    try {
      const deviceRef = doc(db, 'devices', device.deviceId);
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
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Device Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{device.subtype.replace('_', ' ')}</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="label">Device Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">GPIO Pin</label>
              <input
                type="number"
                value={formData.gpioPin || ''}
                onChange={(e) => setFormData({ ...formData, gpioPin: parseInt(e.target.value) || undefined })}
                className="input"
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-medium text-gray-900 capitalize">{device.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GPIO Pin</span>
                <span className="font-medium text-gray-900">{device.gpioPin || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium ${device.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {device.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {device.lastReading !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Reading</span>
                  <span className="font-medium text-gray-900">
                    {typeof device.lastReading === 'number' ? Math.round(device.lastReading) : device.lastReading.toString()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Calibration Notes</h4>
              <textarea
                value={device.calibration?.notes || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  calibration: { ...formData.calibration, notes: e.target.value } 
                })}
                className="input"
                rows={3}
                placeholder="Add calibration notes..."
              />
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full btn-danger"
            >
              {deleting ? 'Deleting...' : 'Delete Device'}
            </button>
          </div>
        )}
      </div>
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
