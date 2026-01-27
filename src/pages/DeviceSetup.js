import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const CROP_PRESETS = {
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
    const { currentUser, currentOrganization, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [deviceId, setDeviceId] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('microgreens');
    const [cropConfig, setCropConfig] = useState(CROP_PRESETS.microgreens);
    const [customCropType, setCustomCropType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [deviceExists, setDeviceExists] = useState(null);
    // Show loading while checking organization
    if (authLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading..." })] }) }));
    }
    // Show NoOrganization if user doesn't have an organization
    if (!currentOrganization) {
        return _jsx(NoOrganization, {});
    }
    const handlePresetChange = (presetKey) => {
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
                    }
                    else {
                        setDeviceExists(true);
                        // Pre-fill config if device has one
                        if (data.cropConfig) {
                            setCropConfig(data.cropConfig);
                            setSelectedPreset('custom');
                        }
                    }
                }
                else {
                    // Device is open for all users
                    setDeviceExists(true);
                    // Pre-fill config if device has one
                    if (data.cropConfig) {
                        setCropConfig(data.cropConfig);
                        setSelectedPreset('custom');
                    }
                }
            }
            else {
                // Device doesn't exist - must power on Pi first
                setDeviceExists(false);
                setError('Device not found. Make sure your Raspberry Pi is powered on and connected to WiFi. Wait 30-60 seconds for it to register.');
            }
        }
        catch (err) {
            console.error('Error verifying device:', err);
            setError('Failed to verify device. Please try again.');
        }
        finally {
            setVerifying(false);
        }
    };
    const handleSubmit = async () => {
        if (!currentUser)
            return;
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
            const updateData = {
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
            }
            else {
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
        }
        catch (err) {
            console.error('Error registering device:', err);
            setError(err.message || 'Failed to register device');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "max-w-2xl mx-auto py-8", children: _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-white", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Set Up Your Device" }), _jsx("p", { className: "text-primary-100 mt-1", children: "Connect your HarvestPilot hardware to start growing" })] }), _jsx("div", { className: "flex border-b", children: [1, 2, 3].map((s) => (_jsxs("div", { className: `flex-1 py-3 text-center text-sm font-medium ${step === s
                            ? 'border-b-2 border-primary-500 text-primary-600'
                            : step > s
                                ? 'text-green-600'
                                : 'text-gray-400'}`, children: [step > s ? '✓ ' : '', s === 1 && 'Device ID', s === 2 && 'Crop Settings', s === 3 && 'Confirm'] }, s))) }), _jsxs("div", { className: "p-6", children: [error && (_jsx("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm", children: error })), step === 1 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Device ID" }), _jsx("p", { className: "text-sm text-gray-500 mb-3", children: "Find this on your Raspberry Pi display or in the HarvestPilot terminal output" }), _jsx("input", { type: "text", value: deviceId, onChange: (e) => {
                                                setDeviceId(e.target.value);
                                                setDeviceExists(null);
                                            }, placeholder: "e.g., hp-12345678", className: "w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" }), deviceExists === true && (_jsx("p", { className: "mt-2 text-sm text-green-600", children: "\u2713 Device found!" }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Device Name (optional)" }), _jsx("input", { type: "text", value: deviceName, onChange: (e) => setDeviceName(e.target.value), placeholder: "e.g., Kitchen Garden, Greenhouse #1", className: "w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-gray-800 mb-2", children: "\uD83D\uDCCB Finding Your Device ID" }), _jsxs("ol", { className: "text-sm text-gray-600 space-y-2 list-decimal list-inside", children: [_jsx("li", { children: "Power on your Raspberry Pi with HarvestPilot installed" }), _jsx("li", { children: "Wait for the system to boot (about 30 seconds)" }), _jsx("li", { children: "Look for the Device ID on the LCD screen or terminal" }), _jsx("li", { children: "It starts with \"hp-\" followed by 8 characters" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: verifyDevice, disabled: verifying || !deviceId.trim(), className: "flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50", children: verifying ? 'Verifying...' : 'Verify Device' }), _jsx("button", { onClick: () => setStep(2), disabled: !deviceId.trim(), className: "flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50", children: "Continue \u2192" })] })] })), step === 2 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "What are you growing?" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: Object.entries(CROP_PRESETS).map(([key, preset]) => (_jsxs("button", { onClick: () => handlePresetChange(key), className: `p-3 border rounded-lg text-left ${selectedPreset === key
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'}`, children: [_jsxs("span", { className: "text-xl mr-2", children: [key === 'microgreens' && '🌿', key === 'lettuce' && '🥬', key === 'herbs' && '🌱', key === 'tomatoes' && '🍅', key === 'peppers' && '🌶️', key === 'custom' && '⚙️'] }), _jsx("span", { className: "text-sm font-medium", children: preset.name })] }, key))) })] }), selectedPreset === 'custom' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Crop Type Name" }), _jsx("input", { type: "text", value: customCropType, onChange: (e) => setCustomCropType(e.target.value), placeholder: "e.g., Spinach, Kale, etc.", className: "w-full border border-gray-300 rounded-lg px-4 py-2" })] })), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-gray-800 mb-3", children: "Growing Parameters" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("label", { className: "text-gray-500", children: "Harvest Days" }), _jsx("input", { type: "number", value: cropConfig.expectedHarvestDays, onChange: (e) => setCropConfig({ ...cropConfig, expectedHarvestDays: parseInt(e.target.value) }), className: "w-full border rounded px-2 py-1 mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-500", children: "Light Schedule" }), _jsxs("div", { className: "flex gap-1 mt-1", children: [_jsx("input", { type: "number", value: cropConfig.lightOnHour, onChange: (e) => setCropConfig({ ...cropConfig, lightOnHour: parseInt(e.target.value) }), className: "w-16 border rounded px-2 py-1", min: "0", max: "23" }), _jsx("span", { className: "py-1", children: "to" }), _jsx("input", { type: "number", value: cropConfig.lightOffHour, onChange: (e) => setCropConfig({ ...cropConfig, lightOffHour: parseInt(e.target.value) }), className: "w-16 border rounded px-2 py-1", min: "0", max: "23" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-500", children: "Irrigation Every (hours)" }), _jsx("input", { type: "number", value: cropConfig.irrigationIntervalHours, onChange: (e) => setCropConfig({ ...cropConfig, irrigationIntervalHours: parseInt(e.target.value) }), className: "w-full border rounded px-2 py-1 mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-500", children: "Irrigation Duration (sec)" }), _jsx("input", { type: "number", value: cropConfig.irrigationDurationSeconds, onChange: (e) => setCropConfig({ ...cropConfig, irrigationDurationSeconds: parseInt(e.target.value) }), className: "w-full border rounded px-2 py-1 mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-500", children: "Target Temp (\u00B0F)" }), _jsxs("div", { className: "flex gap-1 mt-1", children: [_jsx("input", { type: "number", value: cropConfig.tempTargetMin, onChange: (e) => setCropConfig({ ...cropConfig, tempTargetMin: parseInt(e.target.value) }), className: "w-16 border rounded px-2 py-1" }), _jsx("span", { className: "py-1", children: "-" }), _jsx("input", { type: "number", value: cropConfig.tempTargetMax, onChange: (e) => setCropConfig({ ...cropConfig, tempTargetMax: parseInt(e.target.value) }), className: "w-16 border rounded px-2 py-1" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-500", children: "Target Humidity (%)" }), _jsxs("div", { className: "flex gap-1 mt-1", children: [_jsx("input", { type: "number", value: cropConfig.humidityTargetMin, onChange: (e) => setCropConfig({ ...cropConfig, humidityTargetMin: parseInt(e.target.value) }), className: "w-16 border rounded px-2 py-1" }), _jsx("span", { className: "py-1", children: "-" }), _jsx("input", { type: "number", value: cropConfig.humidityTargetMax, onChange: (e) => setCropConfig({ ...cropConfig, humidityTargetMax: parseInt(e.target.value) }), className: "w-16 border rounded px-2 py-1" })] })] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setStep(1), className: "flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200", children: "\u2190 Back" }), _jsx("button", { onClick: () => setStep(3), className: "flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600", children: "Continue \u2192" })] })] })), step === 3 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-green-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-green-800 mb-3", children: "\u2713 Ready to Connect!" }), _jsxs("div", { className: "text-sm text-green-700 space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Device:" }), " ", deviceId, " ", deviceName && `(${deviceName})`] }), _jsxs("p", { children: [_jsx("strong", { children: "Crop:" }), " ", selectedPreset === 'custom' ? customCropType : CROP_PRESETS[selectedPreset].name] }), _jsxs("p", { children: [_jsx("strong", { children: "Light Schedule:" }), " ", cropConfig.lightOnHour, ":00 - ", cropConfig.lightOffHour, ":00"] }), _jsxs("p", { children: [_jsx("strong", { children: "Irrigation:" }), " Every ", cropConfig.irrigationIntervalHours, "h for ", cropConfig.irrigationDurationSeconds, "s"] })] })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-blue-800 mb-2", children: "\uD83D\uDCE1 What happens next?" }), _jsxs("ol", { className: "text-sm text-blue-700 space-y-2 list-decimal list-inside", children: [_jsx("li", { children: "Your device settings will be saved to the cloud" }), _jsx("li", { children: "When your Raspberry Pi connects, it will receive these settings" }), _jsx("li", { children: "Automation will begin based on your configuration" }), _jsx("li", { children: "You can monitor and control everything from the dashboard" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setStep(2), className: "flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200", children: "\u2190 Back" }), _jsx("button", { onClick: handleSubmit, disabled: loading, className: "flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50", children: loading ? 'Setting Up...' : 'Complete Setup 🚀' })] })] }))] })] }) }));
}
