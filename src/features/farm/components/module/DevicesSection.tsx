/**
 * Devices Section
 * 
 * Manage sensors and actuators associated with this farm module.
 * Features: Add device, device list, device details drawer, calibration.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import type { ModuleDevice, DeviceType, SensorType, ActuatorType } from '../../types/farmModule';
import { useGPIOActuators } from '../../hooks/useGPIOActuators';

interface DevicesSectionProps {
  moduleId: string;
}

export default function DevicesSection({ moduleId }: DevicesSectionProps) {
  const [devices, setDevices] = useState<ModuleDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<ModuleDevice | null>(null);

  // Subscribe to devices for this module
  useEffect(() => {
    const devicesRef = collection(db, 'module_devices');
    const q = query(devicesRef, where('moduleId', '==', moduleId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deviceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ModuleDevice));
      setDevices(deviceData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [moduleId]);

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
        {devices.map((device: ModuleDevice) => (
          <DeviceRow key={device.id} device={device} onClick={() => onDeviceClick(device)} moduleId={moduleId} />
        ))}
      </div>
    </div>
  );
}

function DeviceRow({ device, onClick, moduleId }: { device: ModuleDevice; onClick: () => void; moduleId?: string }) {
  const { actuators, toggleActuator } = useGPIOActuators(moduleId);
  const [toggling, setToggling] = useState(false);

  // Get actuator state from Firestore
  const actuatorState = actuators.find(a => a.bcmPin === device.gpioPin);
  const isOn = actuatorState?.state ?? false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the drawer
    if (device.type !== 'actuator' || device.gpioPin === undefined) return;
    
    setToggling(true);
    try {
      await toggleActuator(device.gpioPin, !isOn);
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(false);
    }
  };

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
    return icons[device.subtype as string] || '🔧';
  };

  const getStatusColor = () => {
    if (!device.enabled) return 'bg-gray-400';
    if (device.lastReadingAt) {
      const ageMinutes = (Date.now() - (device.lastReadingAt as any).seconds * 1000) / (1000 * 60);
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
              <span className="capitalize">{device.subtype.replace('_', ' ')}</span>
              {device.gpioPin !== undefined && <span>GPIO {device.gpioPin}</span>}
              {device.lastReading !== undefined && device.type === 'sensor' && (
                <span className="font-medium text-gray-900">
                  {typeof device.lastReading === 'number' ? Math.round(device.lastReading) : device.lastReading}
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
              disabled={toggling || device.gpioPin === undefined}
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

function AddDeviceModal({ moduleId, onClose }: { moduleId: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'sensor' as DeviceType,
    subtype: 'temperature' as SensorType | ActuatorType,
    gpioPin: '',
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await addDoc(collection(db, 'module_devices'), {
        moduleId,
        name: formData.name,
        type: formData.type,
        subtype: formData.subtype,
        gpioPin: formData.gpioPin ? parseInt(formData.gpioPin) : undefined,
        enabled: formData.enabled,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to add device:', err);
    } finally {
      setSaving(false);
    }
  };

  const sensorTypes: SensorType[] = ['temperature', 'humidity', 'soil_moisture', 'water_level', 'ec', 'ph', 'light'];
  const actuatorTypes: ActuatorType[] = ['pump', 'light', 'fan', 'valve', 'motor'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add Device</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label">Device Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Primary Temperature Sensor"
              required
            />
          </div>

          <div>
            <label className="label">Device Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ 
                ...formData, 
                type: e.target.value as DeviceType,
                subtype: e.target.value === 'sensor' ? 'temperature' : 'pump'
              })}
              className="input"
            >
              <option value="sensor">Sensor</option>
              <option value="actuator">Actuator</option>
              <option value="camera">Camera</option>
            </select>
          </div>

          <div>
            <label className="label">Specific Type</label>
            <select
              value={formData.subtype}
              onChange={(e) => setFormData({ ...formData, subtype: e.target.value as any })}
              className="input"
            >
              {formData.type === 'sensor' && sensorTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
              ))}
              {formData.type === 'actuator' && actuatorTypes.map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
              {formData.type === 'camera' && (
                <option value="camera">Camera</option>
              )}
            </select>
          </div>

          <div>
            <label className="label">GPIO Pin (optional)</label>
            <input
              type="number"
              value={formData.gpioPin}
              onChange={(e) => setFormData({ ...formData, gpioPin: e.target.value })}
              className="input"
              placeholder="e.g., 17"
              min="0"
              max="27"
            />
            <p className="text-xs text-gray-500 mt-1">Raspberry Pi GPIO pin number</p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Enable device immediately
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add Device'}
            </button>
          </div>
        </form>
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
      await updateDoc(doc(db, 'module_devices', device.id), {
        ...formData,
        updatedAt: Timestamp.now(),
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
      await deleteDoc(doc(db, 'module_devices', device.id));
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
