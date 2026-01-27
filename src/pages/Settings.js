import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Settings Page - Crop config and device info
 */
import { useState } from 'react';
import { useDeviceState } from '../hooks/useDeviceState';
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
    // For now, use a placeholder deviceId - in production this would come from user profile
    const deviceId = 'demo-device';
    const { state, loading, error } = useDeviceState(deviceId);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const updateCropConfig = async (updates) => {
        if (!deviceId || !state?.cropConfig)
            return;
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
        }
        catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
            console.error('Failed to update crop config:', err);
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" }) }));
    }
    if (error || !state) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center text-red-600", children: [_jsx("p", { className: "text-xl mb-2", children: "\u26A0\uFE0F Error loading settings" }), _jsx("p", { className: "text-sm", children: error?.message || 'Device not found' })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-2xl mx-auto p-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Settings" }), message && (_jsx("div", { className: `mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`, children: message.text })), _jsxs("section", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Crop Configuration" }), state.cropConfig ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Crop Type" }), _jsx("select", { value: state.cropConfig.cropType, onChange: (e) => updateCropConfig({ cropType: e.target.value }), disabled: saving, className: "w-full border border-gray-300 rounded-md px-3 py-2", children: CROP_TYPES.map((crop) => (_jsx("option", { value: crop.value, children: crop.label }, crop.value))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Planted Date" }), _jsx("input", { type: "date", value: new Date(state.cropConfig.plantedAt).toISOString().split('T')[0], onChange: (e) => updateCropConfig({ plantedAt: new Date(e.target.value).getTime() }), disabled: saving, className: "w-full border border-gray-300 rounded-md px-3 py-2" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Expected Harvest (days)" }), _jsx("input", { type: "number", value: state.cropConfig.expectedHarvestDays, onChange: (e) => updateCropConfig({ expectedHarvestDays: parseInt(e.target.value) }), disabled: saving, min: 1, max: 30, className: "w-full border border-gray-300 rounded-md px-3 py-2" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Light On Hour (0-23)" }), _jsx("input", { type: "number", value: state.cropConfig.lightOnHour, onChange: (e) => updateCropConfig({ lightOnHour: parseInt(e.target.value) }), disabled: saving, min: 0, max: 23, className: "w-full border border-gray-300 rounded-md px-3 py-2" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Light Off Hour (0-23)" }), _jsx("input", { type: "number", value: state.cropConfig.lightOffHour, onChange: (e) => updateCropConfig({ lightOffHour: parseInt(e.target.value) }), disabled: saving, min: 0, max: 23, className: "w-full border border-gray-300 rounded-md px-3 py-2" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Irrigation Interval (hours)" }), _jsx("input", { type: "number", value: state.cropConfig.irrigationIntervalHours, onChange: (e) => updateCropConfig({ irrigationIntervalHours: parseInt(e.target.value) }), disabled: saving, min: 1, max: 24, className: "w-full border border-gray-300 rounded-md px-3 py-2" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Irrigation Duration (seconds)" }), _jsx("input", { type: "number", value: state.cropConfig.irrigationDurationSeconds, onChange: (e) => updateCropConfig({ irrigationDurationSeconds: parseInt(e.target.value) }), disabled: saving, min: 10, max: 300, className: "w-full border border-gray-300 rounded-md px-3 py-2" })] })] })] })) : (_jsx("p", { className: "text-gray-500", children: "No crop configured yet." }))] }), _jsxs("section", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Device Info" }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Device ID" }), _jsx("span", { className: "font-mono text-gray-900", children: state.deviceId })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Firmware Version" }), _jsx("span", { className: "text-gray-900", children: state.firmwareVersion || 'Unknown' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Last Heartbeat" }), _jsx("span", { className: "text-gray-900", children: new Date(state.lastHeartbeat).toLocaleString() })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Last Sync" }), _jsx("span", { className: "text-gray-900", children: state.lastSyncAt
                                                ? new Date(state.lastSyncAt).toLocaleString()
                                                : 'Never' })] })] })] })] }) }));
}
