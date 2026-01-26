/**
 * ControlPanel - Manual override controls with safety UX
 */

import { useState } from 'react';
import { useCommands } from '../../hooks/useCommands';
import type { AutopilotMode } from '../../hooks/useCommands';

interface ControlPanelProps {
  deviceId: string;
  autopilotMode: AutopilotMode;
  lightsOn: boolean;
  failsafeTriggered: boolean;
  waterLevel: number;
}

export function ControlPanel({
  deviceId,
  autopilotMode,
  lightsOn,
  failsafeTriggered,
  waterLevel,
}: ControlPanelProps) {
  const commands = useCommands(deviceId);
  const [pumpDuration, setPumpDuration] = useState(30);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [emergencyInput, setEmergencyInput] = useState('');

  const canRunPump = waterLevel > 20 && !failsafeTriggered;

  const handlePumpOn = async () => {
    if (!canRunPump) return;
    try {
      await commands.pumpOn(pumpDuration);
    } catch (err) {
      console.error('Failed to run pump:', err);
    }
  };

  const handleToggleLights = async () => {
    try {
      if (lightsOn) {
        await commands.lightsOff();
      } else {
        await commands.lightsOn();
      }
    } catch (err) {
      console.error('Failed to toggle lights:', err);
    }
  };

  const handleToggleAutopilot = async () => {
    try {
      const newMode: AutopilotMode = autopilotMode === 'on' ? 'off' : 'on';
      await commands.setAutopilot(newMode);
    } catch (err) {
      console.error('Failed to toggle autopilot:', err);
    }
  };

  const handleEmergencyStop = async () => {
    if (emergencyInput.toUpperCase() !== 'STOP') return;
    try {
      await commands.emergencyStop();
      setShowEmergencyConfirm(false);
      setEmergencyInput('');
    } catch (err) {
      console.error('Failed to emergency stop:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Manual Controls
      </h3>

      <div className="space-y-4">
        {/* Pump Control */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Pump</label>
          <div className="flex items-center gap-2">
            <select
              value={pumpDuration}
              onChange={(e) => setPumpDuration(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              disabled={!canRunPump}
            >
              <option value={15}>15 sec</option>
              <option value={30}>30 sec</option>
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
            </select>
            <button
              onClick={handlePumpOn}
              disabled={!canRunPump || commands.sending}
              className={`px-3 py-1 rounded text-sm font-medium ${
                canRunPump
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {commands.sending ? 'Sending...' : 'Run Pump'}
            </button>
          </div>
          {!canRunPump && (
            <p className="text-xs text-red-500 mt-1">
              {waterLevel <= 20 ? 'Water level too low' : 'Failsafe active'}
            </p>
          )}
        </div>

        {/* Lights Control */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Lights</label>
          <button
            onClick={handleToggleLights}
            disabled={commands.sending}
            className={`px-3 py-1 rounded text-sm font-medium ${
              lightsOn
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {lightsOn ? '🔆 Turn OFF' : '⚫ Turn ON'}
          </button>
        </div>

        {/* Autopilot Toggle */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Autopilot</label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAutopilot}
              disabled={commands.sending}
              className={`px-4 py-2 rounded text-sm font-medium ${
                autopilotMode === 'on'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              ON
            </button>
            <button
              onClick={handleToggleAutopilot}
              disabled={commands.sending}
              className={`px-4 py-2 rounded text-sm font-medium ${
                autopilotMode !== 'on'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              OFF
            </button>
          </div>
        </div>

        {/* Emergency Stop */}
        <div className="pt-4 border-t border-gray-200">
          {!showEmergencyConfirm ? (
            <button
              onClick={() => setShowEmergencyConfirm(true)}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
            >
              ⚠️ Emergency Stop
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                Type "STOP" to confirm emergency shutdown:
              </p>
              <input
                type="text"
                value={emergencyInput}
                onChange={(e) => setEmergencyInput(e.target.value)}
                placeholder="Type STOP"
                className="w-full border border-red-300 rounded px-3 py-2 text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEmergencyStop}
                  disabled={emergencyInput.toUpperCase() !== 'STOP'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-medium disabled:opacity-50"
                >
                  Confirm Stop
                </button>
                <button
                  onClick={() => {
                    setShowEmergencyConfirm(false);
                    setEmergencyInput('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
