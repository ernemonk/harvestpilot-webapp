/**
 * Harvest Cycle Section
 * 
 * Track and manage harvest cycles from seeding to harvest.
 * Features: Stage progression, timeline, checklist, yield logging.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { HarvestCycle, HarvestStage } from '../../types/farmModule';

interface HarvestCycleSectionProps {
  moduleId: string;
}

export default function HarvestCycleSection({ moduleId }: HarvestCycleSectionProps) {
  const [cycles, setCycles] = useState<HarvestCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Subscribe to harvest cycles
  useEffect(() => {
    const cyclesRef = collection(db, 'harvest_cycles');
    const q = query(
      cyclesRef,
      where('moduleId', '==', moduleId),
      orderBy('startDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HarvestCycle));
      setCycles(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [moduleId]);

  const activeCycle = cycles.find(c => c.status === 'active');
  const completedCycles = cycles.filter(c => c.status === 'completed');

  if (loading) {
    return <HarvestSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Harvest Cycles</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeCycle ? 'Active cycle in progress' : 'No active cycle'}
          </p>
        </div>
        {!activeCycle && (
          <button
            onClick={() => setShowNewCycle(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Start New Cycle</span>
          </button>
        )}
      </div>

      {/* Active Cycle */}
      {activeCycle ? (
        <ActiveCycleCard
          cycle={activeCycle}
          onComplete={() => setShowCompleteModal(true)}
        />
      ) : (
        <EmptyState onStart={() => setShowNewCycle(true)} />
      )}

      {/* Timeline */}
      {activeCycle && <CycleTimeline cycle={activeCycle} />}

      {/* Checklist */}
      {activeCycle && <StageChecklist cycle={activeCycle} />}

      {/* History */}
      {completedCycles.length > 0 && (
        <CycleHistory cycles={completedCycles} />
      )}

      {/* Modals */}
      {showNewCycle && (
        <NewCycleModal moduleId={moduleId} onClose={() => setShowNewCycle(false)} />
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

// ============================================
// SUB-COMPONENTS
// ============================================

function ActiveCycleCard({ cycle, onComplete }: { cycle: HarvestCycle; onComplete: () => void }) {
  const progress = getStageProgress(cycle.currentStage);
  const daysElapsed = Math.floor((Date.now() - (cycle.startDate as any).seconds * 1000) / (1000 * 60 * 60 * 24));
  const expectedDays = cycle.expectedDays || 0;
  const daysRemaining = Math.max(0, expectedDays - daysElapsed);

  return (
    <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl border-2 border-primary-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{cycle.cropType}</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          <p className="text-gray-600">
            Day {daysElapsed} of {expectedDays} • {daysRemaining} days remaining
          </p>
        </div>
        <button onClick={onComplete} className="btn-primary">
          Complete Harvest
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-primary-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Stage */}
      <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
        <div className="text-3xl">{getStageIcon(cycle.currentStage)}</div>
        <div>
          <p className="text-sm text-gray-500">Current Stage</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">
            {cycle.currentStage.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  );
}

function CycleTimeline({ cycle }: { cycle: HarvestCycle }) {
  const stages: HarvestStage[] = ['seeding', 'germination', 'blackout', 'light_exposure', 'growth', 'harvest'];
  const currentIndex = stages.indexOf(cycle.currentStage);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Growth Timeline</h3>
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Stages */}
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={stage} className="relative flex items-start">
                {/* Circle Indicator */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                    isCompleted
                      ? 'bg-green-500 border-green-200'
                      : isCurrent
                      ? 'bg-primary-500 border-primary-200 ring-4 ring-primary-100'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xl">{getStageIcon(stage)}</span>
                  )}
                </div>

                {/* Content */}
                <div className="ml-6 flex-1">
                  <h4 className={`text-base font-semibold capitalize ${
                    isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {stage.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {getStageDescription(stage)}
                  </p>
                  {isCurrent && (
                    <div className="mt-2 flex items-center space-x-2 text-xs text-primary-600">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                      <span className="font-medium">In Progress</span>
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

function StageChecklist({ cycle }: { cycle: HarvestCycle }) {
  const tasks = getStageChecklist(cycle.currentStage);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Checklist</h3>
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <TaskItem key={i} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: { label: string; completed: boolean } }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div
        className={`flex items-center justify-center w-5 h-5 rounded border-2 ${
          task.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300'
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${task.completed ? 'text-gray-600 line-through' : 'text-gray-900 font-medium'}`}>
        {task.label}
      </span>
    </div>
  );
}

function CycleHistory({ cycles }: { cycles: HarvestCycle[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Harvests</h3>
      <div className="space-y-3">
        {cycles.slice(0, 5).map(cycle => (
          <div key={cycle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{cycle.cropType}</h4>
              <p className="text-sm text-gray-500">
                {formatDate(cycle.startDate)} - {formatDate(cycle.harvestDate!)}
              </p>
            </div>
            {cycle.yieldWeight && (
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{cycle.yieldWeight} oz</p>
                <p className="text-xs text-gray-500">Yield</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="text-6xl mb-4">🌱</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Harvest Cycle</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Start a new harvest cycle to track growth from seeding to harvest.
      </p>
      <button onClick={onStart} className="btn-primary">
        Start Your First Cycle
      </button>
    </div>
  );
}

function NewCycleModal({ moduleId, onClose }: { moduleId: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    cropType: 'Arugula',
    expectedDays: 7,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await addDoc(collection(db, 'harvest_cycles'), {
        moduleId,
        cropType: formData.cropType,
        startDate: Timestamp.now(),
        expectedDays: formData.expectedDays,
        currentStage: 'seeding',
        status: 'active',
        notes: formData.notes,
        createdAt: Timestamp.now(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to create cycle:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Start New Harvest Cycle</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label">Crop Type</label>
            <select
              value={formData.cropType}
              onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
              className="input"
            >
              <option>Arugula</option>
              <option>Basil</option>
              <option>Kale</option>
              <option>Lettuce</option>
              <option>Mustard Greens</option>
              <option>Radish</option>
              <option>Sunflower</option>
            </select>
          </div>
          <div>
            <label className="label">Expected Days to Harvest</label>
            <input
              type="number"
              value={formData.expectedDays}
              onChange={(e) => setFormData({ ...formData, expectedDays: parseInt(e.target.value) })}
              className="input"
              min="1"
              max="30"
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Add any notes about this cycle..."
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Starting...' : 'Start Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompleteCycleModal({ cycle, onClose }: { cycle: HarvestCycle; onClose: () => void }) {
  const [formData, setFormData] = useState({
    yieldWeight: '',
    quality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, 'harvest_cycles', cycle.id!), {
        status: 'completed',
        harvestDate: Timestamp.now(),
        yieldWeight: parseFloat(formData.yieldWeight) || undefined,
        quality: formData.quality,
        notes: cycle.notes ? `${cycle.notes}\n\nHarvest: ${formData.notes}` : formData.notes,
        updatedAt: Timestamp.now(),
      });
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
          <h2 className="text-xl font-bold text-gray-900">Complete Harvest</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label">Yield Weight (oz)</label>
            <input
              type="number"
              step="0.1"
              value={formData.yieldWeight}
              onChange={(e) => setFormData({ ...formData, yieldWeight: e.target.value })}
              className="input"
              placeholder="e.g., 12.5"
            />
          </div>
          <div>
            <label className="label">Quality Rating</label>
            <select
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value as any })}
              className="input"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="label">Harvest Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Notes about yield quality, issues, etc."
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Completing...' : 'Complete Harvest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HarvestSkeleton() {
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

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStageIcon(stage: HarvestStage): string {
  const icons: Record<HarvestStage, string> = {
    seeding: '🌾',
    germination: '🌱',
    blackout: '🌑',
    light_exposure: '💡',
    growth: '🌿',
    harvest: '✂️',
  };
  return icons[stage] || '🌱';
}

function getStageProgress(stage: HarvestStage): number {
  const progress: Record<HarvestStage, number> = {
    seeding: 10,
    germination: 25,
    blackout: 40,
    light_exposure: 60,
    growth: 80,
    harvest: 100,
  };
  return progress[stage] || 0;
}

function getStageDescription(stage: HarvestStage): string {
  const descriptions: Record<HarvestStage, string> = {
    seeding: 'Plant seeds in growing medium',
    germination: 'Seeds are sprouting, keep moist',
    blackout: 'Cover trays, maintain high humidity',
    light_exposure: 'Remove covers, introduce light',
    growth: 'Maintain optimal conditions for growth',
    harvest: 'Ready to harvest and package',
  };
  return descriptions[stage] || '';
}

function getStageChecklist(stage: HarvestStage): { label: string; completed: boolean }[] {
  const checklists: Record<HarvestStage, string[]> = {
    seeding: ['Prepare trays', 'Soak seeds', 'Spread seeds evenly', 'Cover with medium'],
    germination: ['Water daily', 'Maintain 70-75°F', 'Check for sprouts'],
    blackout: ['Cover trays completely', 'Mist 2x daily', 'Monitor weight'],
    light_exposure: ['Remove covers', 'Position lights 6" above', 'Adjust watering schedule'],
    growth: ['Monitor temperature', 'Maintain humidity 50-60%', 'Check for pests'],
    harvest: ['Check maturity', 'Prepare packaging', 'Clean cutting tools'],
  };

  return (checklists[stage] || []).map(label => ({
    label,
    completed: Math.random() > 0.5, // TODO: Persist completion status
  }));
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
