/**
 * Harvest Cycle Section — Grow Cycle Manager
 *
 * Replaces the original manual-only harvest tracker with a full
 * grow cycle engine. Users select a program (preset or custom),
 * bind pins, and press Start. The engine auto-transitions stages
 * by writing per-pin schedules to Firestore — the Pi executes them
 * via the existing on_snapshot -> schedule executor pipeline.
 *
 * Zero changes needed on the Pi side.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { GrowCycle, GrowProgram, GrowStage, GrowStageType } from '../../types/farmModule';
import { growCycleService, GROW_PROGRAM_PRESETS } from '../../services/growCycleService';

interface HarvestCycleSectionProps {
  moduleId: string;
  hardwareSerial: string;
}

export default function HarvestCycleSection({ moduleId, hardwareSerial }: HarvestCycleSectionProps) {
  const { currentOrganization } = useAuth();
  const [cycles, setCycles] = useState<GrowCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Subscribe to grow cycles for this module
  useEffect(() => {
    const q = query(
      collection(db, 'grow_cycles'),
      where('moduleId', '==', moduleId),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GrowCycle));
      data.sort((a, b) => {
        const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });
      setCycles(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [moduleId]);

  // Grow Cycle Engine — evaluate active cycle on load and every 60s
  const activeCycle = cycles.find(c => c.status === 'active');

  useEffect(() => {
    if (!activeCycle) return;

    const evaluate = () => {
      growCycleService.evaluateCycle(activeCycle).then(transitioned => {
        if (transitioned) console.log('[GrowCycleEngine] Stage transition occurred');
      }).catch(err => console.error('Cycle evaluation error:', err));
    };

    evaluate(); // immediate
    const interval = setInterval(evaluate, 60_000); // every 60s
    return () => clearInterval(interval);
  }, [activeCycle?.id, activeCycle?.currentStage, activeCycle?.currentDay]);

  const completedCycles = cycles.filter(c => c.status === 'completed');

  if (loading) return <CycleSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grow Cycles</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeCycle
              ? `${activeCycle.programName} — Day ${computeCurrentDay(activeCycle)} of ${activeCycle.totalDays}`
              : 'No active cycle — select a program to start'}
          </p>
        </div>
        {!activeCycle && (
          <button
            onClick={() => setShowStartModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center space-x-2"
          >
            <span>🌱</span>
            <span>Start Grow Cycle</span>
          </button>
        )}
      </div>

      {/* Active Cycle */}
      {activeCycle ? (
        <>
          <ActiveCycleCard
            cycle={activeCycle}
            onComplete={() => setShowCompleteModal(true)}
            onPause={() => growCycleService.pauseCycle(activeCycle.id!, activeCycle.moduleId, activeCycle.pinBindings)}
            onAbort={() => {
              if (confirm('Abort this grow cycle? All schedules will be removed.')) {
                growCycleService.abortCycle(activeCycle.id!, activeCycle.moduleId, activeCycle.pinBindings);
              }
            }}
          />
          <StageTimeline cycle={activeCycle} />
          <CurrentStageDetail cycle={activeCycle} />
        </>
      ) : (
        <EmptyState onStart={() => setShowStartModal(true)} />
      )}

      {/* Paused cycle */}
      {cycles.filter(c => c.status === 'paused').map(c => (
        <PausedCycleCard key={c.id} cycle={c} onResume={() => growCycleService.resumeCycle(c)} />
      ))}

      {/* History */}
      {completedCycles.length > 0 && <CycleHistory cycles={completedCycles} />}

      {/* Modals */}
      {showStartModal && (
        <StartCycleModal
          moduleId={moduleId}
          hardwareSerial={hardwareSerial}
          organizationId={currentOrganization?.id || ''}
          onClose={() => setShowStartModal(false)}
        />
      )}
      {showCompleteModal && activeCycle && (
        <CompleteCycleModal
          cycle={activeCycle}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function computeCurrentDay(cycle: GrowCycle): number {
  const startMs = cycle.startedAt instanceof Timestamp
    ? cycle.startedAt.toMillis()
    : (cycle.startedAt as any)?.seconds
      ? (cycle.startedAt as any).seconds * 1000
      : Date.now();
  return Math.max(1, Math.floor((Date.now() - startMs) / 86400000) + 1);
}

function getStageForDay(stages: GrowStage[], day: number): GrowStage | undefined {
  return stages.find(s => day >= s.dayStart && day <= s.dayEnd);
}

function formatFrequency(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

const STAGE_ICONS: Record<GrowStageType, string> = {
  seeding: '🌾',
  germination: '🌱',
  blackout: '🌑',
  light_exposure: '💡',
  growth: '🌿',
  pre_harvest: '✂️',
  harvest: '📦',
};

const STAGE_COLORS: Record<GrowStageType, string> = {
  seeding: 'bg-amber-100 text-amber-800 border-amber-300',
  germination: 'bg-lime-100 text-lime-800 border-lime-300',
  blackout: 'bg-gray-800 text-gray-100 border-gray-600',
  light_exposure: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  growth: 'bg-green-100 text-green-800 border-green-300',
  pre_harvest: 'bg-orange-100 text-orange-800 border-orange-300',
  harvest: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

// =============================================================================
// ACTIVE CYCLE CARD
// =============================================================================

function ActiveCycleCard({ cycle, onComplete, onPause, onAbort }: {
  cycle: GrowCycle;
  onComplete: () => void;
  onPause: () => void;
  onAbort: () => void;
}) {
  const currentDay = computeCurrentDay(cycle);
  const progress = Math.min(100, Math.round((currentDay / cycle.totalDays) * 100));
  const daysRemaining = Math.max(0, cycle.totalDays - currentDay);
  const currentStage = getStageForDay(cycle.stages || [], currentDay);
  const isHarvestReady = currentDay >= cycle.totalDays;

  return (
    <div className={`rounded-xl border-2 p-6 ${isHarvestReady ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300' : 'bg-gradient-to-br from-blue-50 to-white border-blue-200'}`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{cycle.programName}</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          <p className="text-gray-600">
            Day <span className="font-bold text-lg">{currentDay}</span> of {cycle.totalDays}
            {daysRemaining > 0 && ` — ${daysRemaining} days remaining`}
            {isHarvestReady && ' — Ready to harvest!'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isHarvestReady && (
            <button onClick={onComplete} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
              🌾 Complete Harvest
            </button>
          )}
          <button onClick={onPause} className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium">
            ⏸ Pause
          </button>
          <button onClick={onAbort} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
            ✕ Abort
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Cycle Progress</span>
          <span className="text-sm font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isHarvestReady ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-green-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Stage Badge */}
      {currentStage && (
        <div className={`flex items-center space-x-3 p-4 rounded-lg border ${STAGE_COLORS[currentStage.type]}`}>
          <span className="text-3xl">{STAGE_ICONS[currentStage.type]}</span>
          <div className="flex-1">
            <p className="text-sm opacity-75">Current Stage</p>
            <p className="text-lg font-semibold">{currentStage.name}</p>
            <p className="text-xs opacity-75 mt-1">
              Days {currentStage.dayStart}–{currentStage.dayEnd}
              {currentStage.schedules.map((s, i) => (
                <span key={i} className="ml-2">
                  • {s.targetSubtype}: {formatDuration(s.durationSeconds)} ON / {formatFrequency(s.frequencySeconds)} interval
                </span>
              ))}
              {currentStage.lighting.enabled && (
                <span className="ml-2">• 💡 {currentStage.lighting.onHour}:00–{currentStage.lighting.offHour}:00</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Pin Bindings */}
      {cycle.pinBindings && Object.keys(cycle.pinBindings).length > 0 && (
        <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
          <span className="font-medium">Pin Bindings:</span>
          {Object.entries(cycle.pinBindings).map(([subtype, pin]) => (
            <span key={subtype} className="px-2 py-1 bg-gray-100 rounded">
              {subtype} → GPIO{pin}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STAGE TIMELINE
// =============================================================================

function StageTimeline({ cycle }: { cycle: GrowCycle }) {
  const stages = cycle.stages || [];
  const currentDay = computeCurrentDay(cycle);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Stage Timeline</h3>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-4">
          {stages.map((stage) => {
            const isCompleted = currentDay > stage.dayEnd;
            const isCurrent = currentDay >= stage.dayStart && currentDay <= stage.dayEnd;

            return (
              <div key={stage.type} className="relative flex items-start">
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 flex-shrink-0 ${
                  isCompleted ? 'bg-green-500 border-green-200'
                  : isCurrent ? 'bg-blue-500 border-blue-200 ring-4 ring-blue-100'
                  : 'bg-white border-gray-300'
                }`}>
                  {isCompleted ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xl">{STAGE_ICONS[stage.type]}</span>
                  )}
                </div>
                <div className="ml-4 flex-1 pb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-base font-semibold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {stage.name}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isCurrent ? 'bg-blue-100 text-blue-700' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      Day {stage.dayStart}{stage.dayEnd !== stage.dayStart ? `–${stage.dayEnd}` : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-x-3">
                    {stage.schedules.map((s, i) => (
                      <span key={i}>💧 {s.targetSubtype}: {formatDuration(s.durationSeconds)}/{formatFrequency(s.frequencySeconds)}</span>
                    ))}
                    {stage.lighting.enabled
                      ? <span>💡 {stage.lighting.onHour}:00–{stage.lighting.offHour}:00</span>
                      : <span>🌑 No light</span>
                    }
                    {stage.environment.tempMinF && <span>🌡️ {stage.environment.tempMinF}–{stage.environment.tempMaxF}°F</span>}
                  </div>
                  {isCurrent && (
                    <div className="mt-1 flex items-center space-x-2 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="font-medium">In Progress — Day {currentDay}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CURRENT STAGE DETAIL — Checklist + Environment
// =============================================================================

function CurrentStageDetail({ cycle }: { cycle: GrowCycle }) {
  const currentDay = computeCurrentDay(cycle);
  const stage = getStageForDay(cycle.stages || [], currentDay);
  if (!stage) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {STAGE_ICONS[stage.type]} {stage.name} — Checklist
        </h3>
        <div className="space-y-3">
          {stage.checklist.map((task, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300" />
              <span className="text-sm text-gray-900">{task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Targets */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌡️ Environment Targets</h3>
        <div className="space-y-4">
          {stage.environment.tempMinF && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Temperature</span>
              <span className="text-sm font-semibold text-red-700">
                {stage.environment.tempMinF}°F – {stage.environment.tempMaxF}°F
              </span>
            </div>
          )}
          {stage.environment.humidityMin && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Humidity</span>
              <span className="text-sm font-semibold text-blue-700">
                {stage.environment.humidityMin}% – {stage.environment.humidityMax}%
              </span>
            </div>
          )}
          {stage.environment.coverTrays !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Tray Cover</span>
              <span className={`text-sm font-semibold ${stage.environment.coverTrays ? 'text-green-700' : 'text-gray-500'}`}>
                {stage.environment.coverTrays ? 'Keep covered' : 'Uncovered'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Lighting</span>
            <span className="text-sm font-semibold text-yellow-700">
              {stage.lighting.enabled
                ? `ON ${stage.lighting.onHour}:00 – ${stage.lighting.offHour}:00`
                : 'OFF — Dark period'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Watering</span>
            <span className="text-sm font-semibold text-cyan-700">
              {stage.schedules.map(s =>
                `${formatDuration(s.durationSeconds)} every ${formatFrequency(s.frequencySeconds)}`
              ).join(', ')}
            </span>
          </div>
        </div>
        {stage.notes && (
          <p className="mt-4 text-sm text-gray-600 italic">{stage.notes}</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PAUSED CYCLE CARD
// =============================================================================

function PausedCycleCard({ cycle, onResume }: { cycle: GrowCycle; onResume: () => void }) {
  return (
    <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-semibold text-gray-900">{cycle.programName}</span>
          <span className="ml-3 px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">Paused</span>
          <p className="text-sm text-gray-600 mt-1">
            Day {computeCurrentDay(cycle)} of {cycle.totalDays} — schedules disabled
          </p>
        </div>
        <button onClick={onResume} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
          ▶ Resume
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// START CYCLE MODAL
// =============================================================================

function StartCycleModal({ moduleId, hardwareSerial, organizationId, onClose }: {
  moduleId: string;
  hardwareSerial: string;
  organizationId: string;
  onClose: () => void;
}) {
  const programs = Object.values(GROW_PROGRAM_PRESETS);
  const [selectedProgram, setSelectedProgram] = useState<GrowProgram | null>(null);
  const [step, setStep] = useState<'select' | 'bind'>('select');
  const [pinBindings, setPinBindings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load available actuator pins from the device
  const [actuatorPins, setActuatorPins] = useState<{ pin: number; name: string; subtype: string }[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'devices', hardwareSerial), (snap) => {
      if (!snap.exists()) return;
      const gpioState = snap.data()?.gpioState || {};
      const pins: { pin: number; name: string; subtype: string }[] = [];
      for (const [pinStr, pinData] of Object.entries(gpioState)) {
        const p = pinData as any;
        if (p.type === 'actuator' && p.enabled !== false) {
          pins.push({
            pin: parseInt(pinStr),
            name: p.name || `GPIO${pinStr}`,
            subtype: p.subtype || 'pump',
          });
        }
      }
      setActuatorPins(pins);

      // Auto-bind matching subtypes
      const autoBindings: Record<string, string> = {};
      for (const pin of pins) {
        if (!autoBindings[pin.subtype]) {
          autoBindings[pin.subtype] = pin.pin.toString();
        }
      }
      setPinBindings(autoBindings);
    });
    return () => unsub();
  }, [hardwareSerial]);

  // Get unique target subtypes needed by the selected program
  const getRequiredSubtypes = (program: GrowProgram): string[] => {
    const subtypes = new Set<string>();
    for (const stage of program.stages) {
      for (const sched of stage.schedules) {
        subtypes.add(sched.targetSubtype);
      }
      if (stage.lighting.enabled) subtypes.add('light');
    }
    return Array.from(subtypes);
  };

  const handleStart = async () => {
    if (!selectedProgram) return;
    setSaving(true);
    setError('');

    // Convert pin bindings from string to number
    const bindings: Record<string, number> = {};
    for (const [subtype, pinStr] of Object.entries(pinBindings)) {
      if (pinStr) bindings[subtype] = parseInt(pinStr);
    }

    try {
      await growCycleService.startCycle(selectedProgram, moduleId, organizationId, bindings);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start cycle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'select' ? '🌱 Choose Grow Program' : '🔌 Bind Pins'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {step === 'select' && (
          <div className="p-6 space-y-3">
            {programs.map((program) => (
              <button
                key={program.id}
                onClick={() => { setSelectedProgram(program); setStep('bind'); }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  selectedProgram?.id === program.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{program.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="text-2xl font-bold text-green-600">{program.totalDays}</span>
                    <span className="text-xs text-gray-500 block">days</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {program.stages.map((s) => (
                    <span key={s.type} className={`text-xs px-2 py-1 rounded-full border ${STAGE_COLORS[s.type]}`}>
                      {STAGE_ICONS[s.type]} {s.name} (D{s.dayStart}-{s.dayEnd})
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'bind' && selectedProgram && (
          <div className="p-6 space-y-6">
            {/* Program Summary */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800">{selectedProgram.name}</h3>
              <p className="text-sm text-green-700 mt-1">{selectedProgram.totalDays} days • {selectedProgram.stages.length} stages</p>
            </div>

            {/* Pin Binding */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Assign Hardware Pins</h4>
              <p className="text-xs text-gray-500 mb-4">
                Map each actuator type to a GPIO pin on your device. The system will automatically create and manage schedules for these pins.
              </p>
              <div className="space-y-3">
                {getRequiredSubtypes(selectedProgram).map((subtype) => (
                  <div key={subtype} className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700 w-24 capitalize">{subtype}</label>
                    <select
                      value={pinBindings[subtype] || ''}
                      onChange={(e) => setPinBindings({ ...pinBindings, [subtype]: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">— Select Pin —</option>
                      {actuatorPins.map((pin) => (
                        <option key={pin.pin} value={pin.pin}>
                          GPIO{pin.pin} — {pin.name} ({pin.subtype})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {actuatorPins.length === 0 && (
                <p className="text-sm text-amber-600 mt-3">
                  No actuator pins found on this device. Add actuators in the Devices tab first.
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <div className="flex space-x-3 pt-2">
              <button onClick={() => setStep('select')} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm">
                ← Back
              </button>
              <button
                onClick={handleStart}
                disabled={saving || actuatorPins.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {saving ? 'Starting...' : '🌱 Start Grow Cycle'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMPLETE CYCLE MODAL
// =============================================================================

function CompleteCycleModal({ cycle, onClose }: { cycle: GrowCycle; onClose: () => void }) {
  const [formData, setFormData] = useState({
    yieldWeight: '',
    yieldUnit: 'oz' as 'oz' | 'g' | 'lbs' | 'kg',
    quality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await growCycleService.completeCycle(
        cycle.id!,
        cycle.moduleId,
        cycle.pinBindings,
        {
          yieldWeight: parseFloat(formData.yieldWeight) || undefined,
          yieldUnit: formData.yieldUnit,
          quality: formData.quality,
          notes: formData.notes || undefined,
        },
      );
      onClose();
    } catch (err) {
      console.error('Failed to complete cycle:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">🌾 Complete Harvest</h2>
          <p className="text-sm text-gray-500 mt-1">{cycle.programName}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Yield Weight</label>
              <input
                type="number"
                step="0.1"
                value={formData.yieldWeight}
                onChange={(e) => setFormData({ ...formData, yieldWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., 12.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Unit</label>
              <select
                value={formData.yieldUnit}
                onChange={(e) => setFormData({ ...formData, yieldUnit: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="oz">Ounces (oz)</option>
                <option value="g">Grams (g)</option>
                <option value="lbs">Pounds (lb)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Quality</label>
            <select
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
              placeholder="Notes about this harvest..."
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50">
              {saving ? 'Completing...' : '🌾 Complete Harvest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// CYCLE HISTORY
// =============================================================================

function CycleHistory({ cycles }: { cycles: GrowCycle[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Harvests</h3>
      <div className="space-y-3">
        {cycles.slice(0, 10).map(cycle => {
          const startDate = cycle.startedAt instanceof Timestamp
            ? new Date(cycle.startedAt.toMillis()).toLocaleDateString()
            : 'Unknown';
          const endDate = cycle.completedAt instanceof Timestamp
            ? new Date(cycle.completedAt.toMillis()).toLocaleDateString()
            : 'Unknown';

          return (
            <div key={cycle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{cycle.programName}</h4>
                <p className="text-sm text-gray-500">{startDate} — {endDate}</p>
              </div>
              <div className="text-right">
                {cycle.harvest?.yieldWeight && (
                  <p className="text-lg font-semibold text-gray-900">
                    {cycle.harvest.yieldWeight} {cycle.harvest.yieldUnit || 'oz'}
                  </p>
                )}
                {cycle.harvest?.quality && (
                  <p className="text-xs text-gray-500 capitalize">{cycle.harvest.quality}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE & SKELETON
// =============================================================================

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="text-6xl mb-4">🌱</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Grow Cycle</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Choose a grow program to automate your entire microgreens lifecycle — from seeding to harvest.
        The system handles watering, lighting, and stage transitions automatically.
      </p>
      <button onClick={onStart} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
        🌱 Start Your First Grow Cycle
      </button>
    </div>
  );
}

function CycleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-full h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
