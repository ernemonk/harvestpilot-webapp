import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ScheduleCard({ lastIrrigationAt, nextIrrigationAt, irrigationIntervalHours, }) {
    const formatTimeDiff = (timestamp, isFuture = false) => {
        if (!timestamp)
            return 'Unknown';
        const diffMs = isFuture ? timestamp - Date.now() : Date.now() - timestamp;
        const diffMin = Math.floor(diffMs / (60 * 1000));
        if (diffMin < 0)
            return 'Overdue';
        if (diffMin < 1)
            return isFuture ? 'Soon' : 'Just now';
        if (diffMin < 60)
            return `${diffMin}m ${isFuture ? '' : 'ago'}`;
        const diffHours = Math.floor(diffMin / 60);
        const remainingMin = diffMin % 60;
        if (diffHours < 24) {
            return `${diffHours}h ${remainingMin}m ${isFuture ? '' : 'ago'}`;
        }
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };
    // Generate schedule dots for last 24 hours
    const generateScheduleDots = () => {
        const dots = [];
        const now = Date.now();
        const hoursBack = 24;
        for (let i = 0; i < hoursBack / irrigationIntervalHours; i++) {
            const dotTime = now - (i * irrigationIntervalHours * 60 * 60 * 1000);
            const hour = new Date(dotTime).getHours();
            dots.unshift({ hour, isPast: i > 0 });
        }
        return dots.slice(-6); // Show last 6 irrigation points
    };
    const scheduleDots = generateScheduleDots();
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 uppercase tracking-wide mb-3", children: "Irrigation Schedule" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Last watering:" }), _jsx("span", { className: "font-medium text-gray-900", children: formatTimeDiff(lastIrrigationAt) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Next watering:" }), _jsx("span", { className: "font-medium text-green-600", children: nextIrrigationAt ? `in ${formatTimeDiff(nextIrrigationAt, true)}` : 'Scheduled' })] }), _jsxs("div", { className: "pt-3 border-t border-gray-100", children: [_jsx("div", { className: "flex justify-between items-center mb-2", children: scheduleDots.map((dot, i) => (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${dot.isPast ? 'bg-blue-500' : 'bg-blue-200'}` }), _jsxs("span", { className: "text-xs text-gray-400 mt-1", children: [dot.hour, ":00"] })] }, i))) }), _jsx("div", { className: "h-1 bg-gray-200 rounded relative", children: _jsx("div", { className: "h-full bg-blue-500 rounded", style: { width: '70%' } }) })] }), _jsxs("p", { className: "text-xs text-gray-400", children: ["Every ", irrigationIntervalHours, " hours"] })] })] }));
}
