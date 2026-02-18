/**
 * CycleDetail — full grow cycle view with inline stage editing.
 *
 * Every stage has an ✏️ Edit button that opens a detailed modal where you
 * can change pump schedules, lighting windows, environment targets, and
 * checklist items.  If the stage is currently active the changes are
 * immediately re-deployed to the hardware device.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { GrowCycle, GrowStage, GrowStageType, StageScheduleConfig } from '../types/farmModule';
import { growCycleService } from '../services/growCycleService';

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

function fmtFreq(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

function fmtDur(seconds: number): string {
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

// ─────────────────────────────────────────────────────────────
// Stage Edit Modal
// ─────────────────────────────────────────────────────────────

interface StageEditorProps {
  stage: GrowStage;
  isCurrent: boolean;
  onSave: (updated: GrowStage) => Promise<void>;
  onClose: () => void;
}

function StageEditorModal({ stage, isCurrent, onSave, onClose }: StageEditorProps) {
  const [name, setName] = useState(stage.name);
  const [dayStart, setDayStart] = useState(stage.dayStart.toString());
  const [dayEnd, setDayEnd] = useState(stage.dayEnd.toString());
  const [schedules, setSchedules] = useState<StageScheduleConfig[]>(stage.schedules.map(s => ({ ...s })));
  const [lightEnabled, setLightEnabled] = useState(stage.lighting.enabled);
  const [lightOn, setLightOn] = useState(stage.lighting.onHour?.toString() ?? '6');
  const [lightOff, setLightOff] = useState(stage.lighting.offHour?.toString() ?? '20');
  const [tempMin, setTempMin] = useState(stage.environment.tempMinF?.toString() ?? '65');
  const [tempMax, setTempMax] = useState(stage.environment.tempMaxF?.toString() ?? '75');
  const [humMin, setHumMin] = useState(stage.environment.humidityMin?.toString() ?? '50');
  const [humMax, setHumMax] = useState(stage.environment.humidityMax?.toString() ?? '70');
  const [coverTrays, setCoverTrays] = useState(stage.environment.coverTrays ?? false);
  const [checklist, setChecklist] = useState<string[]>([...stage.checklist]);
  const [newTask, setNewTask] = useState('');
  const [notes, setNotes] = useState(stage.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateSchedule(idx: number, field: keyof StageScheduleConfig, value: string | number) {
    setSchedules(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated: GrowStage = {
        ...stage,
        name,
        dayStart: parseInt(dayStart) || stage.dayStart,
        dayEnd: parseInt(dayEnd) || stage.dayEnd,
        schedules,
        lighting: {
          enabled: lightEnabled,
          onHour: lightEnabled ? parseInt(lightOn) : undefined,
          offHour: lightEnabled ? parseInt(lightOff) : undefined,
        },
        environment: {
          tempMinF: parseFloat(tempMin) || undefined,
          tempMaxF: parseFloat(tempMax) || undefined,
          humidityMin: parseFloat(humMin) || undefined,
          humidityMax: parseFloat(humMax) || undefined,
          coverTrays,
        },
        checklist,
        notes: notes || undefined,
      };
      await onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save stage');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{STAGE_ICONS[stage.type]}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Stage</h2>
              {isCurrent && (
                <span className="text-xs text-blue-600 font-medium">
                  ⚡ Currently active — changes deploy to device on save
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Basic info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stage Info</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <label className="text-xs font-medium text-gray-600 block mb-1">Stage Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Day Start</label>
                <input type="number" min={1} value={dayStart} onChange={e => setDayStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Day End</label>
                <input type="number" min={1} value={dayEnd} onChange={e => setDayEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </section>

          {/* Schedules */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">💧 Pump / Actuator Schedules</h3>
              <button onClick={() => setSchedules(prev => [...prev,
                { targetSubtype: 'pump', durationSeconds: 30, frequencySeconds: 7200, startTime: '06:00', endTime: '22:00' }])}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {schedules.map((sched, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Schedule #{idx + 1}</span>
                    {schedules.length > 1 && (
                      <button onClick={() => setSchedules(prev => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Actuator type</label>
                      <select value={sched.targetSubtype}
                        onChange={e => updateSchedule(idx, 'targetSubtype', e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400">
                        <option value="pump">pump</option>
                        <option value="mist">mist</option>
                        <option value="fan">fan</option>
                        <option value="valve">valve</option>
                        <option value="light">light</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">ON duration (s)</label>
                      <input type="number" min={1} value={sched.durationSeconds}
                        onChange={e => updateSchedule(idx, 'durationSeconds', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Interval (s)</label>
                      <input type="number" min={60} value={sched.frequencySeconds}
                        onChange={e => updateSchedule(idx, 'frequencySeconds', parseInt(e.target.value) || 7200)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Window start</label>
                      <input type="time" value={sched.startTime ?? '06:00'}
                        onChange={e => updateSchedule(idx, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Window end</label>
                      <input type="time" value={sched.endTime ?? '22:00'}
                        onChange={e => updateSchedule(idx, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    = {fmtDur(sched.durationSeconds)} ON every {fmtFreq(sched.frequencySeconds)} between {sched.startTime ?? '06:00'} – {sched.endTime ?? '22:00'}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Lighting */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">💡 Lighting</h3>
            <div className="p-4 border border-gray-200 rounded-xl bg-yellow-50 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={lightEnabled} onChange={e => setLightEnabled(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Enable lighting for this stage</span>
              </label>
              {lightEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Lights ON hour (0–23)</label>
                    <input type="number" min={0} max={23} value={lightOn} onChange={e => setLightOn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Lights OFF hour (0–23)</label>
                    <input type="number" min={0} max={23} value={lightOff} onChange={e => setLightOff(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Environment */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🌡️ Environment Targets</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Temp Min (°F)</label>
                <input type="number" value={tempMin} onChange={e => setTempMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Temp Max (°F)</label>
                <input type="number" value={tempMax} onChange={e => setTempMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Humidity Min (%)</label>
                <input type="number" value={humMin} onChange={e => setHumMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Humidity Max (%)</label>
                <input type="number" value={humMax} onChange={e => setHumMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={coverTrays} onChange={e => setCoverTrays(e.target.checked)}
                    className="w-4 h-4 accent-green-500" />
                  <span className="text-sm text-gray-700">Cover trays during this stage</span>
                </label>
              </div>
            </div>
          </section>

          {/* Checklist */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">✅ Checklist</h3>
            <div className="space-y-2">
              {checklist.map((task, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input value={task} onChange={e => setChecklist(prev => prev.map((t, i) => i === idx ? e.target.value : t))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400" />
                  <button onClick={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 text-xl leading-none">×</button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add task…"
                  onKeyDown={e => { if (e.key === 'Enter' && newTask.trim()) { setChecklist(prev => [...prev, newTask.trim()]); setNewTask(''); }}}
                  className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400" />
                <button onClick={() => { if (newTask.trim()) { setChecklist(prev => [...prev, newTask.trim()]); setNewTask(''); }}}
                  className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium">Add</button>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📝 Notes</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 resize-none" />
          </section>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center space-x-3 px-6 py-4 border-t border-gray-200 shrink-0">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50">
            {saving ? 'Saving…' : isCurrent ? '⚡ Save & Deploy' : '✓ Save Stage'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function CycleDetail() {
  const { moduleId, cycleId } = useParams<{ moduleId: string; cycleId: string }>();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<GrowCycle | null>(null);
  const [editingStage, setEditingStage] = useState<GrowStage | null>(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!cycleId) return;
    const unsub = onSnapshot(doc(db, 'grow_cycles', cycleId), (snap) => {
      if (!snap.exists()) { setCycle(null); return; }
      setCycle({ id: snap.id, ...(snap.data() as any) } as GrowCycle);
    });
    return () => unsub();
  }, [cycleId]);

  if (!cycle) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-5xl mb-4 animate-pulse">🌱</div>
        <h2 className="text-xl font-semibold text-gray-900">Cycle not found</h2>
        <p className="text-sm text-gray-500 mt-2">This grow cycle could not be loaded.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm">← Back</button>
      </div>
    );
  }

  const currentDay = computeCurrentDay(cycle);
  const currentStage = getStageForDay(cycle.stages || [], currentDay);
  const progress = Math.min(100, Math.round((currentDay / cycle.totalDays) * 100));

  async function handleSaveStage(updated: GrowStage) {
    if (!cycle) return;
    const newStages = (cycle.stages || []).map(s => s.type === updated.type ? updated : s);
    await growCycleService.updateCycleStages(cycle, newStages);
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {cycle.imageUrl ? (
            <img src={cycle.imageUrl} alt={cycle.programName} className="w-14 h-14 rounded-xl object-cover shadow" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-3xl shadow">
              {cycle.imageEmoji ?? '🌿'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{cycle.programName}</h2>
            <p className="text-sm text-gray-500">
              Day {currentDay} of {cycle.totalDays} —{' '}
              <span className={`font-medium capitalize ${
                cycle.status === 'active' ? 'text-green-600' :
                cycle.status === 'paused' ? 'text-yellow-600' : 'text-gray-500'}`}>
                {cycle.status}
              </span>
            </p>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          ← Back
        </button>
      </div>

      {/* Progress + current stage */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Cycle Progress</span>
          <span className="text-sm font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-green-500"
            style={{ width: `${progress}%` }} />
        </div>
        {currentStage && (
          <div className={`mt-4 flex items-center space-x-3 p-4 rounded-lg border ${STAGE_COLORS[currentStage.type]}`}>
            <span className="text-3xl">{STAGE_ICONS[currentStage.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs opacity-70">Current Stage</p>
              <p className="text-base font-semibold">{currentStage.name}</p>
              <p className="text-xs opacity-70 mt-0.5">
                Days {currentStage.dayStart}–{currentStage.dayEnd}
                {currentStage.schedules.map((s, i) => (
                  <span key={i} className="ml-2">• {s.targetSubtype}: {fmtDur(s.durationSeconds)} ON / {fmtFreq(s.frequencySeconds)} interval</span>
                ))}
                {currentStage.lighting.enabled && (
                  <span className="ml-2">• 💡 {currentStage.lighting.onHour}:00–{currentStage.lighting.offHour}:00</span>
                )}
              </p>
            </div>
            <button onClick={() => setEditingStage(currentStage)}
              className="shrink-0 px-3 py-1.5 bg-white/80 hover:bg-white border border-current/20 rounded-lg text-xs font-medium">
              ✏️ Edit
            </button>
          </div>
        )}
      </div>

      {/* Stage Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Stage Timeline</h3>
          <span className="text-xs text-gray-400">Click ✏️ to edit any stage</span>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 pointer-events-none" />
          <div className="space-y-1">
            {(cycle.stages || []).map(stage => {
              const isCompleted = currentDay > stage.dayEnd;
              const isCurrent = currentDay >= stage.dayStart && currentDay <= stage.dayEnd;
              return (
                <div key={stage.type}
                  className={`relative flex items-start rounded-xl px-1 py-1 transition-colors ${isCurrent ? 'bg-blue-50/60' : ''}`}>
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 flex-shrink-0 mt-1 ${
                    isCompleted ? 'bg-green-500 border-green-200'
                    : isCurrent ? 'bg-blue-500 border-blue-200 ring-4 ring-blue-100'
                    : 'bg-white border-gray-300'}`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xl">{STAGE_ICONS[stage.type]}</span>
                    )}
                  </div>
                  <div className="ml-4 flex-1 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        <h4 className={`text-sm font-semibold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                          {stage.name}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isCurrent ? 'bg-blue-100 text-blue-700'
                          : isCompleted ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'}`}>
                          Day {stage.dayStart}{stage.dayEnd !== stage.dayStart ? `–${stage.dayEnd}` : ''}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center space-x-1 text-xs text-blue-600 font-medium">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse inline-block" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <button onClick={() => setEditingStage(stage)}
                        className="ml-2 shrink-0 px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:text-green-700 transition-colors">
                        ✏️ Edit
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                      {stage.schedules.map((s, i) => (
                        <span key={i}>💧 {s.targetSubtype}: {fmtDur(s.durationSeconds)}/{fmtFreq(s.frequencySeconds)}</span>
                      ))}
                      {stage.lighting.enabled
                        ? <span>💡 {stage.lighting.onHour}:00–{stage.lighting.offHour}:00</span>
                        : <span>🌑 No light</span>}
                      {stage.environment.tempMinF !== undefined && (
                        <span>🌡️ {stage.environment.tempMinF}–{stage.environment.tempMaxF}°F</span>
                      )}
                      {stage.environment.humidityMin !== undefined && (
                        <span>💧 {stage.environment.humidityMin}–{stage.environment.humidityMax}% RH</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>
      )}

      {/* Stage Editor Modal */}
      {editingStage && (
        <StageEditorModal
          stage={editingStage}
          isCurrent={editingStage.type === currentStage?.type}
          onSave={async updated => {
            setSaveError('');
            try { await handleSaveStage(updated); }
            catch (err: any) { setSaveError(err.message || 'Save failed'); throw err; }
          }}
          onClose={() => setEditingStage(null)}
        />
      )}
    </div>
  );
}
