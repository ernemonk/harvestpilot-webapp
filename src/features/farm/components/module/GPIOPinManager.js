import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * GPIO Pin Configuration Component
 *
 * Displays available GPIO pins for Raspberry Pi and allows configuration
 * Supports real-time toggle via Firestore
 */
import { useState } from 'react';
import { useGPIOActuators } from '../../hooks/useGPIOActuators';
// Raspberry Pi GPIO pin mappings
const RASPBERRY_PI_PINS = [
    { pin: 3, bcmPin: 2, name: 'SDA1', mode: 'unused' },
    { pin: 5, bcmPin: 3, name: 'SCL1', mode: 'unused' },
    { pin: 7, bcmPin: 4, name: 'GPIO4', mode: 'unused' },
    { pin: 8, bcmPin: 14, name: 'TXD', mode: 'unused' },
    { pin: 10, bcmPin: 15, name: 'RXD', mode: 'unused' },
    { pin: 11, bcmPin: 17, name: 'GPIO17', mode: 'unused' },
    { pin: 12, bcmPin: 18, name: 'GPIO18', mode: 'unused' },
    { pin: 13, bcmPin: 27, name: 'GPIO27', mode: 'unused' },
    { pin: 15, bcmPin: 22, name: 'GPIO22', mode: 'unused' },
    { pin: 16, bcmPin: 23, name: 'GPIO23', mode: 'unused' },
    { pin: 18, bcmPin: 24, name: 'GPIO24', mode: 'unused' },
    { pin: 19, bcmPin: 10, name: 'MOSI', mode: 'unused' },
    { pin: 21, bcmPin: 9, name: 'MISO', mode: 'unused' },
    { pin: 22, bcmPin: 25, name: 'GPIO25', mode: 'unused' },
    { pin: 23, bcmPin: 11, name: 'SCLK', mode: 'unused' },
    { pin: 24, bcmPin: 8, name: 'CE0', mode: 'unused' },
    { pin: 26, bcmPin: 7, name: 'CE1', mode: 'unused' },
    { pin: 29, bcmPin: 5, name: 'GPIO5', mode: 'unused' },
    { pin: 31, bcmPin: 6, name: 'GPIO6', mode: 'unused' },
    { pin: 32, bcmPin: 12, name: 'GPIO12', mode: 'unused' },
    { pin: 33, bcmPin: 13, name: 'GPIO13', mode: 'unused' },
    { pin: 35, bcmPin: 19, name: 'GPIO19', mode: 'unused' },
    { pin: 36, bcmPin: 16, name: 'GPIO16', mode: 'unused' },
    { pin: 37, bcmPin: 26, name: 'GPIO26', mode: 'unused' },
    { pin: 38, bcmPin: 20, name: 'GPIO20', mode: 'unused' },
    { pin: 40, bcmPin: 21, name: 'GPIO21', mode: 'unused' },
];
export default function GPIOPinManager({ deviceId }) {
    const { actuators, toggleActuator } = useGPIOActuators(deviceId);
    const [pins, setPins] = useState(RASPBERRY_PI_PINS);
    const [selectedPin, setSelectedPin] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [toggling, setToggling] = useState(null);
    const handlePinSelect = (pin) => {
        setSelectedPin(pin);
        setShowConfig(true);
    };
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
    const handleModeChange = (newMode) => {
        if (!selectedPin)
            return;
        const updatedPins = pins.map(p => p.bcmPin === selectedPin.bcmPin ? { ...p, mode: newMode, state: newMode === 'unused' ? undefined : false } : p);
        setPins(updatedPins);
        setSelectedPin({ ...selectedPin, mode: newMode });
    };
    const handleFunctionChange = (functionName) => {
        if (!selectedPin)
            return;
        const updatedPins = pins.map(p => p.bcmPin === selectedPin.bcmPin ? { ...p, function: functionName } : p);
        setPins(updatedPins);
        setSelectedPin({ ...selectedPin, function: functionName });
    };
    const usedPins = pins.filter(p => p.mode !== 'unused');
    const availablePins = pins.filter(p => p.mode === 'unused');
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: "\uD83C\uDF31" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "GPIO Pins Configuration" })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [usedPins.length, " / ", pins.length, " pins configured"] })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { className: "bg-blue-50 rounded-lg p-4 border border-blue-200", children: [_jsx("div", { className: "text-sm text-blue-600 font-medium", children: "Input Pins" }), _jsx("div", { className: "text-2xl font-bold text-blue-700", children: pins.filter(p => p.mode === 'input').length })] }), _jsxs("div", { className: "bg-orange-50 rounded-lg p-4 border border-orange-200", children: [_jsx("div", { className: "text-sm text-orange-600 font-medium", children: "Output Pins" }), _jsx("div", { className: "text-2xl font-bold text-orange-700", children: pins.filter(p => p.mode === 'output').length })] })] }), usedPins.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: "Configured Pins" }), _jsx("div", { className: "space-y-2", children: usedPins.map(pin => {
                                    const actuator = actuators.find(a => a.bcmPin === pin.bcmPin);
                                    const isOn = actuator?.state ?? false;
                                    const isToggling = toggling === pin.bcmPin;
                                    return (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "text-lg", children: pin.mode === 'input' ? '📥' : '📤' }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium text-gray-900", children: ["GPIO ", pin.bcmPin] }), _jsxs("div", { className: "text-xs text-gray-500", children: [pin.name, " \u2022 ", pin.function || 'Not assigned'] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `px-2 py-1 rounded text-xs font-medium ${pin.mode === 'input' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`, children: pin.mode.toUpperCase() }), pin.mode === 'output' && (_jsx("button", { onClick: () => handleToggle(pin.bcmPin, isOn), disabled: isToggling, className: `relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${isOn ? 'bg-green-600' : 'bg-gray-300'} ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`, children: _jsx("span", { className: `inline-block w-5 h-5 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-0.5'}` }) })), _jsx("button", { onClick: () => handlePinSelect(pin), className: "text-gray-400 hover:text-gray-600 text-lg", children: "\u2699\uFE0F" })] })] }, pin.bcmPin));
                                }) })] }))] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: "Available Pins" }), _jsx("div", { className: "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2", children: availablePins.map(pin => (_jsxs("button", { onClick: () => handlePinSelect(pin), className: "p-3 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-primary-400 hover:bg-primary-50 transition-all text-center", children: [_jsxs("div", { className: "font-mono font-bold text-gray-900 text-sm", children: ["GPIO", pin.bcmPin] }), _jsx("div", { className: "text-xs text-gray-500 mt-0.5", children: pin.name })] }, pin.bcmPin))) })] }), showConfig && selectedPin && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg max-w-md w-full mx-4", children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h4", { className: "text-lg font-semibold text-gray-900", children: ["Configure GPIO ", selectedPin.bcmPin] }), _jsx("button", { onClick: () => setShowConfig(false), className: "text-gray-400 hover:text-gray-600 text-2xl leading-none", children: "\u00D7" })] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [selectedPin.name, " \u2022 Pin ", selectedPin.pin] })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Mode" }), _jsx("div", { className: "space-y-2", children: ['input', 'output', 'unused'].map(mode => (_jsx("button", { onClick: () => handleModeChange(mode), className: `w-full p-3 rounded-lg border-2 transition-all text-left ${selectedPin.mode === mode
                                                    ? 'border-primary-600 bg-primary-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'}`, children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "text-lg", children: mode === 'input' ? '📥' : mode === 'output' ? '📤' : '🚫' }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900 capitalize", children: mode }), _jsxs("div", { className: "text-xs text-gray-500", children: [mode === 'input' && 'Read sensor data', mode === 'output' && 'Control device', mode === 'unused' && 'Not configured'] })] })] }) }, mode))) })] }), selectedPin.mode !== 'unused' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Assign Function" }), _jsx("div", { className: "space-y-2", children: selectedPin.mode === 'output' ? (_jsxs(_Fragment, { children: [_jsx(FunctionButton, { icon: "\uD83D\uDCA7", label: "Pump Control", selected: selectedPin.function === 'pump', onClick: () => handleFunctionChange('pump') }), _jsx(FunctionButton, { icon: "\uD83D\uDCA1", label: "Light Control", selected: selectedPin.function === 'lights', onClick: () => handleFunctionChange('lights') }), _jsx(FunctionButton, { icon: "\uD83C\uDF21\uFE0F", label: "Heater Control", selected: selectedPin.function === 'heater', onClick: () => handleFunctionChange('heater') }), _jsx(FunctionButton, { icon: "\uD83C\uDF2C\uFE0F", label: "Fan Control", selected: selectedPin.function === 'fan', onClick: () => handleFunctionChange('fan') })] })) : (_jsxs(_Fragment, { children: [_jsx(FunctionButton, { icon: "\uD83C\uDF21\uFE0F", label: "Temperature Sensor", selected: selectedPin.function === 'temp_sensor', onClick: () => handleFunctionChange('temp_sensor') }), _jsx(FunctionButton, { icon: "\uD83D\uDCA7", label: "Moisture Sensor", selected: selectedPin.function === 'moisture_sensor', onClick: () => handleFunctionChange('moisture_sensor') }), _jsx(FunctionButton, { icon: "\uD83D\uDCA1", label: "Light Sensor", selected: selectedPin.function === 'light_sensor', onClick: () => handleFunctionChange('light_sensor') }), _jsx(FunctionButton, { icon: "\uD83D\uDCCA", label: "Generic Input", selected: selectedPin.function === 'generic', onClick: () => handleFunctionChange('generic') })] })) })] }))] }), _jsxs("div", { className: "p-6 border-t border-gray-200 flex space-x-3", children: [_jsx("button", { onClick: () => setShowConfig(false), className: "flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50", children: "Close" }), _jsx("button", { onClick: () => {
                                        // Save configuration
                                        setShowConfig(false);
                                    }, className: "flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700", children: "Save Configuration" })] })] }) }))] }));
}
function FunctionButton({ icon, label, selected, onClick }) {
    return (_jsxs("button", { onClick: onClick, className: `w-full p-3 rounded-lg border-2 transition-all text-left flex items-center space-x-2 ${selected
            ? 'border-primary-600 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-gray-300'}`, children: [_jsx("div", { className: "text-lg", children: icon }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: "font-medium text-gray-900", children: label }) }), selected && (_jsx("div", { className: "text-primary-600 font-bold", children: "\u2713" }))] }));
}
