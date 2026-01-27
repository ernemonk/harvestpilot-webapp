import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MVP Dashboard - Analytics-first device monitoring
 *
 * This is the new single-device focused dashboard per the MVP plan.
 */
import { useAuth } from '../contexts/AuthContext';
import { useDeviceState, isDeviceOnline } from '../hooks/useDeviceState';
import { useHourlyHistory } from '../hooks/useHourlyHistory';
import { useAlerts } from '../hooks/useAlerts';
import { HealthCard } from '../components/dashboard/HealthCard';
import { SensorGauges } from '../components/dashboard/SensorGauges';
import { ScheduleCard } from '../components/dashboard/ScheduleCard';
import { ControlPanel } from '../components/dashboard/ControlPanel';
import { AlertBanner } from '../components/alerts/AlertBanner';
export default function DashboardMVP() {
    // For MVP, get deviceId from user profile or use a default
    const { currentUser } = useAuth();
    const deviceId = currentUser?.deviceId || 'demo-device';
    const { state, loading: stateLoading, error: stateError } = useDeviceState(deviceId);
    const { data: history, loading: historyLoading } = useHourlyHistory(deviceId, 24);
    const { criticalAlert, activeAlerts } = useAlerts(deviceId);
    if (stateLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading device data..." })] }) }));
    }
    if (stateError) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsxs("div", { className: "text-center text-red-600", children: [_jsx("p", { className: "text-xl mb-2", children: "\u26A0\uFE0F Error loading device" }), _jsx("p", { className: "text-sm", children: stateError.message })] }) }));
    }
    if (!state) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl mb-2", children: "\uD83D\uDCE1 No device connected" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Set up your HarvestPilot device to get started." }), _jsx("a", { href: "/setup", className: "inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600", children: "Set Up Device" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [criticalAlert && (_jsx(AlertBanner, { alert: criticalAlert, onViewDetails: () => window.location.href = '/alerts' })), _jsxs("div", { className: "max-w-6xl mx-auto p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Dashboard" }), activeAlerts.length > 0 && (_jsxs("a", { href: "/alerts", className: "px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm", children: [activeAlerts.length, " active alert", activeAlerts.length !== 1 ? 's' : ''] }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(HealthCard, { status: isDeviceOnline(state) ? 'online' : 'offline', autopilotMode: state.autopilotMode, lastHeartbeat: state.lastHeartbeat, failsafeTriggered: state.failsafeTriggered, failsafeReason: state.failsafeReason }), _jsx(SensorGauges, { currentReading: state.currentReading, cropConfig: state.cropConfig })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 uppercase tracking-wide mb-3", children: "Temperature & Humidity (Last 24 Hours)" }), historyLoading ? (_jsx("div", { className: "h-48 flex items-center justify-center text-gray-400", children: "Loading chart data..." })) : history.length === 0 ? (_jsx("div", { className: "h-48 flex items-center justify-center text-gray-400", children: "No historical data yet. Data will appear after the first hour of operation." })) : (_jsx("div", { className: "h-48 flex items-center justify-center text-gray-400", children: _jsxs("div", { className: "text-center", children: [_jsxs("p", { children: ["\uD83D\uDCCA ", history.length, " data points available"] }), _jsxs("p", { className: "text-sm mt-1", children: ["Temp range: ", Math.round(Math.min(...history.map(h => h.tempMin))), "\u00B0F -", Math.round(Math.max(...history.map(h => h.tempMax))), "\u00B0F"] })] }) }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(ScheduleCard, { lastIrrigationAt: state.lastIrrigationAt, nextIrrigationAt: state.nextIrrigationAt, irrigationIntervalHours: state.cropConfig?.irrigationIntervalHours || 4 }), _jsx(ControlPanel, { deviceId: deviceId, autopilotMode: state.autopilotMode, lightsOn: state.lightsOn, failsafeTriggered: state.failsafeTriggered, waterLevel: state.currentReading?.waterLevel || 0 })] }), state.cropConfig && (_jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 uppercase tracking-wide", children: "Crop Info" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 mt-1", children: state.cropConfig.cropType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })] }), _jsxs("div", { className: "text-right text-sm text-gray-600", children: [_jsxs("p", { children: ["Planted: ", new Date(state.cropConfig.plantedAt).toLocaleDateString()] }), _jsxs("p", { children: ["Est. harvest: ", new Date(state.cropConfig.plantedAt +
                                                    state.cropConfig.expectedHarvestDays * 24 * 60 * 60 * 1000).toLocaleDateString(), " (", state.cropConfig.expectedHarvestDays, " days)"] })] })] }) }))] })] }));
}
