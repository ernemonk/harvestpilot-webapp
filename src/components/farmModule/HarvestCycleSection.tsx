'use client';

import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, doc, Timestamp, getDocs
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { HarvestCycle, HarvestStage, ModuleDevice } from '../../types/farmModule';

interface HarvestCycleSectionProps {
  moduleId: string;
  openNewCycleModal?: boolean;
  onNewCycleModalClosed?: () => void;
}

const STAGES: HarvestStage[] = ['seeding', 'germination', 'blackout', 'light_exposure', 'growth', 'harvest'];

const STAGE_META: Record<HarvestStage, { label: string; icon: string; description: string; defaultDays: number }> = {
  seeding:        { label: 'Seeding',        icon: '🌾', description: 'Plant seeds in growing medium',   defaultDays: 1 },
  germination:    { label: 'Germination',    icon: '🌱', description: 'Seeds sprouting — keep moist',    defaultDays: 2 },
  blackout:       { label: 'Blackout',       icon: '🌑', description: 'Cover trays, high humidity',      defaultDays: 3 },
  light_exposure: { label: 'Light Exposure', icon: '💡', description: 'Remove covers, introduce light',  defaultDays: 2 },
  growth:         { label: 'Growth',         icon: '🌿', description: 'Maintain optimal conditions',     defaultDays: 4 },
  harvest:        { label: 'Harvest',        icon: '✂️', description: 'Ready to cut and package',        defaultDays: 1 },
  completed:      { label: 'Completed',      icon: '✅', description: 'Cycle complete',                  defaultDays: 0 },
};

const MICROGREENS_PRESETS = [
  { name: 'Arugula' }, { name: 'Basil' }, { name: 'Broccoli' },
  { name: 'Kale' }, { name: 'Mustard Greens' }, { name: 'Pea Shoots' },
  { name: 'Radish' }, { name: 'Sunflower' }, { name: 'Wheatgrass' },
];

export default function HarvestCycleSection({
  moduleId,
  openNewCycleModal = false,
  onNewCycleModalClosed,
}: HarvestCycleSectionProps) {
  const [cycles, setCycles] = useState<HarvestCycle[]>([]);
  const [devices, setDevices] = useState<ModuleDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [completingCycle, setCompletingCycle] = useState<HarvestCycle | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  useEffect(() => {
    if (openNewCycleModal) setShowNewCycle(true);
  }, [openNewCycleModal]);

  useEffect(() => {
    const q = query(
      collection(db, 'harvest_cycles'),
      where('moduleId', '==', moduleId),
      orderBy('startDate', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setCycles(snap.docs.map(d => ({ id: d.id, ...d.data() } as HarvestCycle)));
      setLoading(false);
    }, () => setLoading(false));
  }, [moduleId]);

  useEffect(() => {
    getDocs(query(collection(db, 'devices'), where('moduleId', '==', moduleId)))
      .then(snap => setDevices(snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleDevice))))
      .catch(() => {});
  }, [moduleId]);

  async function advanceStage(cycle: HarvestCycle) {
    const i = STAGES.indexOf(cycle.currentStage);
    if (i < 0 || i >= STAGES.length - 1) return;
    const nextStage = STAGES[i + 1];
    await updateDoc(doc(db, 'harvest_cycles', cycle.id!), {
      currentStage: nextStage,
      updatedAt: Timestamp.now(),
      [`stageStartTimes.${nextStage}`]: Timestamp.now(),
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Harvest Cycles</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCycles.length > 0
              ? `${activeCycles.length} active cycle${activeCycles.length > 1 ? 's' : ''}`
              : 'No active cycles'}
          </p>
        </div>
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

      {activeCycles.length === 0 ? (
        <EmptyState onStart={() => setShowNewCycle(true)} />
      ) : (
        <div className="space-y-4">
          {activeCycles.map(cycle => (
            <ActiveCycleCard
              key={cycle.id}
              cycle={cycle}
              expanded={expandedCycleId === cycle.id}
              onToggle={() => setExpandedCycleId(expandedCycleId === cycle.id ? null : cycle.id!)}
              onAdvance={() => advanceStage(cycle)}
              onComplete={() => setCompletingCycle(cycle)}
            />
          ))}
        </div>
      )}

      {completedCycles.length > 0 && <CycleHistory cycles={completedCycles} />}

      {showNewCycle && (
        <NewCycleModal moduleId={moduleId} devices={devices} onClose={handleCloseNew} />
      )}
      {completingCycle && (
        <CompleteCycleModal cycle={completingCycle} onClose={() => setCompletingCycle(null)} />
      )}
    </div>
  );
}

// ─── Active Cycle Card ────────────────────────────────────────────────────────

