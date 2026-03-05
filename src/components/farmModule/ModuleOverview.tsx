'use client';

/**
 * Module Overview — Harvest Cycle as hero feature
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { FarmModule, HarvestCycle, ModuleDevice } from '../../types/farmModule';
import { useDeviceState } from '../../hooks/useDeviceState';
import { useCommands } from '../../hooks/useCommands';

interface ModuleOverviewProps {
  module: FarmModule;
  onStartHarvest?: () => void;
  onGoToHarvest?: () => void;
  onGoToDevices?: () => void;
}

const STAGES = ['seeding', 'germination', 'blackout', 'light_exposure', 'growth', 'harvest'] as const;
const STAGE_META: Record<string, { label: string; icon: string }> = {
  seeding:        { label: 'Seeding',        icon: '🌾' },
  germination:    { label: 'Germination',    icon: '🌱' },
  blackout:       { label: 'Blackout',       icon: '🌑' },
  light_exposure: { label: 'Light Exposure', icon: '💡' },
  growth:         { label: 'Growth',         icon: '🌿' },
  harvest:        { label: 'Harvest',        icon: '✂️' },
  completed:      { label: 'Completed',      icon: '✅' },
};

export default function ModuleOverview({ module, onStartHarvest, onGoToHarvest, onGoToDevices }: ModuleOverviewProps) {
  const { state: deviceState } = useDeviceState(module.deviceId);
  const commands = useCommands(module.deviceId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const [activeCycles, setActiveCycles] = useState<HarvestCycle[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [devices, setDevices] = useState<ModuleDevice[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);

  // Real-time harvest cycles
  useEffect(() => {
    const q = query(collection(db, 'harvest_cycles'), where('moduleId', '==', module.id));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as HarvestCycle));
      setActiveCycles(all.filter(c => c.status === 'active'));
      setCompletedCount(all.filter(c => c.status === 'completed').length);
      setCyclesLoading(false);
    }, () => setCyclesLoading(false));
  }, [module.id]);

  // Devices for display
  useEffect(() => {
    const q = query(collection(db, 'devices'), where('moduleId', '==', module.id));
    return onSnapshot(q, snap => {
      setDevices(snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleDevice)));
    });
  }, [module.id]);

  const handleQuickAction = async (action: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'pump_start': await commands.sendCommand('pump_on', { duration: 30 }); break;
        case 'pump_stop':  await commands.sendCommand('pump_off', {}); break;
        case 'lights_on':  await commands.sendCommand('lights_on', { brightness: 100 }); break;
        case 'lights_off': await commands.sendCommand('lights_off', { brightness: 0 }); break;
      }
    } catch (err) {
      console.error('Quick action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── System Status ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          icon="🟢" title="System Status"
          value={module.status === 'online' ? 'Online' : 'Offline'}
          subtitle={`Last check-in: ${getExactTimestamp(module.lastHeartbeat)}`}
          status={module.status}
        />
        <StatusCard icon="🌐" title="Network" value={module.ipAddress || 'Not Available'} subtitle={`MAC: ${module.macAddress || 'Unknown'}`} />
        <StatusCard icon="⚙️" title="OS" value={module.os || 'Unknown'} subtitle="Linux-based system" />
      </div>

      {/* ── HARVEST CYCLE HERO ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌱</span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Harvest Cycles</h3>
              <p className="text-xs text-gray-400">
                {cyclesLoading ? 'Loading…' : activeCycles.length > 0
                  ? `${activeCycles.length} active · ${completedCount} completed`
                  : completedCount > 0 ? `${completedCount} completed · no active cycle` : 'No cycles yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCycles.length > 0 && (
              <button
                onClick={onGoToHarvest}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition px-2 py-1 rounded-lg hover:bg-primary-50"
              >
                View all →
              </button>
            )}
            <button
              onClick={onStartHarvest}
              className="px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition shadow-sm"
            >
              + New Cycle
            </button>
          </div>
        </div>

        {cyclesLoading ? (
          <div className="px-6 pb-5">
            <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        ) : activeCycles.length === 0 ? (
          <div className="px-6 pb-6 text-center">
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 px-6 py-8">
              <div className="text-3xl mb-2">🌾</div>
              <p className="text-sm font-medium text-gray-700 mb-1">No active harvest cycle</p>
              <p className="text-xs text-gray-400 mb-4">Start a cycle to track stages, devices, and yield</p>
              <button
                onClick={onStartHarvest}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition shadow-sm"
              >
                Start First Cycle 🌱
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-5 space-y-3">
            {activeCycles.slice(0, 2).map(cycle => (
              <CycleOverviewCard key={cycle.id} cycle={cycle} onClick={onGoToHarvest} />
            ))}
            {activeCycles.length > 2 && (
              <button
                onClick={onGoToHarvest}
                className="w-full py-2 text-xs text-primary-600 font-semibold hover:bg-primary-50 rounded-xl transition"
              >
                +{activeCycles.length - 2} more active cycle{activeCycles.length - 2 > 1 ? 's' : ''} →
              </button>
            )}
          </div>
        )}

        {/* Stats bar */}
        <div className="border-t border-gray-100 px-6 py-3 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{activeCycles.length}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-lg font-bold text-gray-900">{completedCount}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {activeCycles.length > 0
                ? Math.floor((Date.now() - (activeCycles[0].startDate as any).seconds * 1000) / 86400000)
                : '—'}
            </p>
            <p className="text-xs text-gray-400">Days growing</p>
          </div>
        </div>
      </div>

      {/* ── Devices Quick Status ── */}
      {devices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔧</span>
              <h3 className="font-bold text-gray-900 text-sm">Devices</h3>
              <span className="text-xs text-gray-400">{devices.length} registered</span>
            </div>
            <button onClick={onGoToDevices} className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition px-2 py-1 rounded-lg hover:bg-primary-50">
              Manage →
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {devices.slice(0, 4).map(device => (
              <div key={device.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${device.enabled ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{device.name}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {device.subtype}{device.gpioPin != null ? ` · Pin ${device.gpioPin}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  device.type === 'actuator' ? 'bg-blue-50 text-blue-600' :
                  device.type === 'sensor' ? 'bg-purple-50 text-purple-600' :
                  'bg-gray-50 text-gray-500'
                }`}>{device.type}</span>
              </div>
            ))}
            {devices.length > 4 && (
              <div className="px-6 py-3 text-center">
                <button onClick={onGoToDevices} className="text-xs text-gray-400 hover:text-primary-600 transition">+{devices.length - 4} more</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Device Information (collapsible) ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowDeviceInfo(!showDeviceInfo)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-sm font-semibold text-gray-900">Device Information</h3>
          <svg className={`w-5 h-5 text-gray-500 transition-transform ${showDeviceInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        {showDeviceInfo && (
          <div className="border-t border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identifiers</h4>
                <InfoItem label="Device ID" value={module.deviceId} />
                <InfoItem label="Device Name" value={module.deviceName || '--'} />
                <InfoItem label="Hardware Serial" value={module.hardwareSerial || '--'} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Network</h4>
                <InfoItem label="IP Address" value={module.ipAddress || 'Not Available'} />
                <InfoItem label="MAC Address" value={module.macAddress || 'Unknown'} />
                <InfoItem label="Hostname" value={module.hostname || '--'} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">System</h4>
                <InfoItem label="Platform" value={module.platform || '--'} />
                <InfoItem label="OS" value={module.os || '--'} />
                <InfoItem label="Status" value={
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${module.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {module.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                  </span>
                } />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionButton icon="💧" label="Start Pump" sublabel="30 seconds" onClick={() => handleQuickAction('pump_start')} loading={actionLoading === 'pump_start'} disabled={module.status !== 'online'} />
          <QuickActionButton icon="🛑" label="Stop Pump" onClick={() => handleQuickAction('pump_stop')} loading={actionLoading === 'pump_stop'} disabled={module.status !== 'online'} variant="secondary" />
          <QuickActionButton icon="💡" label="Lights On" onClick={() => handleQuickAction('lights_on')} loading={actionLoading === 'lights_on'} disabled={module.status !== 'online'} />
          <QuickActionButton icon="🌙" label="Lights Off" onClick={() => handleQuickAction('lights_off')} loading={actionLoading === 'lights_off'} disabled={module.status !== 'online'} variant="secondary" />
        </div>
      </div>

      {/* ── Sensor Readings ── */}
      {deviceState?.currentReading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Current Conditions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard icon="🌡️" label="Temperature" value={deviceState.currentReading.temperature} unit="°F" trend="stable" />
            <MetricCard icon="💧" label="Humidity" value={deviceState.currentReading.humidity} unit="%" trend="up" />
            <MetricCard icon="🌱" label="Soil Moisture" value={deviceState.currentReading.soilMoisture} unit="%" trend="stable" />
            <MetricCard icon="💦" label="Water Level" value={deviceState.currentReading.waterLevel} unit="%" trend="down" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cycle Overview Card (mini version for overview) ─────────────────────────

function CycleOverviewCard({ cycle, onClick }: { cycle: HarvestCycle; onClick?: () => void }) {
  const currentIndex = STAGES.indexOf(cycle.currentStage as any);
  const progress = Math.round((Math.max(0, currentIndex) / (STAGES.length - 1)) * 100);
  const daysElapsed = cycle.startDate
    ? Math.floor((Date.now() - (cycle.startDate as any).seconds * 1000) / 86400000)
    : 0;
  const daysRemaining = Math.max(0, (cycle.expectedDays || 10) - daysElapsed);
  const isOverdue = daysElapsed > (cycle.expectedDays || 10);
  const meta = STAGE_META[cycle.currentStage] || STAGE_META.seeding;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition">
              {cycle.cropType}{cycle.variety ? ` · ${cycle.variety}` : ''}
            </p>
            <p className="text-xs text-gray-500">
              {meta.label} · Day {daysElapsed}
              {isOverdue ? (
                <span className="ml-1.5 text-amber-600 font-medium">⚠ overdue</span>
              ) : (
                <span className="ml-1.5 text-primary-600">{daysRemaining}d left</span>
              )}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 group-hover:text-primary-600 transition">→</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverdue ? 'bg-amber-400' : 'bg-primary-500'}`}
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{STAGES.slice(0, -1).map(s => STAGE_META[s].icon).join(' ')}</span>
        <span className="text-xs text-gray-500 font-medium">{progress}%</span>
      </div>
    </button>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusCard({ icon, title, value, subtitle, status }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
      <p className={`text-xl font-semibold mb-1 ${status === 'online' ? 'text-green-600' : status === 'offline' ? 'text-gray-400' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function QuickActionButton({ icon, label, sublabel, onClick, loading, disabled, variant = 'primary' }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative p-4 rounded-lg border-2 transition-all ${
        disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
          : variant === 'secondary' ? 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
          : 'border-primary-200 bg-primary-50 hover:border-primary-400 hover:shadow-sm'
      }`}
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
  const trendColors = { up: 'text-green-600', down: 'text-red-600', stable: 'text-gray-400' };
  const trendIcons = { up: '↗', down: '↘', stable: '→' };
  return (
    <div className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {Math.round(value)}<span className="text-base text-gray-500">{unit}</span>
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-xs mt-1 ${trendColors[trend as keyof typeof trendColors]}`}>
        {trendIcons[trend as keyof typeof trendIcons]} {trend}
      </div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getExactTimestamp(timestamp: any): string {
  if (!timestamp) return 'Never';
  try {
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    const now = new Date();
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const diff = now.getTime() - date.getTime();
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    let rel = secs < 60 ? `${secs}s ago` : mins < 60 ? `${mins}m ago` : hrs < 24 ? `${hrs}h ago` : `${days}d ago`;
    return `${h}:${m}:${s} (${rel})`;
  } catch { return 'Invalid'; }
}

function InfoItem({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
    </div>
  );
}

