import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AlertBanner({ alert, onViewDetails }) {
    const bgColor = alert.severity === 'critical'
        ? 'bg-red-600'
        : alert.severity === 'warning'
            ? 'bg-amber-500'
            : 'bg-blue-500';
    return (_jsx("div", { className: `${bgColor} text-white px-4 py-3`, children: _jsxs("div", { className: "flex items-center justify-between max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xl", children: alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️' }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: alert.title }), _jsx("span", { className: "mx-2", children: "\u2014" }), _jsx("span", { children: alert.message })] })] }), onViewDetails && (_jsx("button", { onClick: onViewDetails, className: "px-3 py-1 bg-white/20 rounded text-sm font-medium hover:bg-white/30", children: "View Details" }))] }) }));
}