function ActiveCycleCard({
  cycle, expanded, onToggle, onAdvance, onComplete,
}: {
  cycle: HarvestCycle;
  expanded: boolean;
  onToggle: () => void;
  onAdvance: () => void;
  onComplete: () => void;
}) {
  const currentIndex = STAGES.indexOf(cycle.currentStage);
  const progress = Math.round((currentIndex / (STAGES.length - 1)) * 100);
  const daysElapsed = cycle.startDate
    ? Math.floor((Date.now() - (cycle.startDate as any).seconds * 1000) / 86400000)
    : 0;
  const daysRemaining = Math.max(0, (cycle.expectedDays || 10) - daysElapsed);
  const meta = STAGE_META[cycle.currentStage] || STAGE_META.seeding;
  const isLastStage = currentIndex >= STAGES.length - 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-700"
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {meta.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-base truncate">
                {cycle.cropType}{cycle.variety ? ` · ${cycle.variety}` : ''}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Day {daysElapsed} of {cycle.expectedDays || '?'}
                {daysRemaining > 0 && (
                  <span className="ml-1.5 text-primary-600 font-medium">{daysRemaining}d left</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Active
            </span>
            <button
              onClick={onComplete}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Complete ✂️
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700">{meta.label}</span>
            <span className="text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-green-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
        </div>

        {/* Stage pills */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {STAGES.slice(0, -1).map((stage, i) => {
            const done = i < currentIndex;
            const curr = i === currentIndex;
            return (
              <div key={stage} className="flex items-center gap-0.5 flex-shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  curr ? 'bg-primary-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span>{STAGE_META[stage].icon}</span>
                  <span className="hidden sm:inline">{STAGE_META[stage].label}</span>
                </div>
                {i < STAGES.length - 2 && (
                  <svg className={`w-3 h-3 flex-shrink-0 ${done ? 'text-green-400' : 'text-gray-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          {!isLastStage ? (
            <button onClick={onAdvance} className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Advance to {STAGE_META[STAGES[currentIndex + 1]]?.label}
            </button>
          ) : (
            <span className="text-sm text-gray-400">Ready to complete harvest</span>
          )}
          <button onClick={onToggle} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
            {expanded ? 'Less' : 'Details'}
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {expanded && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stage Timeline</p>
            {STAGES.slice(0, -1).map((stage, i) => {
              const done = i < currentIndex;
              const curr = i === currentIndex;
              const sm = STAGE_META[stage];
              return (
                <div key={stage} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                    done ? 'bg-green-500 border-green-400' : curr ? 'bg-primary-600 border-primary-400 ring-4 ring-primary-50' : 'bg-white border-gray-200'
                  }`}>
                    {done ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={curr ? 'text-white text-xs' : 'text-xs text-gray-300'}>{i + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${curr ? 'text-primary-700' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {sm.icon} {sm.label}
                      </p>
                      {curr && (
                        <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-md font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{sm.description}</p>
                  </div>
                </div>
              );
            })}
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

function CycleHistory({ cycles }: { cycles: HarvestCycle[] }) {
  const [show, setShow] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-gray-900 text-sm">
          Previous Harvests ({cycles.length})
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${show ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {show && (
        <div className="divide-y divide-gray-100">
          {cycles.slice(0, 8).map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {c.cropType}{c.variety ? ` · ${c.variety}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(c.startDate)} → {formatDate((c as any).harvestDate || c.actualHarvestDate)}
                </p>
              </div>
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
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
        🌱
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">No Active Harvest Cycles</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
        Track seeding → germination → blackout → light → growth → harvest with device automation.
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

// ─── New Cycle Modal ──────────────────────────────────────────────────────────

interface StageConfig {
  stage: HarvestStage;
  days: number;
  activateDeviceIds: string[];
  deactivateDeviceIds: string[];
}

function NewCycleModal({
  moduleId, devices, onClose,
}: {
  moduleId: string;
  devices: ModuleDevice[];
  onClose: () => void;
}) {
  const [step, setStep] = useState<'crop' | 'stages'>('crop');
  const [cropType, setCropType] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [variety, setVariety] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stageConfigs, setStageConfigs] = useState<StageConfig[]>(
    STAGES.slice(0, -1).map(stage => ({
      stage,
      days: STAGE_META[stage].defaultDays,
      activateDeviceIds: [],
      deactivateDeviceIds: [],
    }))
  );

  const actuators = devices.filter(d => d.type === 'actuator');
  const finalCrop = cropType === '__custom__' ? customCrop.trim() : cropType;
  const totalDays = stageConfigs.reduce((s, c) => s + c.days, 0);

  function updateStage(i: number, ch: Partial<StageConfig>) {
    setStageConfigs(prev => prev.map((s, idx) => idx === i ? { ...s, ...ch } : s));
  }

  function toggleDevice(si: number, deviceId: string, type: 'activate' | 'deactivate') {
    const cfg = stageConfigs[si];
    const key = type === 'activate' ? 'activateDeviceIds' as const : 'deactivateDeviceIds' as const;
    const opp = type === 'activate' ? 'deactivateDeviceIds' as const : 'activateDeviceIds' as const;
    const cur = cfg[key];
    const has = cur.includes(deviceId);
    updateStage(si, {
      [key]: has ? cur.filter(id => id !== deviceId) : [...cur, deviceId],
      [opp]: has ? cfg[opp] : cfg[opp].filter(id => id !== deviceId),
    });
  }

  async function handleSubmit() {
    if (!finalCrop) { setError('Select or enter a crop.'); return; }
    setSaving(true); setError('');
    try {
      await addDoc(collection(db, 'harvest_cycles'), {
        moduleId,
        cropType: finalCrop,
        variety: variety.trim() || null,
        startDate: Timestamp.now(),
        expectedDays: totalDays,
        currentStage: 'seeding',
        status: 'active',
        notes: notes.trim() || null,
        stageHistory: [{ stage: 'seeding', startedAt: Timestamp.now() }],
        stageConfigs: stageConfigs.map(s => ({
          stage: s.stage, days: s.days,
          activateDeviceIds: s.activateDeviceIds,
          deactivateDeviceIds: s.deactivateDeviceIds,
        })),
        stageStartTimes: { seeding: Timestamp.now() },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start cycle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Start Harvest Cycle</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 'crop' ? 'Choose your crop' : `Configure ${stageConfigs.length} stages · ${totalDays} days total`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex px-6 pt-4 gap-2 flex-shrink-0">
          {(['crop', 'stages'] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => s === 'crop' && setStep('crop')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                step === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                step === s ? 'bg-white/30' : 'bg-gray-300 text-white'
              }`}>{i + 1}</span>
              {s === 'crop' ? 'Crop' : 'Stages'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {step === 'crop' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Crop Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {MICROGREENS_PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => setCropType(p.name)}
                      className={`py-2.5 px-2 rounded-xl text-sm font-medium border-2 transition text-center ${
                        cropType === p.name
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setCropType('__custom__')}
                    className={`py-2.5 px-2 rounded-xl text-sm font-medium border-2 transition ${
                      cropType === '__custom__'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-dashed border-gray-300 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    + Custom
                  </button>
                </div>
              </div>

              {cropType === '__custom__' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Crop Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={customCrop}
                    onChange={e => setCustomCrop(e.target.value)}
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
                  type="text"
                  value={variety}
                  onChange={e => setVariety(e.target.value)}
                  placeholder="e.g. Red Acre, Rambo..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Notes <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Tray density, seed source, environment notes..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </>
          )}

          {step === 'stages' && (
            <div className="space-y-3">
              {stageConfigs.map((cfg, i) => {
                const meta = STAGE_META[cfg.stage];
                return (
                  <div key={cfg.stage} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                      <span className="text-xl">{meta.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{meta.label}</p>
                        <p className="text-xs text-gray-400">{meta.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStage(i, { days: Math.max(1, cfg.days - 1) })}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold"
                        >−</button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900">{cfg.days}</span>
                        <button
                          onClick={() => updateStage(i, { days: Math.min(14, cfg.days + 1) })}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold"
                        >+</button>
                        <span className="text-xs text-gray-400 w-5">d</span>
                      </div>
                    </div>
                    {actuators.length > 0 && (
                      <div className="px-4 py-3 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Devices during this stage
                        </p>
                        {actuators.map(device => {
                          const isOn = cfg.activateDeviceIds.includes(device.id);
                          const isOff = cfg.deactivateDeviceIds.includes(device.id);
                          return (
                            <div key={device.id} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">
                                {device.name}
                                {device.gpioPin != null && (
                                  <span className="ml-1 text-xs text-gray-400">Pin {device.gpioPin}</span>
                                )}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => toggleDevice(i, device.id, 'activate')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                    isOn ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'
                                  }`}
                                >ON</button>
                                <button
                                  onClick={() => toggleDevice(i, device.id, 'deactivate')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                    isOff ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                  }`}
                                >OFF</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-800">Total grow time</span>
                <span className="text-lg font-bold text-primary-700">{totalDays} days</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
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
                {saving ? 'Starting...' : '🌱 Start Cycle'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Complete Cycle Modal ─────────────────────────────────────────────────────

function CompleteCycleModal({ cycle, onClose }: { cycle: HarvestCycle; onClose: () => void }) {
  const [yieldWeight, setYieldWeight] = useState('');
  const [yieldUnit, setYieldUnit] = useState<'oz' | 'lbs' | 'g' | 'kg'>('oz');
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'harvest_cycles', cycle.id!), {
        status: 'completed',
        harvestDate: Timestamp.now(),
        actualHarvestDate: Timestamp.now(),
        yieldWeight: parseFloat(yieldWeight) || null,
        yieldUnit,
        quality,
        notes: notes.trim() || (cycle as any).notes || null,
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
                type="number" step="0.1"
                value={yieldWeight}
                onChange={e => setYieldWeight(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                value={yieldUnit}
                onChange={e => setYieldUnit(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="oz">oz</option>
                <option value="lbs">lbs</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quality</label>
            <div className="grid grid-cols-4 gap-2">
              {(['excellent', 'good', 'fair', 'poor'] as const).map(q => (
                <button
                  key={q} type="button"
                  onClick={() => setQuality(q)}
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
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Quality observations, next cycle notes..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-700 disabled:opacity-60 transition">
              {saving ? 'Saving...' : '✅ Complete'}
            </button>
          </div>
        </form>
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
