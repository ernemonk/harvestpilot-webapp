import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Devices Section
 *
 * Manage sensors and actuators associated with this farm module.
 * Features: Add device, device list, device details drawer, calibration.
 */
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useGPIOActuators } from '../../hooks/useGPIOActuators';
export default function DevicesSection({ moduleId }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    // Subscribe to devices for this module
    useEffect(() => {
        const devicesRef = collection(db, 'module_devices');
        const q = query(devicesRef, where('moduleId', '==', moduleId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const deviceData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
        return _jsx(DevicesSkeleton, {});
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Devices" }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [devices.length, " ", devices.length === 1 ? 'device' : 'devices', " registered"] })] }), _jsxs("button", { onClick: () => setShowAddDevice(true), className: "btn-primary flex items-center space-x-2", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }), _jsx("span", { children: "Add Device" })] })] }), devices.length === 0 ? (_jsx(EmptyState, { onAdd: () => setShowAddDevice(true) })) : (_jsxs("div", { className: "space-y-6", children: [sensors.length > 0 && (_jsx(DeviceGroup, { title: "Sensors", icon: "\uD83D\uDCE1", devices: sensors, onDeviceClick: setSelectedDevice, moduleId: moduleId })), actuators.length > 0 && (_jsx(DeviceGroup, { title: "Actuators", icon: "\u2699\uFE0F", devices: actuators, onDeviceClick: setSelectedDevice, moduleId: moduleId })), cameras.length > 0 && (_jsx(DeviceGroup, { title: "Cameras", icon: "\uD83D\uDCF7", devices: cameras, onDeviceClick: setSelectedDevice, moduleId: moduleId }))] })), showAddDevice && (_jsx(AddDeviceModal, { moduleId: moduleId, onClose: () => setShowAddDevice(false) })), selectedDevice && (_jsx(DeviceDetailsDrawer, { device: selectedDevice, onClose: () => setSelectedDevice(null), onUpdate: (updated) => setSelectedDevice(updated) }))] }));
}
// ============================================
// SUB-COMPONENTS
// ============================================
function DeviceGroup({ title, icon, devices, onDeviceClick, moduleId }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200 bg-gray-50", children: _jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx("span", { className: "mr-2", children: icon }), title, _jsxs("span", { className: "ml-2 text-sm font-normal text-gray-500", children: ["(", devices.length, ")"] })] }) }), _jsx("div", { className: "divide-y divide-gray-200", children: devices.map((device) => (_jsx(DeviceRow, { device: device, onClick: () => onDeviceClick(device), moduleId: moduleId }, device.id))) })] }));
}
function DeviceRow({ device, onClick, moduleId }) {
    const { actuators, toggleActuator } = useGPIOActuators(moduleId);
    const [toggling, setToggling] = useState(false);
    // Get actuator state from Firestore
    const actuatorState = actuators.find(a => a.bcmPin === device.gpioPin);
    const isOn = actuatorState?.state ?? false;
    const handleToggle = async (e) => {
        e.stopPropagation(); // Prevent opening the drawer
        if (device.type !== 'actuator' || device.gpioPin === undefined)
            return;
        setToggling(true);
        try {
            await toggleActuator(device.gpioPin, !isOn);
        }
        catch (err) {
            console.error('Toggle failed:', err);
        }
        finally {
            setToggling(false);
        }
    };
    const getTypeIcon = () => {
        const icons = {
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
        return icons[device.subtype] || '🔧';
    };
    const getStatusColor = () => {
        if (!device.enabled)
            return 'bg-gray-400';
        if (device.lastReadingAt) {
            const ageMinutes = (Date.now() - device.lastReadingAt.seconds * 1000) / (1000 * 60);
            if (ageMinutes < 5)
                return 'bg-green-500';
        }
        return 'bg-gray-400';
    };
    return (_jsx("div", { className: "w-full px-6 py-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: onClick, className: "flex items-center space-x-4 flex-1 text-left", children: [_jsx("div", { className: "text-3xl", children: getTypeIcon() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("h4", { className: "text-base font-medium text-gray-900 truncate", children: device.name }), _jsx("div", { className: `w-2 h-2 rounded-full ${getStatusColor()}` })] }), _jsxs("div", { className: "flex items-center space-x-3 mt-1 text-sm text-gray-500", children: [_jsx("span", { className: "capitalize", children: device.subtype.replace('_', ' ') }), device.gpioPin !== undefined && _jsxs("span", { children: ["GPIO ", device.gpioPin] }), device.lastReading !== undefined && device.type === 'sensor' && (_jsx("span", { className: "font-medium text-gray-900", children: typeof device.lastReading === 'number' ? Math.round(device.lastReading) : device.lastReading }))] })] })] }), device.type === 'actuator' && (_jsxs("div", { className: "flex items-center space-x-3 ml-4", children: [_jsx("span", { className: `text-sm font-medium ${isOn ? 'text-green-600' : 'text-gray-500'}`, children: isOn ? 'ON' : 'OFF' }), _jsx("button", { onClick: handleToggle, disabled: toggling || device.gpioPin === undefined, className: `relative inline-flex items-center w-14 h-7 rounded-full transition-colors ${isOn ? 'bg-green-500' : 'bg-gray-300'} ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`, children: _jsx("span", { className: `inline-block w-6 h-6 transform rounded-full bg-white shadow-md transition-transform ${isOn ? 'translate-x-7' : 'translate-x-0.5'}`, children: toggling && (_jsx("span", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("span", { className: "w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" }) })) }) })] })), _jsx("button", { onClick: onClick, className: "ml-2 p-2 hover:bg-gray-100 rounded-lg", children: _jsx("svg", { className: "w-5 h-5 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) })] }) }));
}
function EmptyState({ onAdd }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDD27" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No Devices Registered" }), _jsx("p", { className: "text-gray-500 mb-6 max-w-md mx-auto", children: "Add sensors and actuators to start monitoring and controlling your farm module." }), _jsx("button", { onClick: onAdd, className: "btn-primary", children: "Add Your First Device" })] }));
}
function AddDeviceModal({ moduleId, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'sensor',
        subtype: 'temperature',
        gpioPin: '',
        enabled: true,
    });
    const [saving, setSaving] = useState(false);
    const handleSubmit = async (e) => {
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
        }
        catch (err) {
            console.error('Failed to add device:', err);
        }
        finally {
            setSaving(false);
        }
    };
    const sensorTypes = ['temperature', 'humidity', 'soil_moisture', 'water_level', 'ec', 'ph', 'light'];
    const actuatorTypes = ['pump', 'light', 'fan', 'valve', 'motor'];
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Add Device" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Device Name" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "input", placeholder: "e.g., Primary Temperature Sensor", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Device Type" }), _jsxs("select", { value: formData.type, onChange: (e) => setFormData({
                                        ...formData,
                                        type: e.target.value,
                                        subtype: e.target.value === 'sensor' ? 'temperature' : 'pump'
                                    }), className: "input", children: [_jsx("option", { value: "sensor", children: "Sensor" }), _jsx("option", { value: "actuator", children: "Actuator" }), _jsx("option", { value: "camera", children: "Camera" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Specific Type" }), _jsxs("select", { value: formData.subtype, onChange: (e) => setFormData({ ...formData, subtype: e.target.value }), className: "input", children: [formData.type === 'sensor' && sensorTypes.map(type => (_jsx("option", { value: type, children: type.replace('_', ' ').toUpperCase() }, type))), formData.type === 'actuator' && actuatorTypes.map(type => (_jsx("option", { value: type, children: type.toUpperCase() }, type))), formData.type === 'camera' && (_jsx("option", { value: "camera", children: "Camera" }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "GPIO Pin (optional)" }), _jsx("input", { type: "number", value: formData.gpioPin, onChange: (e) => setFormData({ ...formData, gpioPin: e.target.value }), className: "input", placeholder: "e.g., 17", min: "0", max: "27" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Raspberry Pi GPIO pin number" })] }), _jsxs("div", { className: "flex items-center space-x-3 pt-2", children: [_jsx("input", { type: "checkbox", id: "enabled", checked: formData.enabled, onChange: (e) => setFormData({ ...formData, enabled: e.target.checked }), className: "w-4 h-4 text-primary-600 rounded focus:ring-primary-500" }), _jsx("label", { htmlFor: "enabled", className: "text-sm font-medium text-gray-700", children: "Enable device immediately" })] }), _jsxs("div", { className: "flex space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "btn-primary flex-1", children: saving ? 'Adding...' : 'Add Device' })] })] })] }) }));
}
function DeviceDetailsDrawer({ device, onClose, onUpdate }) {
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
        }
        catch (err) {
            console.error('Failed to update device:', err);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this device?'))
            return;
        setDeleting(true);
        try {
            await deleteDoc(doc(db, 'module_devices', device.id));
            onClose();
        }
        catch (err) {
            console.error('Failed to delete device:', err);
            setDeleting(false);
        }
    };
    return (_jsxs("div", { className: "fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto", children: [_jsx("div", { className: "sticky top-0 bg-white border-b border-gray-200 px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Device Details" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: device.name }), _jsx("p", { className: "text-sm text-gray-500 capitalize", children: device.subtype.replace('_', ' ') })] }), !editing && (_jsx("button", { onClick: () => setEditing(true), className: "btn-secondary text-sm", children: "Edit" }))] }), editing ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Device Name" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "input" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "GPIO Pin" }), _jsx("input", { type: "number", value: formData.gpioPin || '', onChange: (e) => setFormData({ ...formData, gpioPin: parseInt(e.target.value) || undefined }), className: "input" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: () => setEditing(false), className: "btn-secondary flex-1", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "btn-primary flex-1", children: saving ? 'Saving...' : 'Save' })] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Type" }), _jsx("span", { className: "font-medium text-gray-900 capitalize", children: device.type })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "GPIO Pin" }), _jsx("span", { className: "font-medium text-gray-900", children: device.gpioPin || 'N/A' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Status" }), _jsx("span", { className: `font-medium ${device.enabled ? 'text-green-600' : 'text-gray-400'}`, children: device.enabled ? 'Enabled' : 'Disabled' })] }), device.lastReading !== undefined && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Last Reading" }), _jsx("span", { className: "font-medium text-gray-900", children: typeof device.lastReading === 'number' ? Math.round(device.lastReading) : device.lastReading.toString() })] }))] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: "Calibration Notes" }), _jsx("textarea", { value: device.calibration?.notes || '', onChange: (e) => setFormData({
                                            ...formData,
                                            calibration: { ...formData.calibration, notes: e.target.value }
                                        }), className: "input", rows: 3, placeholder: "Add calibration notes..." })] }), _jsx("button", { onClick: handleDelete, disabled: deleting, className: "w-full btn-danger", children: deleting ? 'Deleting...' : 'Delete Device' })] }))] })] }));
}
function DevicesSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "w-48 h-8 bg-gray-200 rounded animate-pulse" }), _jsx("div", { className: "w-32 h-10 bg-gray-200 rounded animate-pulse" })] }), [1, 2, 3].map(i => (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("div", { className: "w-32 h-6 bg-gray-200 rounded animate-pulse mb-4" }), _jsx("div", { className: "space-y-3", children: [1, 2, 3].map(j => (_jsx("div", { className: "w-full h-16 bg-gray-200 rounded animate-pulse" }, j))) })] }, i)))] }));
}
