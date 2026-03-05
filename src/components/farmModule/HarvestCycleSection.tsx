'use client';

import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, doc, Timestamp, getDocs, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type {
  HarvestCycle, HarvestStage, ModuleDevice, StageConfig, StageDeviceConfig, DeviceControlMode,
} from '../../types/farmModule';
import type { Crop, CropResearch } from '../../types';

interface HarvestCycleSectionProps {
  moduleId: string;
  organizationId?: string;
  hardwareSerial?: string;
  openNewCycleModal?: boolean;
  onNewCycleModalClosed?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: HarvestStage[] = ['seeding', 'germination', 'blackout', 'light_exposure', 'growth', 'harvest'];

// Default stage templates (can be customized per cycle)
const DEFAULT_STAGE_META: Record<HarvestStage, { label: string; icon: string; description: string; defaultDays: number }> = {
  seeding:        { label: 'Seeding',        icon: '🌾', description: 'Plant seeds in growing medium',   defaultDays: 1 },
  germination:    { label: 'Germination',    icon: '🌱', description: 'Seeds sprouting — keep moist',    defaultDays: 2 },
  blackout:       { label: 'Blackout',       icon: '🌑', description: 'Cover trays, high humidity',      defaultDays: 3 },
  light_exposure: { label: 'Light Exposure', icon: '💡', description: 'Remove covers, introduce light',  defaultDays: 2 },
  growth:         { label: 'Growth',         icon: '🌿', description: 'Maintain optimal conditions',     defaultDays: 4 },
  harvest:        { label: 'Harvest',        icon: '✂️', description: 'Ready to cut and package',        defaultDays: 1 },
  completed:      { label: 'Completed',      icon: '✅', description: 'Cycle complete',                  defaultDays: 0 },
};

// Function to create a custom stage
function createCustomStage(id: string, label: string, icon: string, description: string, days: number): StageConfig {
  return {
    stage: id as HarvestStage,
    label,
    icon,
    description,
    days,
    devices: [],
  };
}

// Minimal built-in defaults (only shown when user has no crops in Crop Management)
const BUILTIN_DEFAULTS = [
  { name: 'Wheatgrass' },
  { name: 'Pea Shoots' },
];

// Device display helpers
const DEVICE_ICON: Record<string, string> = {
  pump: '💧', light: '💡', fan: '🌀', valve: '🔧', motor: '⚙️',
  temperature: '🌡️', humidity: '💦', soil_moisture: '🌱',
  ec: '⚡', ph: '🧪', light_sensor: '☀️', camera: '📷',
  actuator: '⚙️', sensor: '📡',
};

function deviceIcon(d: ModuleDevice) {
  return DEVICE_ICON[d.subtype as string] || DEVICE_ICON[d.type] || '📟';
}

function makeDefaultStageConfigs(): StageConfig[] {
  return STAGES.map(stage => {
    const meta = DEFAULT_STAGE_META[stage];
    return {
      stage,
      label: meta.label,
      icon: meta.icon,
      description: meta.description,
      days: meta.defaultDays,
      devices: [],
    };
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HarvestCycleSection({
  moduleId,
  organizationId,
  hardwareSerial,
  openNewCycleModal = false,
  onNewCycleModalClosed,
}: HarvestCycleSectionProps) {
  const [cycles, setCycles] = useState<HarvestCycle[]>([]);
  const [devices, setDevices] = useState<ModuleDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [editingCycle, setEditingCycle] = useState<HarvestCycle | null>(null);
  const [completingCycle, setCompletingCycle] = useState<HarvestCycle | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  useEffect(() => { if (openNewCycleModal) setShowNewCycle(true); }, [openNewCycleModal]);

  // Real-time cycles listener
  useEffect(() => {
    const q = query(
      collection(db, 'harvest_cycles'),
      where('moduleId', '==', moduleId),
      orderBy('startDate', 'desc')
    );
    return onSnapshot(q, snap => {
      setCycles(snap.docs.map(d => ({ id: d.id, ...d.data() } as HarvestCycle)));
      setLoading(false);
    }, () => setLoading(false));
  }, [moduleId]);

  // Load devices from the same source as DevicesSection:
  // single Firestore doc at `devices/{hardwareSerial}` → gpioState map
  useEffect(() => {
    const deviceKey = hardwareSerial || moduleId;
    if (!deviceKey) return;
    const deviceRef = doc(db, 'devices', deviceKey);
    return onSnapshot(deviceRef, (snapshot) => {
      if (!snapshot.exists()) { setDevices([]); return; }
      const data = snapshot.data();
      const gpioState = data.gpioState || {};
      const deviceList: ModuleDevice[] = Object.entries(gpioState).map(([pin, pinData]: any) => {
        const name = pinData.name || `Pin ${pin}`;
        let type: 'sensor' | 'actuator' | 'camera' = 'actuator';
        const rawType = pinData.device_type || '';
        if (['sensor'].includes(rawType) || name.includes('Sensor')) type = 'sensor';
        else if (['camera'].includes(rawType) || name.includes('Camera')) type = 'camera';
        const subtype = pinData.subtype || pinData.actuator_type || pinData.sensor_type || rawType || type;
        return {
          id: `${deviceKey}-${pin}`,
          moduleId,
          name,
          type,
          subtype,
          gpioPin: parseInt(pin),
          enabled: pinData.enabled !== false,
          direction: pinData.direction || 'output',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as ModuleDevice;
      });
      setDevices(deviceList);
    }, () => setDevices([]));
  }, [hardwareSerial, moduleId]);

  async function advanceStage(cycle: HarvestCycle) {
    const i = STAGES.indexOf(cycle.currentStage);
    if (i < 0 || i >= STAGES.length - 1) return;
    const next = STAGES[i + 1];
    const now = Timestamp.now();
    await updateDoc(doc(db, 'harvest_cycles', cycle.id!), {
      currentStage: next,
      updatedAt: now,
      [`stageStartTimes.${next}`]: now,
      stageHistory: [
        ...(cycle.stageHistory || []),
        { stage: next, startedAt: now },
      ],
    });
  }

  async function goBackStage(cycle: HarvestCycle) {
    const i = STAGES.indexOf(cycle.currentStage);
    if (i <= 0) return;
    const prev = STAGES[i - 1];
    // Remove last history entry
    const hist = [...(cycle.stageHistory || [])];
    if (hist.length > 1) hist.pop();
    await updateDoc(doc(db, 'harvest_cycles', cycle.id!), {
      currentStage: prev,
      updatedAt: Timestamp.now(),
      stageHistory: hist,
    });
  }

  function handleCloseNew() {
    setShowNewCycle(false);
    onNewCycleModalClosed?.();
  }

  const activeCycles = cycles.filter(c => c.status === 'active');
  const completedCycles = cycles.filter(c => c.status === 'completed');

  if (loading) return <HarvestSkeleton />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Harvest Cycles</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCycles.length > 0
              ? `${activeCycles.length} active · ${completedCycles.length} completed`
              : completedCycles.length > 0
                ? `${completedCycles.length} completed cycles`
                : 'No cycles yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewCycle(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Cycle
          </button>
        </div>
      </div>

      {/* Active Cycles */}
      {activeCycles.length === 0 ? (
        <EmptyState onStart={() => setShowNewCycle(true)} />
      ) : (
        <div className="space-y-4">
          {activeCycles.map(cycle => (
            <ActiveCycleCard
              key={cycle.id}
              cycle={cycle}
              devices={devices}
              expanded={expandedCycleId === cycle.id}
              onToggle={() => setExpandedCycleId(expandedCycleId === cycle.id ? null : cycle.id!)}
              onAdvance={() => advanceStage(cycle)}
              onGoBack={() => goBackStage(cycle)}
              onEdit={() => setEditingCycle(cycle)}
              onComplete={() => setCompletingCycle(cycle)}
            />
          ))}
        </div>
      )}

      {/* Completed History */}
      {completedCycles.length > 0 && (
        <CycleHistory cycles={completedCycles} onEdit={c => setEditingCycle(c)} />
      )}

      {/* Modals */}
      {showNewCycle && (
        <CycleFormModal
          moduleId={moduleId}
          organizationId={organizationId}
          devices={devices}
          onClose={handleCloseNew}
        />
      )}
      {editingCycle && (
        <CycleFormModal
          moduleId={moduleId}
          organizationId={organizationId}
          devices={devices}
          editCycle={editingCycle}
          onClose={() => setEditingCycle(null)}
        />
      )}
      {completingCycle && (
        <CompleteCycleModal cycle={completingCycle} onClose={() => setCompletingCycle(null)} />
      )}
    </div>
  );
}

// ─── Active Cycle Card ────────────────────────────────────────────────────────

function ActiveCycleCard({
  cycle, devices, expanded, onToggle, onAdvance, onGoBack, onEdit, onComplete,
}: {
  cycle: HarvestCycle;
  devices: ModuleDevice[];
  expanded: boolean;
  onToggle: () => void;
  onAdvance: () => void;
  onGoBack: () => void;
  onEdit: () => void;
  onComplete: () => void;
}) {
  const currentIndex = STAGES.indexOf(cycle.currentStage);
  const progress = Math.round((currentIndex / (STAGES.length - 1)) * 100);
  const daysElapsed = cycle.startDate
    ? Math.floor((Date.now() - (cycle.startDate as any).seconds * 1000) / 86400000)
    : 0;
  const daysRemaining = Math.max(0, (cycle.expectedDays || 10) - daysElapsed);
  const isOverdue = daysElapsed > (cycle.expectedDays || 10) && cycle.currentStage !== 'harvest';
  const meta = DEFAULT_STAGE_META[cycle.currentStage] || DEFAULT_STAGE_META.seeding;
  const isLastStage = currentIndex >= STAGES.length - 1;
  const canGoBack = currentIndex > 0;

  // Devices assigned to current stage
  const stageConfig = (cycle.stageConfigs || []).find(s => s.stage === cycle.currentStage);
  const assignedDevices = (stageConfig?.devices || []).map(sd => ({
    cfg: sd,
    device: devices.find(d => d.id === sd.deviceId),
  })).filter(x => x.device);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className={`h-full transition-all duration-700 ${isOverdue ? 'bg-amber-400' : 'bg-linear-to-r from-primary-500 to-green-500'}`}
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {meta.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-base truncate">
                {cycle.cropType}{cycle.variety ? ` · ${cycle.variety}` : ''}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Day {daysElapsed} of {cycle.expectedDays || '?'}
                {isOverdue ? (
                  <span className="ml-1.5 text-amber-600 font-medium">⚠ Overdue by {daysElapsed - (cycle.expectedDays || 0)}d</span>
                ) : daysRemaining > 0 ? (
                  <span className="ml-1.5 text-primary-600 font-medium">{daysRemaining}d left</span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Active
            </span>
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Edit cycle"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onComplete}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Complete ✂️
            </button>
          </div>
        </div>

        {/* Progress bar with % */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700">{meta.label}</span>
            <span className="text-gray-400">{progress}% complete</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isOverdue ? 'bg-amber-400' : 'bg-linear-to-r from-primary-500 to-green-500'}`}
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
        </div>

        {/* Stage pills */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {STAGES.slice(0, -1).map((stage, i) => {
            const done = i < currentIndex;
            const curr = i === currentIndex;
            return (
              <div key={stage} className="flex items-center gap-0.5 shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                  curr ? 'bg-primary-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span>{DEFAULT_STAGE_META[stage].icon}</span>
                  <span className="hidden sm:inline">{DEFAULT_STAGE_META[stage].label}</span>
                </div>
                {i < STAGES.length - 2 && (
                  <svg className={`w-3 h-3 shrink-0 ${done ? 'text-green-400' : 'text-gray-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {/* Active devices for this stage */}
        {assignedDevices.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">This stage:</span>
            {assignedDevices.map(({ cfg, device }) => (
              <span key={cfg.deviceId} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                cfg.mode === 'on' ? 'bg-green-100 text-green-700' :
                cfg.mode === 'off' ? 'bg-gray-100 text-gray-600' :
                cfg.mode === 'timer' ? 'bg-blue-100 text-blue-700' :
                cfg.mode === 'sensor_triggered' ? 'bg-purple-100 text-purple-700' :
                'bg-primary-100 text-primary-700'
              }`}>
                {deviceIcon(device!)} {device!.name}
                <span className="opacity-60">
                  {cfg.mode === 'timer' ? `⏱ ${cfg.timerDurationSec}s` :
                   cfg.mode === 'sensor_triggered' ? '🔆 auto' :
                   cfg.mode === 'on' ? 'ON' : cfg.mode === 'off' ? 'OFF' : 'monitor'}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Stage navigation + expand */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <button
                onClick={onGoBack}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back
              </button>
            )}
            {!isLastStage ? (
              <button
                onClick={onAdvance}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Advance to {DEFAULT_STAGE_META[STAGES[currentIndex + 1]]?.label}
              </button>
            ) : (
              <span className="text-sm text-amber-600 font-medium">✂️ Ready to harvest</span>
            )}
          </div>
          <button onClick={onToggle} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition shrink-0">
            {expanded ? 'Hide' : 'Details'}
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
            {/* Stage timeline */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Stage Timeline</p>
              <div className="space-y-2.5">
                {STAGES.slice(0, -1).map((stage, i) => {
                  const done = i < currentIndex;
                  const curr = i === currentIndex;
                  const sm = DEFAULT_STAGE_META[stage];
                  const sc = (cycle.stageConfigs || []).find(s => s.stage === stage);
                  const stageDevices = (sc?.devices || []).map(sd => devices.find(d => d.id === sd.deviceId)).filter(Boolean);
                  return (
                    <div key={stage} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
                        done ? 'bg-green-500 border-green-400' : curr ? 'bg-primary-600 border-primary-400 ring-4 ring-primary-50' : 'bg-white border-gray-200'
                      }`}>
                        {done ? (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className={`text-xs ${curr ? 'text-white' : 'text-gray-300'}`}>{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${curr ? 'text-primary-700' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                            {sm.icon} {sm.label}
                          </p>
                          {sc && (
                            <span className="text-xs text-gray-400">{sc.days}d</span>
                          )}
                          {curr && (
                            <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-md font-medium">In Progress</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{sm.description}</p>
                        {stageDevices.length > 0 && (
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {(sc?.devices || []).map(sd => {
                              const dv = devices.find(d => d.id === sd.deviceId);
                              if (!dv) return null;
                              return (
                                <span key={sd.deviceId} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                  {deviceIcon(dv)} {dv.name}
                                  {sd.mode === 'timer' && ` ⏱${sd.timerDurationSec}s/${sd.timerIntervalMin}min`}
                                  {sd.mode === 'sensor_triggered' && ' 🔆'}
                                  {sd.mode === 'on' && ' ON'}
                                  {sd.mode === 'off' && ' OFF'}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {cycle.notes && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs font-semibold text-amber-800 mb-1">Notes</p>
                <p className="text-sm text-amber-700">{cycle.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cycle History ────────────────────────────────────────────────────────────

function CycleHistory({ cycles, onEdit }: { cycles: HarvestCycle[]; onEdit: (c: HarvestCycle) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-gray-900 text-sm">Previous Harvests ({cycles.length})</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${show ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {show && (
        <div className="divide-y divide-gray-100">
          {cycles.slice(0, 10).map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 group">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {c.cropType}{c.variety ? ` · ${c.variety}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(c.startDate)} → {formatDate((c as any).harvestDate || c.actualHarvestDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {c.yieldWeight ? (
                    <>
                      <p className="font-semibold text-gray-900 text-sm">{c.yieldWeight} {c.yieldUnit || 'oz'}</p>
                      <p className="text-xs text-gray-400">yield</p>
                    </>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.quality === 'excellent' ? 'bg-green-100 text-green-700' :
                      c.quality === 'good' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{c.quality || 'done'}</span>
                  )}
                </div>
                <button
                  onClick={() => onEdit(c)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🌱</div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">No Active Harvest Cycles</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
        Define devices per stage, control modes (timer / sensor-triggered), and track your grow from seed to harvest.
      </p>
      <button
        onClick={onStart}
        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition shadow-sm"
      >
        Start First Cycle 🌱
      </button>
    </div>
  );
}

// ─── Cycle Form Modal (New + Edit) ───────────────────────────────────────────

function CycleFormModal({
  moduleId, organizationId, devices, editCycle, onClose,
}: {
  moduleId: string;
  organizationId?: string;
  devices: ModuleDevice[];
  editCycle?: HarvestCycle;
  onClose: () => void;
}) {
  const isEdit = !!editCycle;
  const [step, setStep] = useState<'crop' | 'stages'>('crop');
  const [cropType, setCropType] = useState(editCycle?.cropType || '');
  const [customCrop, setCustomCrop] = useState('');
  const [variety, setVariety] = useState(editCycle?.variety || '');
  const [notes, setNotes] = useState(editCycle?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Crop sources from Firestore
  const [managedCrops, setManagedCrops] = useState<Crop[]>([]);
  const [cropsLoading, setCropsLoading] = useState(true);

  // Load crops from Crop Management (Firestore `crops` collection, org-scoped)
  useEffect(() => {
    if (!organizationId) { setCropsLoading(false); return; }
    getDocs(query(collection(db, 'crops'), where('organizationId', '==', organizationId)))
      .then(snap => {
        setManagedCrops(snap.docs.map(d => ({ id: d.id, ...d.data() } as Crop)));
        setCropsLoading(false);
      })
      .catch(() => setCropsLoading(false));
  }, [organizationId]);

  // Build initial stageConfigs
  const [stageConfigs, setStageConfigs] = useState<StageConfig[]>(() => {
    if (editCycle?.stageConfigs && editCycle.stageConfigs.length > 0) {
      // Migration: if old format (no devices array), convert
      return editCycle.stageConfigs.map(sc => ({
        ...sc,
        devices: sc.devices || migrateLegacyDevices(sc),
      }));
    }
    return makeDefaultStageConfigs();
  });

  const finalCrop = cropType === '__custom__' ? customCrop.trim() : cropType;
  const totalDays = stageConfigs.reduce((s, c) => s + c.days, 0);

  // Deduplicated crop names from Crop Management
  const cropNames = Array.from(new Set(managedCrops.map(c => c.name).filter(Boolean)));

  function updateStage(i: number, ch: Partial<StageConfig>) {
    setStageConfigs(prev => prev.map((s, idx) => idx === i ? { ...s, ...ch } : s));
  }
  // Add parent reference for stage management
  (updateStage as any).__parent = { setStageConfigs };

  function setDeviceConfig(stageIdx: number, deviceId: string, cfg: Partial<StageDeviceConfig> | null) {
    const sc = stageConfigs[stageIdx];
    const existing = sc.devices.find(d => d.deviceId === deviceId);
    let newDevices: StageDeviceConfig[];
    if (cfg === null) {
      // Remove
      newDevices = sc.devices.filter(d => d.deviceId !== deviceId);
    } else if (existing) {
      // Update
      newDevices = sc.devices.map(d => d.deviceId === deviceId ? { ...d, ...cfg } : d);
    } else {
      // Add
      const device = devices.find(d => d.id === deviceId);
      newDevices = [...sc.devices, { deviceId, gpioPin: device?.gpioPin, mode: 'on', ...cfg }];
    }
    updateStage(stageIdx, { devices: newDevices });
  }

  async function handleSubmit() {
    if (!finalCrop) { setError('Select or enter a crop type.'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = {
        moduleId,
        cropType: finalCrop,
        variety: variety.trim() || null,
        notes: notes.trim() || null,
        expectedDays: totalDays,
        stageConfigs: stageConfigs.map(s => ({
          stage: s.stage,
          days: s.days,
          devices: s.devices,
        })),
        updatedAt: Timestamp.now(),
      };

      if (isEdit) {
        await updateDoc(doc(db, 'harvest_cycles', editCycle!.id!), payload);
      } else {
        await addDoc(collection(db, 'harvest_cycles'), {
          ...payload,
          startDate: Timestamp.now(),
          currentStage: 'seeding',
          status: 'active',
          stageHistory: [{ stage: 'seeding', startedAt: Timestamp.now() }],
          stageStartTimes: { seeding: Timestamp.now() },
          createdAt: Timestamp.now(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save cycle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? `Edit: ${editCycle!.cropType}` : 'Start Harvest Cycle'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 'crop'
                ? isEdit ? 'Update crop details' : 'Choose your crop & variety'
                : `${stageConfigs.length} stages · ${totalDays} days total`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step pills */}
        <div className="flex px-6 pt-4 gap-2 shrink-0">
          {(['crop', 'stages'] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => { if (s === 'crop' || finalCrop) setStep(s); }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                step === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${step === s ? 'bg-white/30' : 'bg-gray-300 text-white'}`}>{i + 1}</span>
              {s === 'crop' ? 'Crop' : 'Stages & Devices'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {step === 'crop' && (
            <CropStep
              cropType={cropType}
              customCrop={customCrop}
              variety={variety}
              notes={notes}
              cropNames={cropNames}
              organizationId={organizationId}
              cropsLoading={cropsLoading}
              onCropType={setCropType}
              onCustomCrop={setCustomCrop}
              onVariety={setVariety}
              onNotes={setNotes}
              onCropsImported={(names) => {
                // After importing from research DB, add to managedCrops list (they've been added to Firestore by CropStep)
                setCropsLoading(true);
                getDocs(query(collection(db, 'crops'), where('organizationId', '==', organizationId)))
                  .then(snap => {
                    setManagedCrops(snap.docs.map(d => ({ id: d.id, ...d.data() } as Crop)));
                    setCropsLoading(false);
                  })
                  .catch(() => setCropsLoading(false));
              }}
            />
          )}

          {step === 'stages' && (
            <StagesStep
              stageConfigs={stageConfigs}
              devices={devices}
              onUpdateStage={updateStage}
              onSetDeviceConfig={setDeviceConfig}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          {step === 'crop' ? (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!finalCrop) { setError('Select or enter a crop.'); return; }
                  setError(''); setStep('stages');
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition"
              >
                Configure Stages →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep('crop')} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-60 transition"
              >
                {saving ? 'Saving...' : isEdit ? '✓ Save Changes' : '🌱 Start Cycle'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Crop Step ────────────────────────────────────────────────────────────────

function CropStep({
  cropType, customCrop, variety, notes, cropNames, organizationId, cropsLoading,
  onCropType, onCustomCrop, onVariety, onNotes, onCropsImported,
}: {
  cropType: string;
  customCrop: string;
  variety: string;
  notes: string;
  cropNames: string[];
  organizationId?: string;
  cropsLoading: boolean;
  onCropType: (v: string) => void;
  onCustomCrop: (v: string) => void;
  onVariety: (v: string) => void;
  onNotes: (v: string) => void;
  onCropsImported: (names: string[]) => void;
}) {
  const isCustom = cropType === '__custom__';
  const [showResearchImport, setShowResearchImport] = useState(false);

  // Build crop options: Crop Management crops first, then built-in defaults (only names not already in managed)
  const builtinNames = BUILTIN_DEFAULTS.map(p => p.name);
  const allNames = [...cropNames];
  builtinNames.forEach(n => { if (!allNames.includes(n)) allNames.push(n); });

  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Crop Type</label>

        {cropsLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Managed crops from Crop Management */}
            {cropNames.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5 font-medium">From Crop Management</p>
                <div className="grid grid-cols-3 gap-2">
                  {cropNames.map(name => (
                    <button
                      key={name}
                      onClick={() => { onCropType(name); onCustomCrop(''); }}
                      className={`py-2.5 px-2 rounded-xl text-sm font-medium border-2 transition text-center truncate ${
                        cropType === name ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >{name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Built-in defaults (only show ones not already in managed) */}
            {builtinNames.filter(n => !cropNames.includes(n)).length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5 font-medium">{cropNames.length > 0 ? 'Suggestions' : 'Quick Start'}</p>
                <div className="grid grid-cols-3 gap-2">
                  {builtinNames.filter(n => !cropNames.includes(n)).map(name => (
                    <button
                      key={name}
                      onClick={() => { onCropType(name); onCustomCrop(''); }}
                      className={`py-2.5 px-2 rounded-xl text-sm font-medium border-2 transition text-center truncate ${
                        cropType === name ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >{name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom + Import row */}
            <div className="flex gap-2">
              <button
                onClick={() => onCropType('__custom__')}
                className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium border-2 transition ${
                  isCustom ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dashed border-gray-300 text-gray-500 hover:border-gray-400'
                }`}
              >+ Custom</button>
              <button
                onClick={() => setShowResearchImport(true)}
                className="flex-1 py-2.5 px-2 rounded-xl text-sm font-medium border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition"
              >📚 Import from Research</button>
            </div>
          </>
        )}
      </div>

      {isCustom && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Crop Name</label>
          <input
            autoFocus type="text" value={customCrop}
            onChange={e => onCustomCrop(e.target.value)}
            placeholder="e.g. Bok Choy, Cilantro..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Variety <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text" value={variety}
          onChange={e => onVariety(e.target.value)}
          placeholder="e.g. Red Acre, Rambo..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={notes} onChange={e => onNotes(e.target.value)} rows={2}
          placeholder="Tray density, seed source, environment notes..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Research DB Import Modal */}
      {showResearchImport && (
        <ResearchImportModal
          organizationId={organizationId}
          existingCropNames={allNames}
          onImported={(names) => {
            onCropsImported(names);
            setShowResearchImport(false);
            // Select the first imported crop
            if (names.length > 0) onCropType(names[0]);
          }}
          onClose={() => setShowResearchImport(false)}
        />
      )}
    </>
  );
}

// ─── Stages Step ──────────────────────────────────────────────────────────────

function StagesStep({ stageConfigs, devices, onUpdateStage, onSetDeviceConfig }: {
  stageConfigs: StageConfig[];
  devices: ModuleDevice[];
  onUpdateStage: (i: number, ch: Partial<StageConfig>) => void;
  onSetDeviceConfig: (stageIdx: number, deviceId: string, cfg: Partial<StageDeviceConfig> | null) => void;
}) {
  const totalDays = stageConfigs.reduce((s, c) => s + c.days, 0);
  const [showAddStage, setShowAddStage] = useState(false);

  // Add new stage
  function addStage(label: string, icon: string, description: string, days: number) {
    const newStage = createCustomStage(
      `custom_${Date.now()}`,
      label,
      icon,
      description,
      days
    );
    // Insert before the last stage (usually harvest)
    const insertIndex = Math.max(0, stageConfigs.length - 1);
    const parent = (onUpdateStage as any).__parent;
    if (parent?.setStageConfigs) {
      parent.setStageConfigs((prev: StageConfig[]) => [
        ...prev.slice(0, insertIndex),
        newStage,
        ...prev.slice(insertIndex),
      ]);
    }
    setShowAddStage(false);
  }

  // Move stage up/down
  function moveStage(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= stageConfigs.length) return;
    const parent = (onUpdateStage as any).__parent;
    if (parent?.setStageConfigs) {
      parent.setStageConfigs((prev: StageConfig[]) => {
        const newConfigs = [...prev];
        const [moved] = newConfigs.splice(fromIndex, 1);
        newConfigs.splice(toIndex, 0, moved);
        return newConfigs;
      });
    }
  }

  // Delete stage
  function deleteStage(index: number) {
    const parent = (onUpdateStage as any).__parent;
    if (parent?.setStageConfigs) {
      parent.setStageConfigs((prev: StageConfig[]) => prev.filter((_, i) => i !== index));
    }
  }

  return (
    <div className="space-y-3">
      {devices.length === 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span>⚠️</span>
          <p className="text-xs text-amber-800">
            No devices registered yet. Go to the <strong>Devices</strong> tab to add your sensors and actuators first.
          </p>
        </div>
      )}

      {stageConfigs.map((cfg, i) => (
        <StageConfigRow
          key={`${cfg.stage}-${i}`}
          stageIdx={i}
          cfg={cfg}
          devices={devices}
          isFirst={i === 0}
          isLast={i === stageConfigs.length - 1}
          onUpdateDays={days => onUpdateStage(i, { days })}
          onUpdateMeta={(label, icon, description) => onUpdateStage(i, { label, icon, description })}
          onSetDeviceConfig={onSetDeviceConfig}
          onMoveUp={() => moveStage(i, i - 1)}
          onMoveDown={() => moveStage(i, i + 1)}
          onDelete={() => deleteStage(i)}
        />
      ))}

      {/* Add new stage button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAddStage(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 hover:border-primary-300 rounded-xl transition text-sm font-medium text-primary-700"
        >
          <span>➕</span>
          Add Stage
        </button>
      </div>

      {/* Add Stage Modal */}
      {showAddStage && (
        <AddStageModal
          onAdd={addStage}
          onClose={() => setShowAddStage(false)}
        />
      )}

      <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary-800">Total grow time</span>
        <span className="text-lg font-bold text-primary-700">{totalDays} days</span>
      </div>
    </div>
  );
}

// ─── Stage Config Row ─────────────────────────────────────────────────────────

function StageConfigRow({ stageIdx, cfg, devices, isFirst, isLast, onUpdateDays, onUpdateMeta, onSetDeviceConfig, onMoveUp, onMoveDown, onDelete }: {
  stageIdx: number;
  cfg: StageConfig;
  devices: ModuleDevice[];
  isFirst: boolean;
  isLast: boolean;
  onUpdateDays: (d: number) => void;
  onUpdateMeta: (label: string, icon: string, description: string) => void;
  onSetDeviceConfig: (si: number, deviceId: string, cfg: Partial<StageDeviceConfig> | null) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(cfg.label || DEFAULT_STAGE_META[cfg.stage]?.label || '');
  const [editIcon, setEditIcon] = useState(cfg.icon || DEFAULT_STAGE_META[cfg.stage]?.icon || '📟');
  const [editDescription, setEditDescription] = useState(cfg.description || DEFAULT_STAGE_META[cfg.stage]?.description || '');
  
  const meta = { 
    label: cfg.label || DEFAULT_STAGE_META[cfg.stage]?.label || 'Custom Stage',
    icon: cfg.icon || DEFAULT_STAGE_META[cfg.stage]?.icon || '📟',
    description: cfg.description || DEFAULT_STAGE_META[cfg.stage]?.description || 'Custom stage description'
  };
  const assignedCount = cfg.devices.length;
  const isCustom = !STAGES.includes(cfg.stage);

  function saveMetadata() {
    onUpdateMeta(editLabel, editIcon, editDescription);
    setEditing(false);
  }

  function cancelEdit() {
    setEditLabel(meta.label);
    setEditIcon(meta.icon);
    setEditDescription(meta.description);
    setEditing(false);
  }
  const actuators = devices.filter(d => d.type === 'actuator');
  const sensors = devices.filter(d => d.type === 'sensor');

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Stage header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              className="w-10 text-center text-lg border border-gray-300 rounded px-1"
              maxLength={2}
            />
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="font-semibold text-gray-900 text-sm border border-gray-300 rounded px-2 py-1 flex-1"
              placeholder="Stage name"
            />
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="text-xs text-gray-500 border border-gray-300 rounded px-2 py-1 flex-1"
              placeholder="Stage description"
            />
          </div>
        ) : (
          <>
            <span className="text-xl shrink-0">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">{meta.label}</p>
                {assignedCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                    {assignedCount} device{assignedCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{meta.description}</p>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Edit/Save controls */}
          {editing ? (
            <div className="flex items-center gap-1">
              <button onClick={saveMetadata} className="w-7 h-7 rounded bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center text-xs">✓</button>
              <button onClick={cancelEdit} className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-xs">✕</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-xs">✏️</button>
          )}

          {/* Move buttons */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="w-5 h-4 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs"
            >
              ⬆️
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="w-5 h-4 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs"
            >
              ⬇️
            </button>
          </div>

          {/* Delete button (only for custom stages) */}
          {isCustom && (
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xs"
            >
              🗑️
            </button>
          )}

          {/* Day stepper */}
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onUpdateDays(Math.max(1, cfg.days - 1))}
              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold text-base leading-none">−</button>
            <span className="w-8 text-center text-sm font-bold text-gray-900">{cfg.days}</span>
            <button type="button" onClick={() => onUpdateDays(Math.min(21, cfg.days + 1))}
              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold text-base leading-none">+</button>
            <span className="text-xs text-gray-400">d</span>
          </div>
        </div>
      </div>

      {/* Device picker trigger */}
      {devices.length > 0 && (
        <div className="px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-xl bg-white hover:border-primary-400 hover:bg-primary-50/30 transition text-left"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              {assignedCount === 0 ? (
                <span className="text-sm text-gray-400">Assign devices…</span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cfg.devices.map(sd => {
                    const d = devices.find(x => x.id === sd.deviceId);
                    if (!d) return null;
                    return (
                      <span key={sd.deviceId} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        sd.mode === 'on' ? 'bg-green-100 text-green-700' :
                        sd.mode === 'off' ? 'bg-gray-100 text-gray-600' :
                        sd.mode === 'timer' ? 'bg-blue-100 text-blue-700' :
                        sd.mode === 'sensor_triggered' ? 'bg-purple-100 text-purple-700' :
                        'bg-primary-100 text-primary-700'
                      }`}>
                        {deviceIcon(d)} {d.name}
                        <span className="opacity-60 text-xs">
                          {sd.mode === 'timer' ? '⏱' : sd.mode === 'sensor_triggered' ? '🔆' : sd.mode?.toUpperCase()}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <svg className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="mt-1.5 border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white divide-y divide-gray-100">
              {/* Actuators section */}
              {actuators.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-gray-50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Actuators — Control Mode</p>
                    <p className="text-xs text-gray-400 mt-0.5">ON, OFF, Timer, or Sensor-triggered per stage</p>
                  </div>
                  {actuators.map(device => {
                    const sd = cfg.devices.find(x => x.deviceId === device.id);
                    return (
                      <DeviceControlRow
                        key={device.id}
                        device={device}
                        sd={sd || null}
                        sensors={sensors}
                        onSet={(c) => onSetDeviceConfig(stageIdx, device.id, c)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Sensors section */}
              {sensors.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-gray-50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sensors — Monitor</p>
                    <p className="text-xs text-gray-400 mt-0.5">Enable sensors to track readings during this stage</p>
                  </div>
                  {sensors.map(device => {
                    const sd = cfg.devices.find(x => x.deviceId === device.id);
                    const isMonitored = !!sd;
                    return (
                      <div key={device.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{deviceIcon(device)}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{device.name}</p>
                            <p className="text-xs text-gray-400 capitalize">
                              {device.subtype}{device.gpioPin != null ? ` · Pin ${device.gpioPin}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSetDeviceConfig(stageIdx, device.id, isMonitored ? null : { mode: 'monitor' })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition shrink-0 ml-3 ${
                            isMonitored
                              ? 'bg-primary-500 text-white border-primary-500'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-primary-400 hover:text-primary-600'
                          }`}
                        >{isMonitored ? '✓ Active' : 'Monitor'}</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-3 py-2 bg-gray-50 flex justify-end">
                <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Done ✓</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Device Control Row ───────────────────────────────────────────────────────

function DeviceControlRow({ device, sd, sensors, onSet }: {
  device: ModuleDevice;
  sd: StageDeviceConfig | null;
  sensors: ModuleDevice[];
  onSet: (cfg: Partial<StageDeviceConfig> | null) => void;
}) {
  const mode = sd?.mode as DeviceControlMode | undefined;
  const [expandTimer, setExpandTimer] = useState(mode === 'timer');
  const [expandSensor, setExpandSensor] = useState(mode === 'sensor_triggered');

  function selectMode(m: DeviceControlMode | null) {
    if (m === null) { onSet(null); setExpandTimer(false); setExpandSensor(false); return; }
    onSet({ mode: m });
    setExpandTimer(m === 'timer');
    setExpandSensor(m === 'sensor_triggered');
  }

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base shrink-0">{deviceIcon(device)}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{device.name}</p>
            <p className="text-xs text-gray-400 capitalize">
              {device.subtype}{device.gpioPin != null ? ` · Pin ${device.gpioPin}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0 ml-3">
          {(['on', 'off', 'timer', 'sensor_triggered'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => selectMode(mode === m ? null : m)}
              className={`px-2 py-1 rounded-lg text-xs font-bold border-2 transition ${
                mode === m
                  ? m === 'on' ? 'bg-green-500 text-white border-green-500'
                    : m === 'off' ? 'bg-gray-700 text-white border-gray-700'
                    : m === 'timer' ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-purple-500 text-white border-purple-500'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
              title={m === 'sensor_triggered' ? 'Sensor triggered' : m.charAt(0).toUpperCase() + m.slice(1)}
            >
              {m === 'on' ? 'ON' : m === 'off' ? 'OFF' : m === 'timer' ? '⏱' : '🔆'}
            </button>
          ))}
        </div>
      </div>

      {/* Timer config */}
      {mode === 'timer' && expandTimer && (
        <div className="px-3 pb-3 bg-blue-50/50 space-y-2">
          <p className="text-xs font-semibold text-blue-700 pt-1">Timer Settings</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Run for (seconds)</label>
              <input
                type="number" min={1} max={3600}
                value={sd?.timerDurationSec || 30}
                onChange={e => onSet({ timerDurationSec: parseInt(e.target.value) || 30 })}
                className="w-full px-2 py-1.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Every (minutes)</label>
              <input
                type="number" min={1} max={1440}
                value={sd?.timerIntervalMin || 60}
                onChange={e => onSet({ timerIntervalMin: parseInt(e.target.value) || 60 })}
                className="w-full px-2 py-1.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <p className="text-xs text-blue-600">
            Runs {sd?.timerDurationSec || 30}s every {sd?.timerIntervalMin || 60} min
            {' '}({Math.round(((sd?.timerDurationSec || 30) / ((sd?.timerIntervalMin || 60) * 60)) * 100)}% duty)
          </p>
        </div>
      )}

      {/* Sensor-triggered config */}
      {mode === 'sensor_triggered' && expandSensor && (
        <div className="px-3 pb-3 bg-purple-50/50 space-y-2">
          <p className="text-xs font-semibold text-purple-700 pt-1">Sensor Trigger Settings</p>
          {sensors.length === 0 ? (
            <p className="text-xs text-purple-600">No sensors available. Add sensors in the Devices tab first.</p>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Trigger sensor</label>
                <select
                  value={sd?.triggerSensorDeviceId || ''}
                  onChange={e => onSet({ triggerSensorDeviceId: e.target.value })}
                  className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  <option value="">Select sensor…</option>
                  {sensors.map(s => (
                    <option key={s.id} value={s.id}>{deviceIcon(s)} {s.name} ({s.subtype})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">When reading is</label>
                  <select
                    value={sd?.triggerDirection || 'below'}
                    onChange={e => onSet({ triggerDirection: e.target.value as 'below' | 'above' })}
                    className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  >
                    <option value="below">Below threshold</option>
                    <option value="above">Above threshold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Threshold value</label>
                  <input
                    type="number"
                    value={sd?.triggerThreshold ?? ''}
                    onChange={e => onSet({ triggerThreshold: parseFloat(e.target.value) })}
                    placeholder="e.g. 60"
                    className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Run for (seconds)</label>
                <input
                  type="number" min={1} max={3600}
                  value={sd?.triggerDurationSec || 30}
                  onChange={e => onSet({ triggerDurationSec: parseInt(e.target.value) || 30 })}
                  className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              {sd?.triggerSensorDeviceId && sd.triggerThreshold != null && (
                <p className="text-xs text-purple-600">
                  Activates {device.name} for {sd.triggerDurationSec || 30}s when {sensors.find(s => s.id === sd.triggerSensorDeviceId)?.name || 'sensor'} is {sd.triggerDirection || 'below'} {sd.triggerThreshold}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Complete Cycle Modal ─────────────────────────────────────────────────────

function CompleteCycleModal({ cycle, onClose }: { cycle: HarvestCycle; onClose: () => void }) {
  const [yieldWeight, setYieldWeight] = useState('');
  const [yieldUnit, setYieldUnit] = useState<'oz' | 'lbs' | 'g' | 'kg'>('oz');
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState(cycle.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'harvest_cycles', cycle.id!), {
        status: 'completed',
        currentStage: 'completed',
        harvestDate: Timestamp.now(),
        actualHarvestDate: Timestamp.now(),
        yieldWeight: parseFloat(yieldWeight) || null,
        yieldUnit,
        quality,
        notes: notes.trim() || null,
        updatedAt: Timestamp.now(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Complete Harvest ✂️</h2>
            <p className="text-sm text-gray-500 mt-0.5">{cycle.cropType}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Yield</label>
            <div className="flex gap-2">
              <input
                type="number" step="0.1" value={yieldWeight}
                onChange={e => setYieldWeight(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                value={yieldUnit}
                onChange={e => setYieldUnit(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="oz">oz</option><option value="lbs">lbs</option>
                <option value="g">g</option><option value="kg">kg</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quality</label>
            <div className="grid grid-cols-4 gap-2">
              {(['excellent', 'good', 'fair', 'poor'] as const).map(q => (
                <button key={q} type="button" onClick={() => setQuality(q)}
                  className={`py-2 rounded-xl text-sm font-medium border-2 capitalize transition ${
                    quality === q
                      ? q === 'excellent' ? 'border-green-500 bg-green-50 text-green-700'
                        : q === 'good' ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : q === 'fair' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >{q}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Quality observations, next cycle notes..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-700 disabled:opacity-60 transition">
              {saving ? 'Saving...' : '✅ Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Research Import Modal ────────────────────────────────────────────────────

function ResearchImportModal({
  organizationId, existingCropNames, onImported, onClose,
}: {
  organizationId?: string;
  existingCropNames: string[];
  onImported: (names: string[]) => void;
  onClose: () => void;
}) {
  const [researchCrops, setResearchCrops] = useState<CropResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'cropResearch'), orderBy('name', 'asc')))
      .then(snap => {
        setResearchCrops(snap.docs.map(d => ({ id: d.id, ...d.data() } as CropResearch)));
        setLoading(false);
      })
      .catch(() => {
        // Fallback without orderBy
        getDocs(collection(db, 'cropResearch'))
          .then(snap => {
            const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as CropResearch));
            setResearchCrops(results.sort((a, b) => a.name.localeCompare(b.name)));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, []);

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  async function handleImport() {
    if (selected.size === 0) return;
    setImporting(true);
    const now = Timestamp.now();
    const names: string[] = [];
    for (const name of selected) {
      // Only add to crops collection if it doesn't already exist
      if (existingCropNames.includes(name)) { names.push(name); continue; }
      await addDoc(collection(db, 'crops'), {
        name,
        variety: '',
        fieldId: '',
        fieldName: '',
        sectionId: '',
        sectionName: '',
        plantedDate: now,
        harvestReadyDate: now,
        status: 'planning',
        organizationId: organizationId || '',
        userId: '',
        createdBy: 'research-import',
        createdAt: now,
        updatedAt: now,
        notes: `Imported from Crop Research Database`,
      });
      names.push(name);
    }
    onImported(names);
    setImporting(false);
  }

  const filtered = researchCrops.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">📚 Import from Research</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {researchCrops.length > 0 ? `${researchCrops.length} crops in your research database` : 'Loading…'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-3 shrink-0">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search crops or categories…"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-1.5">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading research database…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">{search ? 'No matching crops found' : 'No crops in research database'}</p>
              <p className="text-xs text-gray-300 mt-1">Add entries in the Research tab first</p>
            </div>
          ) : (
            filtered.map(crop => {
              const alreadyExists = existingCropNames.includes(crop.name);
              const isSelected = selected.has(crop.name);
              return (
                <button
                  key={crop.id}
                  onClick={() => !alreadyExists && toggle(crop.name)}
                  disabled={alreadyExists}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition ${
                    alreadyExists ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' :
                    isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{crop.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {crop.category}{crop.growingTime ? ` · ${crop.growingTime}` : ''}
                    </p>
                  </div>
                  {alreadyExists ? (
                    <span className="text-xs text-gray-400 shrink-0 ml-2">Already added</span>
                  ) : isSelected ? (
                    <span className="text-xs text-primary-600 font-semibold shrink-0 ml-2">✓ Selected</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={selected.size === 0 || importing}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-60 transition"
          >
            {importing ? 'Importing…' : selected.size > 0 ? `Import ${selected.size} Crop${selected.size > 1 ? 's' : ''}` : 'Select crops'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HarvestSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="w-40 h-6 bg-gray-200 rounded-lg animate-pulse" />
        <div className="w-28 h-9 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
        <div className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
        <div className="w-full h-2 bg-gray-100 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '—';
  try {
    return new Date((ts.seconds || 0) * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return '—'; }
}

/** Convert old activateDeviceIds / deactivateDeviceIds to new devices[] format */
function migrateLegacyDevices(sc: StageConfig): StageDeviceConfig[] {
  const result: StageDeviceConfig[] = [];
  (sc.activateDeviceIds || []).forEach(id => result.push({ deviceId: id, mode: 'on' }));
  (sc.deactivateDeviceIds || []).forEach(id => {
    if (!result.find(r => r.deviceId === id)) result.push({ deviceId: id, mode: 'off' });
  });
  return result;
}

// ─── Add Stage Modal ──────────────────────────────────────────────────────────

function AddStageModal({ onAdd, onClose }: {
  onAdd: (label: string, icon: string, description: string, days: number) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('🌱');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState(1);

  function handleSubmit() {
    if (!label.trim()) return;
    onAdd(label.trim(), icon, description.trim(), days);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">➕ Add Custom Stage</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div className="flex gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-12 h-10 text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name *</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Pre-soak, Drying"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description of this stage..."
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition"
          >
            Add Stage
          </button>
        </div>
      </div>
    </div>
  );
}
