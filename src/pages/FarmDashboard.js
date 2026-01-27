import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Farm Dashboard - Multi-Device Overview
 *
 * The primary landing page for farmers managing multiple growing racks.
 * Provides at-a-glance status of all devices, recent alerts, and quick access to individual device controls.
 *
 * Design Philosophy:
 * - Calm, spacious layout (not cramped)
 * - Status-first (online/offline, health indicators)
 * - Click to drill down into device details
 * - Aligned with "plug in and walk away" vision
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import NoOrganization from '../components/ui/NoOrganization';
export default function FarmDashboard() {
    const { currentOrganization } = useAuth();
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!currentOrganization) {
            setLoading(false);
            return;
        }
        // Real-time listener for all devices
        const devicesRef = collection(db, 'devices');
        const devicesQuery = query(devicesRef);
        const unsubscribeDevices = onSnapshot(devicesQuery, (snapshot) => {
            const deviceData = snapshot.docs.map(doc => {
                const data = doc.data();
                const lastHeartbeat = data.lastHeartbeat;
                // Use the stored status field from Firebase (computed on backend)
                // Fall back to computing from heartbeat if status is missing
                let status = data.status || 'offline';
                if (!data.status && lastHeartbeat) {
                    const now = Timestamp.now();
                    const minutesSinceHeartbeat = (now.seconds - lastHeartbeat.seconds) / 60;
                    status = minutesSinceHeartbeat < 5 ? 'online' : 'offline';
                }
                return {
                    deviceId: doc.id,
                    deviceName: data.deviceName || doc.id,
                    status,
                    lastHeartbeat,
                    temperature: data.currentReading?.temperature,
                    humidity: data.currentReading?.humidity,
                    soilMoisture: data.currentReading?.soilMoisture,
                    waterLevel: data.currentReading?.waterLevel,
                    cropType: data.cropConfig?.cropType,
                    plantedAt: data.cropConfig?.plantedAt,
                    estimatedHarvestDays: data.cropConfig?.estimatedHarvestDays || 30,
                    currentDay: data.cropConfig?.plantedAt
                        ? Math.floor((now.seconds - data.cropConfig.plantedAt.seconds) / 86400)
                        : undefined
                };
            });
            setDevices(deviceData);
            setLoading(false);
        });
        // Real-time listener for recent alerts
        const alertsRef = collection(db, 'alerts');
        const alertsQuery = query(alertsRef, where('organizationId', '==', currentOrganization.id));
        const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
            const alertData = snapshot.docs
                .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
                .filter(alert => !alert.acknowledged)
                .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
                .slice(0, 5); // Show 5 most recent
            setAlerts(alertData);
        });
        return () => {
            unsubscribeDevices();
            unsubscribeAlerts();
        };
    }, [currentOrganization]);
    if (!currentOrganization) {
        return _jsx(NoOrganization, {});
    }
    const onlineCount = devices.filter(d => d.status === 'online').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: currentOrganization.name }), _jsxs("p", { className: "text-lg text-gray-600", children: [devices.length, " ", devices.length === 1 ? 'device' : 'devices', " \u00B7 ", onlineCount, " online", criticalAlerts > 0 && (_jsxs("span", { className: "ml-3 text-red-600 font-medium", children: ["\u00B7 ", criticalAlerts, " critical ", criticalAlerts === 1 ? 'alert' : 'alerts'] }))] })] }), criticalAlerts > 0 && (_jsx("div", { className: "mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-6 w-6 text-red-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Critical Alerts Require Attention" }), _jsx("div", { className: "mt-2 text-sm text-red-700", children: alerts.filter(a => a.severity === 'critical').slice(0, 3).map(alert => (_jsxs("div", { className: "mb-1", children: ["\u2022 ", alert.deviceName || alert.deviceId, ": ", alert.message] }, alert.id))) }), _jsx("div", { className: "mt-3", children: _jsx(NavLink, { to: "/alerts", className: "text-sm font-medium text-red-800 hover:text-red-900 underline", children: "View all alerts \u2192" }) })] })] }) })), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "text-gray-400", children: "Loading devices..." }) })) : devices.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200", children: [_jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900", children: "No devices registered" }), _jsx("p", { className: "mt-2 text-sm text-gray-500 max-w-md mx-auto", children: "Set up your first HarvestPilot device to start monitoring your farm." }), _jsx("div", { className: "mt-6", children: _jsx(NavLink, { to: "/device/setup", className: "inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors", children: "Set Up Device" }) })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: devices.map(device => (_jsx(DeviceCard, { device: device, navigate: navigate }, device.deviceId))) })), devices.length > 0 && alerts.length > 0 && (_jsxs("div", { className: "mt-12", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Recent Activity" }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200", children: alerts.slice(0, 5).map(alert => (_jsx("div", { className: "p-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `flex-shrink-0 w-2 h-2 mt-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' :
                                                    alert.severity === 'warning' ? 'bg-yellow-500' :
                                                        'bg-blue-500'}` }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: alert.deviceName || alert.deviceId }), _jsx("p", { className: "text-sm text-gray-600 mt-0.5", children: alert.message })] })] }), _jsx("span", { className: "text-xs text-gray-500 whitespace-nowrap ml-4", children: formatTimeAgo(alert.timestamp) })] }) }, alert.id))) })] }))] }));
}
// Device Card Component
function DeviceCard({ device, navigate }) {
    const isOnline = device.status === 'online';
    const harvestProgress = device.currentDay && device.estimatedHarvestDays
        ? Math.min((device.currentDay / device.estimatedHarvestDays) * 100, 100)
        : 0;
    const daysRemaining = device.currentDay && device.estimatedHarvestDays
        ? Math.max(device.estimatedHarvestDays - device.currentDay, 0)
        : null;
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-primary-500 transition-all hover:shadow-md overflow-hidden", children: [_jsxs("div", { className: "p-6 pb-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-1", children: device.deviceName }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}` }), _jsx("span", { className: `text-sm font-medium ${isOnline ? 'text-green-700' : 'text-gray-500'}`, children: isOnline ? 'Online' : 'Offline' })] })] }), _jsx("span", { className: "text-3xl", children: "\uD83C\uDF31" })] }), isOnline && (_jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [_jsxs("div", { className: "bg-orange-50 rounded-lg p-3", children: [_jsx("div", { className: "text-xs font-medium text-orange-900 mb-1", children: "Temperature" }), _jsx("div", { className: "text-lg font-bold text-orange-700", children: device.temperature ? `${Math.round(device.temperature)}°F` : '--' })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-3", children: [_jsx("div", { className: "text-xs font-medium text-blue-900 mb-1", children: "Humidity" }), _jsx("div", { className: "text-lg font-bold text-blue-700", children: device.humidity ? `${Math.round(device.humidity)}%` : '--' })] })] })), device.cropType && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: device.cropType }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Day ", device.currentDay || 0, " of ", device.estimatedHarvestDays] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "bg-primary-600 h-2 rounded-full transition-all duration-500", style: { width: `${harvestProgress}%` } }) }), daysRemaining !== null && (_jsx("p", { className: "text-xs text-gray-600 mt-1", children: daysRemaining === 0 ? '🎉 Ready to harvest!' : `${daysRemaining} days to harvest` }))] }))] }), _jsx("div", { className: "border-t border-gray-200 px-6 py-4 bg-gray-50", children: _jsx("button", { onClick: () => navigate(`/farm-module/${device.deviceId}`), className: "w-full px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors", children: "View Details" }) })] }));
}
// Time formatting utility
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const then = timestamp.seconds * 1000;
    const diffSeconds = Math.floor((now - then) / 1000);
    if (diffSeconds < 60)
        return 'just now';
    if (diffSeconds < 3600)
        return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400)
        return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
}
