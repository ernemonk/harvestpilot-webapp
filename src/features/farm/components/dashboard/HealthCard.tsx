/**
 * HealthCard - System health status at a glance
 */

import type { DeviceStatus, AutopilotMode } from '../../hooks/useDeviceState';

interface HealthCardProps {
  status: DeviceStatus;
  autopilotMode: AutopilotMode;
  lastHeartbeat: number;
  failsafeTriggered: boolean;
  failsafeReason: string | null;
}

export function HealthCard({
  status,
  autopilotMode,
  lastHeartbeat,
  failsafeTriggered,
  failsafeReason,
}: HealthCardProps) {
  const getStatusColor = () => {
    if (failsafeTriggered) return 'bg-red-500';
    if (status === 'offline') return 'bg-gray-500';
    if (autopilotMode === 'off' || autopilotMode === 'paused') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (failsafeTriggered) return 'Failsafe Active';
    if (status === 'offline') return 'Offline';
    if (status === 'error') return 'Error';
    return 'Online';
  };

  const getAutopilotText = () => {
    switch (autopilotMode) {
      case 'on':
        return 'Autopilot: ON';
      case 'off':
        return 'Autopilot: OFF';
      case 'paused':
        return 'Autopilot: PAUSED';
      default:
        return 'Unknown';
    }
  };

  const formatLastSync = () => {
    const ageMs = Date.now() - lastHeartbeat;
    const ageMin = Math.floor(ageMs / (60 * 1000));
    
    if (ageMin < 1) return 'Just now';
    if (ageMin < 60) return `${ageMin}m ago`;
    
    const ageHours = Math.floor(ageMin / 60);
    return `${ageHours}h ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        System Health
      </h3>
      
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-4 h-4 rounded-full ${getStatusColor()}`} />
        <span className="text-lg font-semibold text-gray-900">{getStatusText()}</span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className={autopilotMode === 'on' ? 'text-green-600' : 'text-yellow-600'}>
            {getAutopilotText()}
          </span>
        </div>
        
        <div>
          Last sync: {formatLastSync()}
        </div>
        
        {failsafeTriggered && failsafeReason && (
          <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
            ⚠️ {failsafeReason}
          </div>
        )}
      </div>
    </div>
  );
}
