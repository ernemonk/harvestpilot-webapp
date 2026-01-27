import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Actuators Control Panel
 *
 * Quick access to all configured actuators for real-time control
 */
import { useState } from 'react';
import { useGPIOActuators } from '../../hooks/useGPIOActuators';
const FUNCTION_ICONS = {
    pump: '💧',
    lights: '💡',
    heater: '🌡️',
    fan: '🌬️',
    temp_sensor: '🌡️',
    moisture_sensor: '💧',
    light_sensor: '💡',
    generic: '📊',
};
const FUNCTION_LABELS = {
    pump: 'Pump',
    lights: 'Lights',
    heater: 'Heater',
    fan: 'Fan',
    temp_sensor: 'Temperature',
    moisture_sensor: 'Moisture',
    light_sensor: 'Light',
    generic: 'Generic',
};
export default function ActuatorsControl({ deviceId }) {
    const { actuators, loading, error, toggleActuator } = useGPIOActuators(deviceId);
    const [toggling, setToggling] = useState(null);
    const outputActuators = actuators.filter(a => a.mode === 'output');
    const handleToggle = async (bcmPin, currentState) => {
        setToggling(bcmPin);
        try {
            await toggleActuator(bcmPin, !currentState);
        }
        catch (err) {
            console.error('Toggle failed:', err);
        }
        finally {
            setToggling(null);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "\u2699\uFE0F Actuators" }), _jsx("div", { className: "flex items-center justify-center py-8", children: _jsx("div", { className: "w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" }) })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "bg-white rounded-xl border border-red-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "\u2699\uFE0F Actuators" }), _jsx("div", { className: "text-red-600 text-sm", children: error.message })] }));
    }
    if (outputActuators.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "\u2699\uFE0F Actuators" }), _jsxs("div", { className: "text-center py-6 text-gray-500", children: [_jsx("div", { className: "text-3xl mb-2", children: "\uD83D\uDEAB" }), _jsx("p", { children: "No actuators configured" }), _jsx("p", { className: "text-xs mt-2", children: "Add output pins in GPIO configuration" })] })] }));
    }
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "\u2699\uFE0F Actuators" }), _jsxs("span", { className: "text-sm text-gray-500", children: ["(", outputActuators.length, ")"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: outputActuators.map(actuator => {
                    const isOn = actuator.state;
                    const isToggling = toggling === actuator.bcmPin;
                    const functionKey = actuator.function || 'generic';
                    const icon = FUNCTION_ICONS[functionKey] || '📌';
                    const label = FUNCTION_LABELS[functionKey] || actuator.function || 'Actuator';
                    return (_jsx("button", { onClick: () => handleToggle(actuator.bcmPin, isOn), disabled: isToggling, className: `
                relative p-4 rounded-xl border-2 transition-all
                ${isOn
                            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'}
                ${isToggling ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
              `, children: _jsxs("div", { className: "flex flex-col items-center space-y-2", children: [_jsx("div", { className: "text-3xl", children: icon }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "font-semibold text-gray-900", children: label }), _jsxs("div", { className: "text-xs text-gray-500 mt-0.5", children: ["GPIO ", actuator.bcmPin] })] }), _jsx("div", { className: `
                  mt-2 px-3 py-1 rounded-full text-xs font-bold transition-all
                  ${isOn
                                        ? 'bg-green-200 text-green-800'
                                        : 'bg-gray-200 text-gray-600'}
                `, children: isOn ? '🟢 ON' : '⚪ OFF' }), isToggling && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl", children: _jsx("div", { className: "w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" }) }))] }) }, actuator.bcmPin));
                }) })] }));
}
