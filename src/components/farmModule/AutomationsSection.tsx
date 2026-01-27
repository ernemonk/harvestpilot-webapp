/**
 * Automations Section
 * 
 * Manage automation rules and schedules for the farm module.
 * Features: Conditional rules (if-then logic), time-based schedules, quick toggles.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { AutomationRule, Schedule } from '../../types/farmModule';

interface AutomationsSectionProps {
  moduleId: string;
}

export default function AutomationsSection({ moduleId }: AutomationsSectionProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'schedules'>('rules');
  const [showAddModal, setShowAddModal] = useState(false);

  // Subscribe to automation rules
  useEffect(() => {
    const rulesRef = collection(db, 'automation_rules');
    const q = query(rulesRef, where('moduleId', '==', moduleId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AutomationRule));
      setRules(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [moduleId]);

  // Subscribe to schedules
  useEffect(() => {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, where('moduleId', '==', moduleId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Schedule));
      setSchedules(data);
    });

    return () => unsubscribe();
  }, [moduleId]);

  if (loading) {
    return <AutomationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automations</h2>
          <p className="text-sm text-gray-500 mt-1">
            {rules.length + schedules.length} active automations
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Automation</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'rules'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Conditional Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'schedules'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Schedules ({schedules.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rules' ? (
        <RulesView rules={rules} />
      ) : (
        <SchedulesView schedules={schedules} />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddAutomationModal
          moduleId={moduleId}
          type={activeTab}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ============================================
// RULES VIEW
// ============================================

function RulesView({ rules }: { rules: AutomationRule[] }) {
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  if (rules.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="text-6xl mb-4">⚡</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rules Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Create conditional automation rules like "If temperature &gt; 85°F, then turn on fan"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map(rule => (
        <RuleCard key={rule.id} rule={rule} onEdit={setEditingRule} />
      ))}
      {editingRule && (
        <EditRuleModal rule={editingRule} onClose={() => setEditingRule(null)} />
      )}
    </div>
  );
}

function RuleCard({ rule, onEdit }: { rule: AutomationRule; onEdit: (rule: AutomationRule) => void }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await updateDoc(doc(db, 'automation_rules', rule.id!), {
        enabled: !rule.enabled,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    } finally {
      setToggling(false);
    }
  };

  const getOperatorSymbol = () => {
    const symbols: Record<string, string> = {
      'gt': '>',
      'lt': '<',
      'eq': '=',
      'gte': '≥',
      'lte': '≤',
    };
    return symbols[rule.condition.operator] || rule.condition.operator;
  };

  return (
    <div className={`bg-white rounded-xl border-2 transition-all ${
      rule.enabled ? 'border-primary-200' : 'border-gray-200'
    } p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">{rule.name}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {rule.enabled ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(rule)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              rule.enabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              rule.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium text-gray-700">IF</span>
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-md font-mono">
            {rule.condition.deviceId}
          </span>
          <span className="font-bold text-gray-900">{getOperatorSymbol()}</span>
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-md font-mono">
            {rule.condition.value}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium text-gray-700">THEN</span>
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-md font-mono">
            {rule.action.targetDeviceId}
          </span>
          <span className="font-bold text-gray-900">→</span>
          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md font-medium capitalize">
            {rule.action.type}
            {rule.action.value && ` for ${rule.action.value}s`}
          </span>
        </div>
      </div>

      {rule.cooldownSeconds && (
        <div className="mt-3 text-xs text-gray-500">
          Cooldown: {rule.cooldownSeconds}s between triggers
        </div>
      )}
    </div>
  );
}

// ============================================
// SCHEDULES VIEW
// ============================================

function SchedulesView({ schedules }: { schedules: Schedule[] }) {
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="text-6xl mb-4">⏰</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schedules Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Create time-based schedules like "Run pump at 6:00 AM daily" or "Lights on every 4 hours"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map(schedule => (
        <ScheduleCard key={schedule.id} schedule={schedule} onEdit={setEditingSchedule} />
      ))}
      {editingSchedule && (
        <EditScheduleModal schedule={editingSchedule} onClose={() => setEditingSchedule(null)} />
      )}
    </div>
  );
}

function ScheduleCard({ schedule, onEdit }: { schedule: Schedule; onEdit: (s: Schedule) => void }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await updateDoc(doc(db, 'schedules', schedule.id!), {
        enabled: !schedule.enabled,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
    } finally {
      setToggling(false);
    }
  };

  const getScheduleDescription = () => {
    if (schedule.scheduleType === 'time_based') {
      const days = schedule.daysOfWeek?.join(', ') || 'Daily';
      return `At ${schedule.startTime} on ${days}`;
    } else {
      return `Every ${schedule.intervalMinutes} minutes`;
    }
  };

  return (
    <div className={`bg-white rounded-xl border-2 transition-all ${
      schedule.enabled ? 'border-primary-200' : 'border-gray-200'
    } p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">{schedule.name}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              schedule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {schedule.enabled ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{getScheduleDescription()}</p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Device:</span>
              <span className="font-mono text-gray-900">{schedule.deviceId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium text-primary-600 capitalize">{schedule.scheduleType}</span>
            </div>
            {schedule.durationSeconds && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium text-gray-900">{schedule.durationSeconds}s</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(schedule)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              schedule.enabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              schedule.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODALS (PLACEHOLDERS FOR NOW)
// ============================================

function AddAutomationModal({ type, onClose }: { type: 'rules' | 'schedules'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold mb-4">Add {type === 'rules' ? 'Rule' : 'Schedule'}</h2>
        <p className="text-gray-600 mb-6">
          This feature will allow you to create {type === 'rules' ? 'conditional automation rules' : 'time-based schedules'}.
        </p>
        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  );
}

function EditRuleModal({ rule, onClose }: { rule: AutomationRule; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold mb-4">Edit Rule: {rule.name}</h2>
        <p className="text-gray-600 mb-6">Edit functionality coming soon...</p>
        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  );
}

function EditScheduleModal({ schedule, onClose }: { schedule: Schedule; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold mb-4">Edit Schedule: {schedule.name}</h2>
        <p className="text-gray-600 mb-6">Edit functionality coming soon...</p>
        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  );
}

function AutomationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-full h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
