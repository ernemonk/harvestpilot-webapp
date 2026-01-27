import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Module Overview Section
 *
 * Displays module status, quick actions, and current sensor readings.
 * Apple-like design: spacious, clear hierarchy, premium feel.
 */
import { useState } from 'react';
import { useDeviceState } from '../../hooks/useDeviceState';
import { useCommands } from '../../hooks/useCommands';
import GPIOPinManager from './GPIOPinManager';
import ActuatorsControl from './ActuatorsControl';
export default function ModuleOverview({ module }) {
    const { state: deviceState, loading } = useDeviceState(module.deviceId);
    const commands = useCommands(module.deviceId);
    const [actionLoading, setActionLoading] = useState(null);
    const handleQuickAction = async (action) => {
        setActionLoading(action);
        try {
            switch (action) {
                case 'pump_start':
                    await commands.sendCommand('run_pump', { duration: 30 });
                    break;
                case 'pump_stop':
                    await commands.sendCommand('stop_pump', {});
                    break;
                case 'lights_on':
                    await commands.sendCommand('set_lights', { brightness: 100 });
                    break;
                case 'lights_off':
                    await commands.sendCommand('set_lights', { brightness: 0 });
                    break;
            }
        }
        catch (err) {
            console.error('Quick action failed:', err);
        }
        finally {
            setActionLoading(null);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx(StatusCard, { icon: "\uD83D\uDFE2", title: "System Status", value: module.status === 'online' ? 'Online' : 'Offline', subtitle: `Last check-in: ${formatLastSeen(module.lastHeartbeat)}`, status: module.status }), _jsx(StatusCard, { icon: "\uD83C\uDF10", title: "Network", value: module.ipAddress || 'Not Available', subtitle: `MAC: ${module.macAddress || 'Unknown'}` }), _jsx(StatusCard, { icon: "\u26A1", title: "Firmware", value: module.firmwareVersion || 'Unknown', subtitle: "System up to date" })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(QuickActionButton, { icon: "\uD83D\uDCA7", label: "Start Pump", sublabel: "30 seconds", onClick: () => handleQuickAction('pump_start'), loading: actionLoading === 'pump_start', disabled: module.status !== 'online' }), _jsx(QuickActionButton, { icon: "\uD83D\uDED1", label: "Stop Pump", onClick: () => handleQuickAction('pump_stop'), loading: actionLoading === 'pump_stop', disabled: module.status !== 'online', variant: "secondary" }), _jsx(QuickActionButton, { icon: "\uD83D\uDCA1", label: "Lights On", onClick: () => handleQuickAction('lights_on'), loading: actionLoading === 'lights_on', disabled: module.status !== 'online' }), _jsx(QuickActionButton, { icon: "\uD83C\uDF19", label: "Lights Off", onClick: () => handleQuickAction('lights_off'), loading: actionLoading === 'lights_off', disabled: module.status !== 'online', variant: "secondary" })] })] }), deviceState?.currentReading && (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-6", children: "Current Conditions" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6", children: [_jsx(MetricCard, { icon: "\uD83C\uDF21\uFE0F", label: "Temperature", value: deviceState.currentReading.temperature, unit: "\u00B0F", trend: "stable" }), _jsx(MetricCard, { icon: "\uD83D\uDCA7", label: "Humidity", value: deviceState.currentReading.humidity, unit: "%", trend: "up" }), _jsx(MetricCard, { icon: "\uD83C\uDF31", label: "Soil Moisture", value: deviceState.currentReading.soilMoisture, unit: "%", trend: "stable" }), _jsx(MetricCard, { icon: "\uD83D\uDCA6", label: "Water Level", value: deviceState.currentReading.waterLevel, unit: "%", trend: "down" })] })] })), deviceState && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(AutopilotCard, { enabled: deviceState.autopilotMode === 'on', lastIrrigation: deviceState.lastIrrigationAt, nextIrrigation: deviceState.nextIrrigationAt, lightsOn: deviceState.lightsOn }), _jsx(CropInfoCard, { cropConfig: deviceState.cropConfig })] })), _jsx(GPIOPinManager, { deviceId: module.deviceId, platform: module.platform || 'raspberry-pi' }), _jsx(ActuatorsControl, { deviceId: module.deviceId })] }));
}
// ============================================
// SUB-COMPONENTS
// ============================================
function StatusCard({ icon, title, value, subtitle, status }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-3", children: [_jsx("span", { className: "text-3xl", children: icon }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-sm font-medium text-gray-500", children: title }) })] }), _jsx("p", { className: `text-2xl font-semibold mb-1 ${status === 'online' ? 'text-green-600' :
                    status === 'offline' ? 'text-gray-400' :
                        'text-gray-900'}`, children: value }), _jsx("p", { className: "text-xs text-gray-500", children: subtitle })] }));
}
function QuickActionButton({ icon, label, sublabel, onClick, loading, disabled, variant = 'primary' }) {
    return (_jsx("button", { onClick: onClick, disabled: disabled || loading, className: `
        relative p-4 rounded-lg border-2 transition-all
        ${disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            : variant === 'secondary'
                ? 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                : 'border-primary-200 bg-primary-50 hover:border-primary-400 hover:shadow-sm'}
      `, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl mb-1", children: icon }), _jsx("div", { className: "text-sm font-medium text-gray-900", children: label }), sublabel && _jsx("div", { className: "text-xs text-gray-500 mt-0.5", children: sublabel }), loading && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg", children: _jsx("div", { className: "w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" }) }))] }) }));
}
function MetricCard({ icon, label, value, unit, trend }) {
    const trendColors = {
        up: 'text-green-600',
        down: 'text-red-600',
        stable: 'text-gray-400'
    };
    const trendIcons = {
        up: '↗',
        down: '↘',
        stable: '→'
    };
    return (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl mb-2", children: icon }), _jsxs("div", { className: "text-3xl font-bold text-gray-900 mb-1", children: [Math.round(value), _jsx("span", { className: "text-lg text-gray-500", children: unit })] }), _jsx("div", { className: "text-sm text-gray-500", children: label }), _jsxs("div", { className: `text-xs mt-1 ${trendColors[trend]}`, children: [trendIcons[trend], " ", trend] })] }));
}
function AutopilotCard({ enabled, lastIrrigation, nextIrrigation, lightsOn }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Autopilot" }), _jsx("div", { className: `px-3 py-1 rounded-full text-sm font-medium ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`, children: enabled ? '🟢 Active' : '⚫ Inactive' })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-gray-100", children: [_jsx("span", { className: "text-gray-600", children: "Lights" }), _jsx("span", { className: "font-medium text-gray-900", children: lightsOn ? '💡 On' : '🌙 Off' })] }), _jsxs("div", { className: "flex items-center justify-between py-2 border-b border-gray-100", children: [_jsx("span", { className: "text-gray-600", children: "Last Irrigation" }), _jsx("span", { className: "font-medium text-gray-900", children: lastIrrigation ? formatTimeAgo(lastIrrigation) : 'Never' })] }), _jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "text-gray-600", children: "Next Irrigation" }), _jsx("span", { className: "font-medium text-gray-900", children: nextIrrigation ? formatTimeUntil(nextIrrigation) : 'Not scheduled' })] })] })] }));
}
function CropInfoCard({ cropConfig }) {
    if (!cropConfig) {
        return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Current Crop" }), _jsxs("div", { className: "text-center py-6 text-gray-500", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83C\uDF31" }), _jsx("p", { children: "No crop configured" })] })] }));
    }
    const daysGrowing = Math.floor((Date.now() - cropConfig.plantedAt) / (1000 * 60 * 60 * 24));
    const progress = (daysGrowing / cropConfig.expectedHarvestDays) * 100;
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Current Crop" }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-lg font-medium text-gray-900", children: cropConfig.cropType }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Day ", daysGrowing, " of ", cropConfig.expectedHarvestDays] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "bg-primary-600 h-2 rounded-full transition-all duration-500", style: { width: `${Math.min(progress, 100)}%` } }) })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Planted" }), _jsx("span", { className: "font-medium text-gray-900", children: new Date(cropConfig.plantedAt).toLocaleDateString() })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Est. Harvest" }), _jsx("span", { className: "font-medium text-gray-900", children: new Date(cropConfig.plantedAt + cropConfig.expectedHarvestDays * 24 * 60 * 60 * 1000).toLocaleDateString() })] })] })] }));
}
// ============================================
// UTILITIES
// ============================================
function formatLastSeen(timestamp) {
    if (!timestamp)
        return 'Never';
    const seconds = timestamp.seconds || timestamp;
    const now = Date.now() / 1000;
    const diff = now - seconds;
    if (diff < 60)
        return 'Just now';
    if (diff < 3600)
        return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)
        return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1)
        return 'Just now';
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
function formatTimeUntil(timestamp) {
    const now = Date.now();
    const diff = timestamp - now;
    if (diff < 0)
        return 'Overdue';
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60)
        return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `in ${days}d`;
}
