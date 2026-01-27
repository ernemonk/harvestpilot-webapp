import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCard } from './AlertCard';
export function AlertList({ alerts, onAcknowledge, emptyMessage = 'No alerts' }) {
    if (alerts.length === 0) {
        return (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx("span", { className: "text-4xl mb-2 block", children: "\u2713" }), _jsx("p", { children: emptyMessage })] }));
    }
    return (_jsx("div", { className: "space-y-4", children: alerts.map((alert) => (_jsx(AlertCard, { alert: alert, onAcknowledge: onAcknowledge }, alert.id))) }));
}
