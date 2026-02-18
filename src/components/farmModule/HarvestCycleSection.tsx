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
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { GrowCycle, GrowProgram, GrowStage, GrowStageType } from '../../types/farmModule';
import { growCycleService, growProgramService, GROW_PROGRAM_PRESETS } from '../../services/growCycleService';

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
        <PausedCycleCard key={c.id} cycle={c} onResume={() => growCycleService.resumeCycle(c)} moduleId={moduleId} />
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

function PausedCycleCard({ cycle, onResume, moduleId }: { cycle: GrowCycle; onResume: () => void; moduleId: string }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(`/farm-module/${moduleId}/harvest/${cycle.id}`)} className="text-left">
            <span className="text-lg font-semibold text-gray-900">{cycle.programName}</span>
            <span className="ml-3 px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">Paused</span>
            <p className="text-sm text-gray-600 mt-1">
              Day {computeCurrentDay(cycle)} of {cycle.totalDays} — schedules disabled
            </p>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(`/farm-module/${moduleId}/harvest/${cycle.id}`)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            View
          </button>
          <button onClick={onResume} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
            ▶ Resume
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// START CYCLE MODAL — Presets OR build your own
// =============================================================================

// Emoji/image picker options for custom cycles
const COVER_EMOJIS = ['🌿', '🌾', '🌱', '🥦', '🌽', '🍅', '🥬', '🌸', '🍀', '🌻', '🫛', '🥗'];

const BLANK_STAGE = (): GrowStage => ({
  name: 'New Stage',
  type: 'seeding' as GrowStageType,
  dayStart: 1,
  dayEnd: 1,
  schedules: [{ targetSubtype: 'pump', durationSeconds: 30, frequencySeconds: 7200, startTime: '06:00', endTime: '22:00' }],
  lighting: { enabled: false },
  environment: { tempMinF: 65, tempMaxF: 75, humidityMin: 50, humidityMax: 70 },
  checklist: [],
});

