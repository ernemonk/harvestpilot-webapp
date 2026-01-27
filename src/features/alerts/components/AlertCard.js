import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AlertCard - Individual alert display with acknowledgment
 */
import { useState } from 'react';
import { formatAlertTime } from '../../hooks/useAlerts';
export function AlertCard({ alert, onAcknowledge }) {
    const [expanded, setExpanded] = useState(false);
    const [acknowledging, setAcknowledging] = useState(false);
    const handleAcknowledge = async () => {
        if (!onAcknowledge || alert.acknowledgedAt)
            return;
        setAcknowledging(true);
        try {
            await onAcknowledge(alert.id);
        }
        finally {
            setAcknowledging(false);
        }
    };
    const getSeverityStyles = () => {
        switch (alert.severity) {
            case 'critical':
                return {
                    border: 'border-red-200',
                    bg: 'bg-red-50',
                    icon: '🔴',
                    iconBg: 'bg-red-100',
                };
            case 'warning':
                return {
                    border: 'border-amber-200',
                    bg: 'bg-amber-50',
                    icon: '🟡',
                    iconBg: 'bg-amber-100',
                };
            default:
                return {
                    border: 'border-blue-200',
                    bg: 'bg-blue-50',
                    icon: '🔵',
                    iconBg: 'bg-blue-100',
                };
        }
    };
    const styles = getSeverityStyles();
    const isResolved = !!alert.resolvedAt;
    const isAcknowledged = !!alert.acknowledgedAt;
    return (_jsxs("div", { className: `rounded-lg border ${styles.border} ${isResolved ? 'opacity-60' : ''}`, children: [_jsx("div", { className: `p-4 ${styles.bg} rounded-t-lg`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center`, children: styles.icon }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900", children: alert.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: alert.message }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: formatAlertTime(alert.triggeredAt) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [isResolved && (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full", children: "Resolved" })), isAcknowledged && !isResolved && (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full", children: "Acknowledged" }))] })] }) }), _jsxs("div", { className: "p-4 bg-white rounded-b-lg", children: [(alert.explanation || alert.suggestedAction) && (_jsx("button", { onClick: () => setExpanded(!expanded), className: "text-sm text-blue-600 hover:text-blue-700 mb-2", children: expanded ? '▼ Hide details' : '▶ Show details' })), expanded && (_jsxs("div", { className: "space-y-3 mt-2", children: [alert.explanation && (_jsxs("div", { children: [_jsx("h5", { className: "text-xs font-medium text-gray-500 uppercase", children: "Why this happened" }), _jsx("p", { className: "text-sm text-gray-700 mt-1", children: alert.explanation })] })), alert.suggestedAction && (_jsxs("div", { children: [_jsx("h5", { className: "text-xs font-medium text-gray-500 uppercase", children: "What to do" }), _jsx("p", { className: "text-sm text-gray-700 mt-1", children: alert.suggestedAction })] })), alert.readingSnapshot && (_jsxs("div", { children: [_jsx("h5", { className: "text-xs font-medium text-gray-500 uppercase", children: "Sensor readings at time of alert" }), _jsxs("div", { className: "flex gap-4 mt-1 text-sm text-gray-600", children: [_jsxs("span", { children: ["\uD83C\uDF21\uFE0F ", Math.round(alert.readingSnapshot.temperature), "\u00B0F"] }), _jsxs("span", { children: ["\uD83D\uDCA7 ", Math.round(alert.readingSnapshot.humidity), "%"] }), _jsxs("span", { children: ["\uD83D\uDCA6 ", Math.round(alert.readingSnapshot.waterLevel), "%"] })] })] }))] })), !isResolved && !isAcknowledged && onAcknowledge && (_jsx("button", { onClick: handleAcknowledge, disabled: acknowledging, className: "mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-50", children: acknowledging ? 'Acknowledging...' : 'Acknowledge' }))] })] }));
}
