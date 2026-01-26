/**
 * SensorGauges - Current sensor readings with target ranges
 */


import type { SensorReading, CropConfig } from '../../hooks/useDeviceState';

interface SensorGaugesProps {
  currentReading: SensorReading | null;
  cropConfig: CropConfig | null;
}

interface GaugeProps {
  label: string;
  value: number | null;
  unit: string;
  targetMin?: number;
  targetMax?: number;
  icon: string;
  warningLow?: number;
  warningHigh?: number;
}

function Gauge({ label, value, unit, targetMin, targetMax, icon, warningLow, warningHigh }: GaugeProps) {
  const getStatusColor = () => {
    if (value === null) return 'text-gray-400';
    
    if (warningLow !== undefined && value < warningLow) return 'text-red-500';
    if (warningHigh !== undefined && value > warningHigh) return 'text-red-500';
    
    if (targetMin !== undefined && targetMax !== undefined) {
      if (value < targetMin || value > targetMax) return 'text-yellow-500';
    }
    
    return 'text-green-500';
  };

  const getTargetText = () => {
    if (targetMin === undefined || targetMax === undefined) return null;
    return `Target: ${targetMin}-${targetMax}${unit}`;
  };

  return (
    <div className="flex flex-col items-center p-3">
      <span className="text-2xl mb-1">{icon}</span>
      <span className={`text-2xl font-bold ${getStatusColor()}`}>
        {value !== null ? `${Math.round(value)}${unit}` : '--'}
      </span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
      {getTargetText() && (
        <span className="text-xs text-gray-400">{getTargetText()}</span>
      )}
    </div>
  );
}

export function SensorGauges({ currentReading, cropConfig }: SensorGaugesProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Current Conditions
      </h3>
      
      <div className="grid grid-cols-4 gap-2">
        <Gauge
          label="Temperature"
          value={currentReading?.temperature ?? null}
          unit="°F"
          targetMin={cropConfig?.tempTargetMin}
          targetMax={cropConfig?.tempTargetMax}
          icon="🌡️"
          warningHigh={95}
        />
        
        <Gauge
          label="Humidity"
          value={currentReading?.humidity ?? null}
          unit="%"
          targetMin={cropConfig?.humidityTargetMin}
          targetMax={cropConfig?.humidityTargetMax}
          icon="💧"
        />
        
        <Gauge
          label="Soil"
          value={currentReading?.soilMoisture ?? null}
          unit="%"
          icon="🌱"
        />
        
        <Gauge
          label="Water"
          value={currentReading?.waterLevel ?? null}
          unit="%"
          icon="💦"
          warningLow={20}
        />
      </div>
      
      {currentReading && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
          <span>
            Lights: {currentReading.lightOn ? '🔆 ON' : '⚫ OFF'}
          </span>
          <span>
            Pump: {currentReading.pumpOn ? '💧 Running' : '⏸️ Idle'}
          </span>
        </div>
      )}
    </div>
  );
}