function fmtFreqLocal(seconds: number): string {
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}
function fmtDurLocal(seconds: number): string {
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

function StartCycleModal({ moduleId, hardwareSerial, organizationId, onClose }: {
  moduleId: string;
  hardwareSerial: string;
  organizationId: string;
  onClose: () => void;
}) {
  const programs = Object.values(GROW_PROGRAM_PRESETS);
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');
  const [selectedProgram, setSelectedProgram] = useState<GrowProgram | null>(null);
  const [step, setStep] = useState<'select' | 'bind'>('select');
  const [pinBindings, setPinBindings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Custom builder state ──
  const [customName, setCustomName] = useState('');
  const [customCropType, setCustomCropType] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🌿');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customStages, setCustomStages] = useState<GrowStage[]>([BLANK_STAGE()]);
  const [editingStageIdx, setEditingStageIdx] = useState<number | null>(null);

  // Load available actuator pins from the device
  const [actuatorPins, setActuatorPins] = useState<{ pin: number; name: string; subtype: string }[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'devices', hardwareSerial), (snap) => {
      if (!snap.exists()) return;
      const gpioState = snap.data()?.gpioState || {};
      const pins: { pin: number; name: string; subtype: string }[] = [];
      for (const [pinStr, pinData] of Object.entries(gpioState)) {
        const p = pinData as any;
        const deviceType = p.device_type || p.type || '';
        if (deviceType === 'actuator' && p.enabled !== false) {
          pins.push({ pin: parseInt(pinStr), name: p.name || `GPIO${pinStr}`, subtype: p.subtype || 'pump' });
        }
      }
      setActuatorPins(pins);

      const autoBindings: Record<string, string> = {};
      for (const pin of pins) {
        if (!autoBindings[pin.subtype]) autoBindings[pin.subtype] = pin.pin.toString();
      }
      setPinBindings(autoBindings);
    });
    return () => unsub();
  }, [hardwareSerial]);

  const getRequiredSubtypes = (program: GrowProgram): string[] => {
    const subtypes = new Set<string>();
    for (const stage of program.stages) {
      for (const sched of stage.schedules) subtypes.add(sched.targetSubtype);
      if (stage.lighting.enabled) subtypes.add('light');
    }
    return Array.from(subtypes);
  };

  // ── Preset flow ──
  const handleStart = async () => {
    if (!selectedProgram) return;
    setSaving(true);
    setError('');
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

  // ── Custom flow ──
  const handleStartCustom = async () => {
    if (!customName.trim() || customStages.length === 0) {
      setError('Give your cycle a name and at least one stage.');
      return;
    }
    setSaving(true);
    setError('');
    const totalDays = customStages.reduce((max, s) => Math.max(max, s.dayEnd), 0);
    const program: GrowProgram = {
      name: customName.trim(),
      cropType: customCropType.trim() || customName.trim().toLowerCase().replace(/\s+/g, '_'),
      description: customDescription.trim() || undefined,
      totalDays,
      stages: customStages,
      isPreset: false,
      organizationId,
      imageEmoji: customEmoji,
      imageUrl: customImageUrl.trim() || undefined,
    };
    const bindings: Record<string, number> = {};
    for (const [subtype, pinStr] of Object.entries(pinBindings)) {
      if (pinStr) bindings[subtype] = parseInt(pinStr);
    }
    try {
      // Save as reusable program then start
      const savedId = await growProgramService.createProgram(program);
      await growCycleService.startCycle({ ...program, id: savedId }, moduleId, organizationId, bindings);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start cycle');
    } finally {
      setSaving(false);
    }
  };

  function updateCustomStage(idx: number, updated: GrowStage) {
    setCustomStages(prev => prev.map((s, i) => i === idx ? updated : s));
  }

  function removeCustomStage(idx: number) {
    setCustomStages(prev => prev.filter((_, i) => i !== idx));
  }

  function addCustomStage() {
    const lastDay = customStages.reduce((max, s) => Math.max(max, s.dayEnd), 0);
    setCustomStages(prev => [...prev, { ...BLANK_STAGE(), dayStart: lastDay + 1, dayEnd: lastDay + 1 }]);
    setEditingStageIdx(customStages.length);
  }

  // ── Bind step is shared ──
  const programForBind = tab === 'presets' ? selectedProgram : (customName ? {
    name: customName, cropType: customCropType, totalDays: customStages.reduce((m, s) => Math.max(m, s.dayEnd), 0),
    stages: customStages, isPreset: false,
  } as GrowProgram : null);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'bind' ? '🔌 Bind Hardware Pins' : '🌱 Start Grow Cycle'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {step === 'select' && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0 px-6 pt-4">
              <button
                onClick={() => setTab('presets')}
                className={`mr-4 pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'presets' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                📚 Presets
              </button>
              <button
                onClick={() => setTab('custom')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'custom' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                ✏️ Build Custom
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* ── PRESETS TAB ── */}
              {tab === 'presets' && programs.map((program) => (
                <button
                  key={program.id}
                  onClick={() => { setSelectedProgram(program); setStep('bind'); }}
                  className="w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md border-gray-200 hover:border-green-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">
                        {program.imageEmoji ?? '🌿'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{program.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{program.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
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

              {/* ── CUSTOM TAB ── */}
              {tab === 'custom' && (
                <div className="space-y-5">
                  {/* Cycle identity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Cycle Name *</label>
                      <input
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder="e.g. Wheat Grass — 7 Day"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Crop Type</label>
                      <input
                        value={customCropType}
                        onChange={e => setCustomCropType(e.target.value)}
                        placeholder="e.g. wheat_grass"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                      <input
                        value={customDescription}
                        onChange={e => setCustomDescription(e.target.value)}
                        placeholder="Short note…"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Image / Emoji picker */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Cover Icon</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {COVER_EMOJIS.map(e => (
                        <button
                          key={e}
                          onClick={() => { setCustomEmoji(e); setCustomImageUrl(''); }}
                          className={`w-10 h-10 rounded-xl text-xl transition-all ${customEmoji === e && !customImageUrl ? 'bg-green-200 ring-2 ring-green-500 scale-110' : 'bg-gray-100 hover:bg-green-100'}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Or paste an image URL</label>
                    <div className="flex items-center space-x-2">
                      <input
                        value={customImageUrl}
                        onChange={e => setCustomImageUrl(e.target.value)}
                        placeholder="https://…"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      />
                      {customImageUrl && (
                        <img src={customImageUrl} alt="preview"
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          onError={() => setCustomImageUrl('')} />
                      )}
                    </div>
                  </div>

                  {/* Stages list */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Stages ({customStages.length})</h3>
                      <button onClick={addCustomStage}
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium">
                        + Add Stage
                      </button>
                    </div>
                    <div className="space-y-2">
                      {customStages.map((stage, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{STAGE_ICONS[stage.type]}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{stage.name}</p>
                                <p className="text-xs text-gray-500">
                                  Days {stage.dayStart}–{stage.dayEnd} •{' '}
                                  {stage.schedules.map(s => `${s.targetSubtype}: ${fmtDurLocal(s.durationSeconds)}/${fmtFreqLocal(s.frequencySeconds)}`).join(', ')}
                                  {stage.lighting.enabled ? ` • 💡 ${stage.lighting.onHour}:00–${stage.lighting.offHour}:00` : ' • 🌑 dark'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => setEditingStageIdx(editingStageIdx === idx ? null : idx)}
                                className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 font-medium">
                                {editingStageIdx === idx ? '▲ Close' : '✏️ Edit'}
                              </button>
                              {customStages.length > 1 && (
                                <button onClick={() => removeCustomStage(idx)}
                                  className="text-xs px-2 py-1 text-red-500 hover:text-red-700">✕</button>
                              )}
                            </div>
                          </div>

                          {/* Inline mini-editor */}
                          {editingStageIdx === idx && (
                            <div className="px-4 py-4 space-y-4 border-t border-gray-100">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Name</label>
                                  <input value={stage.name}
                                    onChange={e => updateCustomStage(idx, { ...stage, name: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                                  <select value={stage.type}
                                    onChange={e => updateCustomStage(idx, { ...stage, type: e.target.value as GrowStageType })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
                                    {(['seeding', 'germination', 'blackout', 'light_exposure', 'growth', 'pre_harvest', 'harvest'] as GrowStageType[]).map(t => (
                                      <option key={t} value={t}>{STAGE_ICONS[t]} {t.replace('_', ' ')}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Day Start</label>
                                  <input type="number" min={1} value={stage.dayStart}
                                    onChange={e => updateCustomStage(idx, { ...stage, dayStart: parseInt(e.target.value) || 1 })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Day End</label>
                                  <input type="number" min={1} value={stage.dayEnd}
                                    onChange={e => updateCustomStage(idx, { ...stage, dayEnd: parseInt(e.target.value) || 1 })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                </div>
                              </div>
                              {/* Pump schedule row */}
                              {stage.schedules.map((sched, si) => (
                                <div key={si} className="grid grid-cols-4 gap-2">
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                                    <select value={sched.targetSubtype}
                                      onChange={e => {
                                        const newScheds = [...stage.schedules];
                                        newScheds[si] = { ...sched, targetSubtype: e.target.value as any };
                                        updateCustomStage(idx, { ...stage, schedules: newScheds });
                                      }}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
                                      <option value="pump">pump</option>
                                      <option value="mist">mist</option>
                                      <option value="fan">fan</option>
                                      <option value="valve">valve</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 block mb-1">ON (s)</label>
                                    <input type="number" min={1} value={sched.durationSeconds}
                                      onChange={e => {
                                        const newScheds = [...stage.schedules];
                                        newScheds[si] = { ...sched, durationSeconds: parseInt(e.target.value) || 30 };
                                        updateCustomStage(idx, { ...stage, schedules: newScheds });
                                      }}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 block mb-1">Every (s)</label>
                                    <input type="number" min={60} value={sched.frequencySeconds}
                                      onChange={e => {
                                        const newScheds = [...stage.schedules];
                                        newScheds[si] = { ...sched, frequencySeconds: parseInt(e.target.value) || 7200 };
                                        updateCustomStage(idx, { ...stage, schedules: newScheds });
                                      }}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                  </div>
                                  <div className="flex items-end">
                                    <span className="text-xs text-gray-400 pb-1.5">{fmtDurLocal(sched.durationSeconds)}/{fmtFreqLocal(sched.frequencySeconds)}</span>
                                  </div>
                                </div>
                              ))}
                              {/* Lighting toggle */}
                              <div className="grid grid-cols-3 gap-2 items-end">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input type="checkbox" checked={stage.lighting.enabled}
                                    onChange={e => updateCustomStage(idx, { ...stage, lighting: { ...stage.lighting, enabled: e.target.checked } })}
                                    className="accent-yellow-500" />
                                  <span className="text-xs font-medium text-gray-600">Light ON</span>
                                </label>
                                {stage.lighting.enabled && (
                                  <>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 block mb-1">On hour</label>
                                      <input type="number" min={0} max={23} value={stage.lighting.onHour ?? 6}
                                        onChange={e => updateCustomStage(idx, { ...stage, lighting: { ...stage.lighting, onHour: parseInt(e.target.value) } })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 block mb-1">Off hour</label>
                                      <input type="number" min={0} max={23} value={stage.lighting.offHour ?? 20}
                                        onChange={e => updateCustomStage(idx, { ...stage, lighting: { ...stage.lighting, offHour: parseInt(e.target.value) } })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                    </div>
                                  </>
                                )}
                              </div>
                              {/* Temp/Humidity */}
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Temp Min°F</label>
                                  <input type="number" value={stage.environment.tempMinF ?? ''}
                                    onChange={e => updateCustomStage(idx, { ...stage, environment: { ...stage.environment, tempMinF: parseFloat(e.target.value) || undefined } })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Temp Max°F</label>
                                  <input type="number" value={stage.environment.tempMaxF ?? ''}
                                    onChange={e => updateCustomStage(idx, { ...stage, environment: { ...stage.environment, tempMaxF: parseFloat(e.target.value) || undefined } })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Hum Min%</label>
                                  <input type="number" value={stage.environment.humidityMin ?? ''}
                                    onChange={e => updateCustomStage(idx, { ...stage, environment: { ...stage.environment, humidityMin: parseFloat(e.target.value) || undefined } })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 block mb-1">Hum Max%</label>
                                  <input type="number" value={stage.environment.humidityMax ?? ''}
                                    onChange={e => updateCustomStage(idx, { ...stage, environment: { ...stage.environment, humidityMax: parseFloat(e.target.value) || undefined } })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {customStages.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Total: <strong>{customStages.reduce((m, s) => Math.max(m, s.dayEnd), 0)} days</strong>
                      </p>
                    )}
                  </div>

                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
                </div>
              )}
            </div>

            {/* Footer for custom tab */}
            {tab === 'custom' && (
              <div className="px-6 pb-6 shrink-0">
                <button
                  onClick={() => { setError(''); setStep('bind'); }}
                  disabled={!customName.trim() || customStages.length === 0}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  Next: Bind Pins →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── PIN BINDING STEP (shared) ── */}
        {step === 'bind' && programForBind && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Program summary */}
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center text-xl shrink-0">
                {customImageUrl ? <img src={customImageUrl} alt="" className="w-10 h-10 rounded-xl object-cover" /> : customEmoji}
              </div>
              <div>
                <h3 className="font-semibold text-green-800">{programForBind.name}</h3>
                <p className="text-sm text-green-700">{programForBind.totalDays} days • {programForBind.stages.length} stages</p>
              </div>
            </div>

            {/* Pin binding */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Assign Hardware Pins</h4>
              <p className="text-xs text-gray-500 mb-4">
                Map each actuator type to a GPIO pin on your device.
              </p>
              <div className="space-y-3">
                {getRequiredSubtypes(programForBind).map((subtype) => (
                  <div key={subtype} className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700 w-24 capitalize">{subtype}</label>
                    <select
                      value={pinBindings[subtype] || ''}
                      onChange={e => setPinBindings({ ...pinBindings, [subtype]: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">— Select Pin —</option>
                      {actuatorPins.map(pin => (
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

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <div className="flex space-x-3">
              <button onClick={() => setStep('select')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm">
                ← Back
              </button>
              <button
                onClick={tab === 'presets' ? handleStart : handleStartCustom}
                disabled={saving || actuatorPins.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {saving ? 'Starting…' : '🌱 Start Grow Cycle'}
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
