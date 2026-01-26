/**
 * Module Overview Section
 * 
 * Displays module status, quick actions, and current sensor readings.
 * Apple-like design: spacious, clear hierarchy, premium feel.
 */

import { useState } from 'react';
import type { FarmModule } from '../../types/farmModule';
import { useDeviceState } from '../../hooks/useDeviceState';
import { useCommands } from '../../hooks/useCommands';

interface ModuleOverviewProps {
  module: FarmModule;
}

export default function ModuleOverview({ module }: ModuleOverviewProps) {
  const { state: deviceState, loading } = useDeviceState(module.deviceId);
  const commands = useCommands(module.deviceId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleQuickAction = async (action: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'pump_start':
          await commands.sendCommand('run_pump', { duration: 30 });
          break;
        case 'pump_stop':
          await commands.sendCommand('stop_pump', {});
          break;
        case 'lights_on':
          await commands.sendCommand('set_lights', { brightness: 100 });
          break;
        case 'lights_off':
          await commands.sendCommand('set_lights', { brightness: 0 });
          break;
      }
    } catch (err) {
      console.error('Quick action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Status */}
        <StatusCard
          icon="🟢"
          title="System Status"
          value={module.status === 'online' ? 'Online' : 'Offline'}
          subtitle={`Last check-in: ${formatLastSeen(module.lastHeartbeat)}`}
          status={module.status}
        />

        {/* Network Info */}
        <StatusCard
          icon="🌐"
          title="Network"
          value={module.ipAddress || 'Not Available'}
          subtitle={`MAC: ${module.macAddress || 'Unknown'}`}
        />

        {/* Firmware */}
        <StatusCard
          icon="⚡"
          title="Firmware"
          value={module.firmwareVersion || 'Unknown'}
          subtitle="System up to date"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionButton
            icon="💧"
            label="Start Pump"
            sublabel="30 seconds"
            onClick={() => handleQuickAction('pump_start')}
            loading={actionLoading === 'pump_start'}
            disabled={module.status !== 'online'}
          />
          <QuickActionButton
            icon="🛑"
            label="Stop Pump"
            onClick={() => handleQuickAction('pump_stop')}
            loading={actionLoading === 'pump_stop'}
            disabled={module.status !== 'online'}
            variant="secondary"
          />
          <QuickActionButton
            icon="💡"
            label="Lights On"
            onClick={() => handleQuickAction('lights_on')}
            loading={actionLoading === 'lights_on'}
            disabled={module.status !== 'online'}
          />
          <QuickActionButton
            icon="🌙"
            label="Lights Off"
            onClick={() => handleQuickAction('lights_off')}
            loading={actionLoading === 'lights_off'}
            disabled={module.status !== 'online'}
            variant="secondary"
          />
        </div>
      </div>

      {/* Current Readings */}
      {deviceState?.currentReading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Conditions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard
              icon="🌡️"
              label="Temperature"
              value={deviceState.currentReading.temperature}
              unit="°F"
              trend="stable"
            />
            <MetricCard
              icon="💧"
              label="Humidity"
              value={deviceState.currentReading.humidity}
              unit="%"
              trend="up"
            />
            <MetricCard
              icon="🌱"
              label="Soil Moisture"
              value={deviceState.currentReading.soilMoisture}
              unit="%"
              trend="stable"
            />
            <MetricCard
              icon="💦"
              label="Water Level"
              value={deviceState.currentReading.waterLevel}
              unit="%"
              trend="down"
            />
          </div>
        </div>
      )}

      {/* Automation Status */}
      {deviceState && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AutopilotCard
            enabled={deviceState.autopilotMode === 'on'}
            lastIrrigation={deviceState.lastIrrigationAt}
            nextIrrigation={deviceState.nextIrrigationAt}
            lightsOn={deviceState.lightsOn}
          />
          <CropInfoCard cropConfig={deviceState.cropConfig} />
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatusCard({ icon, title, value, subtitle, status }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
        </div>
      </div>
      <p className={`text-2xl font-semibold mb-1 ${
        status === 'online' ? 'text-green-600' : 
        status === 'offline' ? 'text-gray-400' : 
        'text-gray-900'
      }`}>
        {value}
      </p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function QuickActionButton({ icon, label, sublabel, onClick, loading, disabled, variant = 'primary' }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${disabled 
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
          : variant === 'secondary'
            ? 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
            : 'border-primary-200 bg-primary-50 hover:border-primary-400 hover:shadow-sm'
        }
      `}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {sublabel && <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </button>
  );
}

function MetricCard({ icon, label, value, unit, trend }: any) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-400'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <div className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {Math.round(value)}<span className="text-lg text-gray-500">{unit}</span>
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-xs mt-1 ${trendColors[trend as keyof typeof trendColors]}`}>
        {trendIcons[trend as keyof typeof trendIcons]} {trend}
      </div>
    </div>
  );
}

function AutopilotCard({ enabled, lastIrrigation, nextIrrigation, lightsOn }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Autopilot</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {enabled ? '🟢 Active' : '⚫ Inactive'}
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Lights</span>
          <span className="font-medium text-gray-900">
            {lightsOn ? '💡 On' : '🌙 Off'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Last Irrigation</span>
          <span className="font-medium text-gray-900">
            {lastIrrigation ? formatTimeAgo(lastIrrigation) : 'Never'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-600">Next Irrigation</span>
          <span className="font-medium text-gray-900">
            {nextIrrigation ? formatTimeUntil(nextIrrigation) : 'Not scheduled'}
          </span>
        </div>
      </div>
    </div>
  );
}

function CropInfoCard({ cropConfig }: any) {
  if (!cropConfig) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Crop</h3>
        <div className="text-center py-6 text-gray-500">
          <div className="text-4xl mb-2">🌱</div>
          <p>No crop configured</p>
        </div>
      </div>
    );
  }

  const daysGrowing = Math.floor((Date.now() - cropConfig.plantedAt) / (1000 * 60 * 60 * 24));
  const progress = (daysGrowing / cropConfig.expectedHarvestDays) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Crop</h3>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-medium text-gray-900">{cropConfig.cropType}</span>
          <span className="text-sm text-gray-500">
            Day {daysGrowing} of {cropConfig.expectedHarvestDays}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Planted</span>
          <span className="font-medium text-gray-900">
            {new Date(cropConfig.plantedAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Est. Harvest</span>
          <span className="font-medium text-gray-900">
            {new Date(cropConfig.plantedAt + cropConfig.expectedHarvestDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// UTILITIES
// ============================================

function formatLastSeen(timestamp: any): string {
  if (!timestamp) return 'Never';
  const seconds = timestamp.seconds || timestamp;
  const now = Date.now() / 1000;
  const diff = now - seconds;
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTimeUntil(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  
  if (diff < 0) return 'Overdue';
  
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `in ${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;
  
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}
