import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Alerts Page - Alert history with acknowledgment
 */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../hooks/useAlerts';
import { AlertList } from '../components/alerts/AlertList';
import NoOrganization from '../components/ui/NoOrganization';
export default function Alerts() {
    const { currentUser, currentOrganization, loading: authLoading } = useAuth();
    // Get deviceId from user profile or localStorage
    const deviceId = currentUser?.deviceId || localStorage.getItem('harvestpilot_device_id');
    const { alerts, activeAlerts, loading, error, acknowledgeAlert } = useAlerts(deviceId);
    const [filter, setFilter] = useState('active');
    // Show loading while checking organization
    if (authLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading..." })] }) }));
    }
    // Show NoOrganization if user doesn't have an organization
    if (!currentOrganization) {
        return _jsx(NoOrganization, {});
    }
    // No device registered
    if (!deviceId) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-5xl mb-4", children: "\uD83D\uDD14" }), _jsx("h2", { className: "text-xl font-bold text-gray-800 mb-2", children: "No Device Connected" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Set up a device to see alerts." }), _jsx("a", { href: "/device/setup", className: "text-primary-600 hover:underline", children: "Set Up Device \u2192" })] }) }));
    }
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center text-red-600", children: [_jsx("p", { className: "text-xl mb-2", children: "\u26A0\uFE0F Error loading alerts" }), _jsx("p", { className: "text-sm", children: error.message })] }) }));
    }
    const resolvedAlerts = alerts.filter((a) => a.resolvedAt);
    const getFilteredAlerts = () => {
        switch (filter) {
            case 'active':
                return activeAlerts;
            case 'resolved':
                return resolvedAlerts;
            default:
                return alerts;
        }
    };
    const filteredAlerts = getFilteredAlerts();
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-4xl mx-auto p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Alerts" }), _jsxs("div", { className: "flex gap-1 bg-gray-100 rounded-lg p-1", children: [_jsxs("button", { onClick: () => setFilter('active'), className: `px-3 py-1 rounded-md text-sm font-medium transition ${filter === 'active'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'}`, children: ["Active (", activeAlerts.length, ")"] }), _jsxs("button", { onClick: () => setFilter('resolved'), className: `px-3 py-1 rounded-md text-sm font-medium transition ${filter === 'resolved'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'}`, children: ["Resolved (", resolvedAlerts.length, ")"] }), _jsxs("button", { onClick: () => setFilter('all'), className: `px-3 py-1 rounded-md text-sm font-medium transition ${filter === 'all'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'}`, children: ["All (", alerts.length, ")"] })] })] }), _jsx(AlertList, { alerts: filteredAlerts, onAcknowledge: acknowledgeAlert, emptyMessage: filter === 'active'
                        ? 'No active alerts. Your system is running smoothly! ✓'
                        : filter === 'resolved'
                            ? 'No resolved alerts yet.'
                            : 'No alerts recorded.' })] }) }));
}
