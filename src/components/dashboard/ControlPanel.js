import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ControlPanel - Manual override controls with safety UX
 */
import { useState } from 'react';
import { useCommands } from '../../hooks/useCommands';
export function ControlPanel({ deviceId, autopilotMode, lightsOn, failsafeTriggered, waterLevel, }) {
    const commands = useCommands(deviceId);
    const [pumpDuration, setPumpDuration] = useState(30);
    const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
    const [emergencyInput, setEmergencyInput] = useState('');
    const canRunPump = waterLevel > 20 && !failsafeTriggered;
    const handlePumpOn = async () => {
        if (!canRunPump)
            return;
        try {
            await commands.pumpOn(pumpDuration);
        }
        catch (err) {
            console.error('Failed to run pump:', err);
        }
    };
    const handleToggleLights = async () => {
        try {
            if (lightsOn) {
                await commands.lightsOff();
            }
            else {
                await commands.lightsOn();
            }
        }
        catch (err) {
            console.error('Failed to toggle lights:', err);
        }
    };
    const handleToggleAutopilot = async () => {
        try {
            const newMode = autopilotMode === 'on' ? 'off' : 'on';
            await commands.setAutopilot(newMode);
        }
        catch (err) {
            console.error('Failed to toggle autopilot:', err);
        }
    };
    const handleEmergencyStop = async () => {
        if (emergencyInput.toUpperCase() !== 'STOP')
            return;
        try {
            await commands.emergencyStop();
            setShowEmergencyConfirm(false);
            setEmergencyInput('');
        }
        catch (err) {
            console.error('Failed to emergency stop:', err);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 uppercase tracking-wide mb-4", children: "Manual Controls" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-2", children: "Pump" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: pumpDuration, onChange: (e) => setPumpDuration(Number(e.target.value)), className: "border border-gray-300 rounded px-2 py-1 text-sm", disabled: !canRunPump, children: [_jsx("option", { value: 15, children: "15 sec" }), _jsx("option", { value: 30, children: "30 sec" }), _jsx("option", { value: 60, children: "1 min" }), _jsx("option", { value: 120, children: "2 min" })] }), _jsx("button", { onClick: handlePumpOn, disabled: !canRunPump || commands.sending, className: `px-3 py-1 rounded text-sm font-medium ${canRunPump
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`, children: commands.sending ? 'Sending...' : 'Run Pump' })] }), !canRunPump && (_jsx("p", { className: "text-xs text-red-500 mt-1", children: waterLevel <= 20 ? 'Water level too low' : 'Failsafe active' }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-2", children: "Lights" }), _jsx("button", { onClick: handleToggleLights, disabled: commands.sending, className: `px-3 py-1 rounded text-sm font-medium ${lightsOn
                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: lightsOn ? '🔆 Turn OFF' : '⚫ Turn ON' })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-2", children: "Autopilot" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: handleToggleAutopilot, disabled: commands.sending, className: `px-4 py-2 rounded text-sm font-medium ${autopilotMode === 'on'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-700'}`, children: "ON" }), _jsx("button", { onClick: handleToggleAutopilot, disabled: commands.sending, className: `px-4 py-2 rounded text-sm font-medium ${autopilotMode !== 'on'
                                            ? 'bg-gray-500 text-white'
                                            : 'bg-gray-200 text-gray-700'}`, children: "OFF" })] })] }), _jsx("div", { className: "pt-4 border-t border-gray-200", children: !showEmergencyConfirm ? (_jsx("button", { onClick: () => setShowEmergencyConfirm(true), className: "w-full px-4 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200", children: "\u26A0\uFE0F Emergency Stop" })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-red-600", children: "Type \"STOP\" to confirm emergency shutdown:" }), _jsx("input", { type: "text", value: emergencyInput, onChange: (e) => setEmergencyInput(e.target.value), placeholder: "Type STOP", className: "w-full border border-red-300 rounded px-3 py-2 text-sm", autoFocus: true }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleEmergencyStop, disabled: emergencyInput.toUpperCase() !== 'STOP', className: "flex-1 px-4 py-2 bg-red-600 text-white rounded font-medium disabled:opacity-50", children: "Confirm Stop" }), _jsx("button", { onClick: () => {
                                                setShowEmergencyConfirm(false);
                                                setEmergencyInput('');
                                            }, className: "px-4 py-2 bg-gray-200 text-gray-700 rounded", children: "Cancel" })] })] })) })] })] }));
}
