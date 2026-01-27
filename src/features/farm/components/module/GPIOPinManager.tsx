/**
 * GPIO Pin Configuration Component
 * 
 * Displays available GPIO pins for Raspberry Pi and allows configuration
 * Supports real-time toggle via Firestore
 */

import { useState } from 'react';
import { useGPIOActuators } from '../../hooks/useGPIOActuators';

interface GPIOPin {
  pin: number;
  bcmPin: number;
  name: string;
  mode: 'input' | 'output' | 'unused';
  state?: boolean;
  function?: string;
}

interface GPIOPinManagerProps {
  deviceId: string;
  platform?: string;
}

// Raspberry Pi GPIO pin mappings
const RASPBERRY_PI_PINS: GPIOPin[] = [
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

export default function GPIOPinManager({ deviceId }: GPIOPinManagerProps) {
  const { actuators, toggleActuator } = useGPIOActuators(deviceId);
  const [pins, setPins] = useState<GPIOPin[]>(RASPBERRY_PI_PINS);
  const [selectedPin, setSelectedPin] = useState<GPIOPin | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const handlePinSelect = (pin: GPIOPin) => {
    setSelectedPin(pin);
    setShowConfig(true);
  };

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

  const handleModeChange = (newMode: 'input' | 'output' | 'unused') => {
    if (!selectedPin) return;
    
    const updatedPins = pins.map(p =>
      p.bcmPin === selectedPin.bcmPin ? { ...p, mode: newMode, state: newMode === 'unused' ? undefined : false } : p
    );
    setPins(updatedPins);
    setSelectedPin({ ...selectedPin, mode: newMode });
  };

  const handleFunctionChange = (functionName: string) => {
    if (!selectedPin) return;
    
    const updatedPins = pins.map(p =>
      p.bcmPin === selectedPin.bcmPin ? { ...p, function: functionName } : p
    );
    setPins(updatedPins);
    setSelectedPin({ ...selectedPin, function: functionName });
  };

  const usedPins = pins.filter(p => p.mode !== 'unused');
  const availablePins = pins.filter(p => p.mode === 'unused');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🌱</span>
          <h3 className="text-lg font-semibold text-gray-900">GPIO Pins Configuration</h3>
        </div>
        <div className="text-sm text-gray-500">
          {usedPins.length} / {pins.length} pins configured
        </div>
      </div>

      {/* Pin Overview */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Input Pins</div>
            <div className="text-2xl font-bold text-blue-700">
              {pins.filter(p => p.mode === 'input').length}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Output Pins</div>
            <div className="text-2xl font-bold text-orange-700">
              {pins.filter(p => p.mode === 'output').length}
            </div>
          </div>
        </div>

        {/* Used Pins List */}
        {usedPins.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Configured Pins</h4>
            <div className="space-y-2">
              {usedPins.map(pin => {
                const actuator = actuators.find(a => a.bcmPin === pin.bcmPin);
                const isOn = actuator?.state ?? false;
                const isToggling = toggling === pin.bcmPin;
                
                return (
                  <div key={pin.bcmPin} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {pin.mode === 'input' ? '📥' : '📤'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">GPIO {pin.bcmPin}</div>
                        <div className="text-xs text-gray-500">{pin.name} • {pin.function || 'Not assigned'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        pin.mode === 'input' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {pin.mode.toUpperCase()}
                      </div>
                      
                      {/* Toggle Switch for Output Pins */}
                      {pin.mode === 'output' && (
                        <button
                          onClick={() => handleToggle(pin.bcmPin, isOn)}
                          disabled={isToggling}
                          className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${
                            isOn ? 'bg-green-600' : 'bg-gray-300'
                          } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                        >
                          <span className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform ${
                            isOn ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handlePinSelect(pin)}
                        className="text-gray-400 hover:text-gray-600 text-lg"
                      >
                        ⚙️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Available Pins Grid */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Available Pins</h4>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {availablePins.map(pin => (
            <button
              key={pin.bcmPin}
              onClick={() => handlePinSelect(pin)}
              className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-primary-400 hover:bg-primary-50 transition-all text-center"
            >
              <div className="font-mono font-bold text-gray-900 text-sm">GPIO{pin.bcmPin}</div>
              <div className="text-xs text-gray-500 mt-0.5">{pin.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pin Configuration Modal */}
      {showConfig && selectedPin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">
                  Configure GPIO {selectedPin.bcmPin}
                </h4>
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">{selectedPin.name} • Pin {selectedPin.pin}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Mode</label>
                <div className="space-y-2">
                  {(['input', 'output', 'unused'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleModeChange(mode)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedPin.mode === mode
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="text-lg">
                          {mode === 'input' ? '📥' : mode === 'output' ? '📤' : '🚫'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">{mode}</div>
                          <div className="text-xs text-gray-500">
                            {mode === 'input' && 'Read sensor data'}
                            {mode === 'output' && 'Control device'}
                            {mode === 'unused' && 'Not configured'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Function Assignment */}
              {selectedPin.mode !== 'unused' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Assign Function</label>
                  <div className="space-y-2">
                    {selectedPin.mode === 'output' ? (
                      <>
                        <FunctionButton
                          icon="💧"
                          label="Pump Control"
                          selected={selectedPin.function === 'pump'}
                          onClick={() => handleFunctionChange('pump')}
                        />
                        <FunctionButton
                          icon="💡"
                          label="Light Control"
                          selected={selectedPin.function === 'lights'}
                          onClick={() => handleFunctionChange('lights')}
                        />
                        <FunctionButton
                          icon="🌡️"
                          label="Heater Control"
                          selected={selectedPin.function === 'heater'}
                          onClick={() => handleFunctionChange('heater')}
                        />
                        <FunctionButton
                          icon="🌬️"
                          label="Fan Control"
                          selected={selectedPin.function === 'fan'}
                          onClick={() => handleFunctionChange('fan')}
                        />
                      </>
                    ) : (
                      <>
                        <FunctionButton
                          icon="🌡️"
                          label="Temperature Sensor"
                          selected={selectedPin.function === 'temp_sensor'}
                          onClick={() => handleFunctionChange('temp_sensor')}
                        />
                        <FunctionButton
                          icon="💧"
                          label="Moisture Sensor"
                          selected={selectedPin.function === 'moisture_sensor'}
                          onClick={() => handleFunctionChange('moisture_sensor')}
                        />
                        <FunctionButton
                          icon="💡"
                          label="Light Sensor"
                          selected={selectedPin.function === 'light_sensor'}
                          onClick={() => handleFunctionChange('light_sensor')}
                        />
                        <FunctionButton
                          icon="📊"
                          label="Generic Input"
                          selected={selectedPin.function === 'generic'}
                          onClick={() => handleFunctionChange('generic')}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowConfig(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Save configuration
                  setShowConfig(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FunctionButton({ icon, label, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center space-x-2 ${
        selected
          ? 'border-primary-600 bg-primary-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="text-lg">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
      </div>
      {selected && (
        <div className="text-primary-600 font-bold">✓</div>
      )}
    </button>
  );
}
