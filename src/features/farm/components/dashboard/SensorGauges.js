import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function Gauge({ label, value, unit, targetMin, targetMax, icon, warningLow, warningHigh }) {
    const getStatusColor = () => {
        if (value === null)
            return 'text-gray-400';
        if (warningLow !== undefined && value < warningLow)
            return 'text-red-500';
        if (warningHigh !== undefined && value > warningHigh)
            return 'text-red-500';
        if (targetMin !== undefined && targetMax !== undefined) {
            if (value < targetMin || value > targetMax)
                return 'text-yellow-500';
        }
        return 'text-green-500';
    };
    const getTargetText = () => {
        if (targetMin === undefined || targetMax === undefined)
            return null;
        return `Target: ${targetMin}-${targetMax}${unit}`;
    };
    return (_jsxs("div", { className: "flex flex-col items-center p-3", children: [_jsx("span", { className: "text-2xl mb-1", children: icon }), _jsx("span", { className: `text-2xl font-bold ${getStatusColor()}`, children: value !== null ? `${Math.round(value)}${unit}` : '--' }), _jsx("span", { className: "text-xs text-gray-500 mt-1", children: label }), getTargetText() && (_jsx("span", { className: "text-xs text-gray-400", children: getTargetText() }))] }));
}
export function SensorGauges({ currentReading, cropConfig }) {
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 uppercase tracking-wide mb-3", children: "Current Conditions" }), _jsxs("div", { className: "grid grid-cols-4 gap-2", children: [_jsx(Gauge, { label: "Temperature", value: currentReading?.temperature ?? null, unit: "\u00B0F", targetMin: cropConfig?.tempTargetMin, targetMax: cropConfig?.tempTargetMax, icon: "\uD83C\uDF21\uFE0F", warningHigh: 95 }), _jsx(Gauge, { label: "Humidity", value: currentReading?.humidity ?? null, unit: "%", targetMin: cropConfig?.humidityTargetMin, targetMax: cropConfig?.humidityTargetMax, icon: "\uD83D\uDCA7" }), _jsx(Gauge, { label: "Soil", value: currentReading?.soilMoisture ?? null, unit: "%", icon: "\uD83C\uDF31" }), _jsx(Gauge, { label: "Water", value: currentReading?.waterLevel ?? null, unit: "%", icon: "\uD83D\uDCA6", warningLow: 20 })] }), currentReading && (_jsxs("div", { className: "mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500", children: [_jsxs("span", { children: ["Lights: ", currentReading.lightOn ? '🔆 ON' : '⚫ OFF'] }), _jsxs("span", { children: ["Pump: ", currentReading.pumpOn ? '💧 Running' : '⏸️ Idle'] })] }))] }));
}
