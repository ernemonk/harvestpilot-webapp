/**
 * Actuators Control Panel
 * 
 * Quick access to all configured actuators for real-time control
 */

import { useState } from 'react';
import { useGPIOActuators } from '../../hooks/useGPIOActuators';

interface ActuatorsControlProps {
  deviceId: string;
}

const FUNCTION_ICONS: Record<string, string> = {
  pump: '💧',
  lights: '💡',
  heater: '🌡️',
  fan: '🌬️',
  temp_sensor: '🌡️',
  moisture_sensor: '💧',
  light_sensor: '💡',
  generic: '📊',
};

const FUNCTION_LABELS: Record<string, string> = {
  pump: 'Pump',
  lights: 'Lights',
  heater: 'Heater',
  fan: 'Fan',
  temp_sensor: 'Temperature',
  moisture_sensor: 'Moisture',
  light_sensor: 'Light',
  generic: 'Generic',
};

export default function ActuatorsControl({ deviceId }: ActuatorsControlProps) {
  const { actuators, loading, error, toggleActuator } = useGPIOActuators(deviceId);
  const [toggling, setToggling] = useState<number | null>(null);

  const outputActuators = actuators.filter(a => a.mode === 'output');

  const handleToggle = async (bcmPin: number, currentState: boolean) => {
    setToggling(bcmPin);
    try {
      await toggleActuator(bcmPin, !currentState);
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Actuators</h3>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Actuators</h3>
        <div className="text-red-600 text-sm">{error.message}</div>
      </div>
    );
  }

  if (outputActuators.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Actuators</h3>
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">🚫</div>
          <p>No actuators configured</p>
          <p className="text-xs mt-2">Add output pins in GPIO configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">⚙️ Actuators</h3>
        <span className="text-sm text-gray-500">({outputActuators.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {outputActuators.map(actuator => {
          const isOn = actuator.state;
          const isToggling = toggling === actuator.bcmPin;
          const functionKey = actuator.function || 'generic';
          const icon = FUNCTION_ICONS[functionKey] || '📌';
          const label = FUNCTION_LABELS[functionKey] || actuator.function || 'Actuator';

          return (
            <button
              key={actuator.bcmPin}
              onClick={() => handleToggle(actuator.bcmPin, isOn)}
              disabled={isToggling}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${isOn
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }
                ${isToggling ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="text-3xl">{icon}</div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">GPIO {actuator.bcmPin}</div>
                </div>
                
                {/* Status Badge */}
                <div className={`
                  mt-2 px-3 py-1 rounded-full text-xs font-bold transition-all
                  ${isOn
                    ? 'bg-green-200 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {isOn ? '🟢 ON' : '⚪ OFF'}
                </div>

                {/* Loading Spinner */}
                {isToggling && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
