import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Automations Section
 *
 * Manage automation rules and schedules for the farm module.
 * Features: Conditional rules (if-then logic), time-based schedules, quick toggles.
 */
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
export default function AutomationsSection({ moduleId }) {
    const [rules, setRules] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('rules');
    const [showAddModal, setShowAddModal] = useState(false);
    // Subscribe to automation rules
    useEffect(() => {
        const rulesRef = collection(db, 'automation_rules');
        const q = query(rulesRef, where('moduleId', '==', moduleId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
            }));
            setSchedules(data);
        });
        return () => unsubscribe();
    }, [moduleId]);
    if (loading) {
        return _jsx(AutomationsSkeleton, {});
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Automations" }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [rules.length + schedules.length, " active automations"] })] }), _jsxs("button", { onClick: () => setShowAddModal(true), className: "btn-primary flex items-center space-x-2", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }), _jsx("span", { children: "Add Automation" })] })] }), _jsxs("div", { className: "flex space-x-1 bg-gray-100 rounded-lg p-1", children: [_jsxs("button", { onClick: () => setActiveTab('rules'), className: `flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'rules'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'}`, children: ["Conditional Rules (", rules.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('schedules'), className: `flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'schedules'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'}`, children: ["Schedules (", schedules.length, ")"] })] }), activeTab === 'rules' ? (_jsx(RulesView, { rules: rules, moduleId: moduleId })) : (_jsx(SchedulesView, { schedules: schedules, moduleId: moduleId })), showAddModal && (_jsx(AddAutomationModal, { moduleId: moduleId, type: activeTab, onClose: () => setShowAddModal(false) }))] }));
}
// ============================================
// RULES VIEW
// ============================================
function RulesView({ rules, moduleId }) {
    const [editingRule, setEditingRule] = useState(null);
    if (rules.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\u26A1" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No Rules Yet" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "Create conditional automation rules like \"If temperature > 85\u00B0F, then turn on fan\"" })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [rules.map(rule => (_jsx(RuleCard, { rule: rule, onEdit: setEditingRule }, rule.id))), editingRule && (_jsx(EditRuleModal, { rule: editingRule, onClose: () => setEditingRule(null) }))] }));
}
function RuleCard({ rule, onEdit }) {
    const [toggling, setToggling] = useState(false);
    const handleToggle = async () => {
        setToggling(true);
        try {
            await updateDoc(doc(db, 'automation_rules', rule.id), {
                enabled: !rule.enabled,
                updatedAt: Timestamp.now(),
            });
        }
        catch (err) {
            console.error('Failed to toggle rule:', err);
        }
        finally {
            setToggling(false);
        }
    };
    const getOperatorSymbol = () => {
        const symbols = {
            'gt': '>',
            'lt': '<',
            'eq': '=',
            'gte': '≥',
            'lte': '≤',
        };
        return symbols[rule.condition.operator] || rule.condition.operator;
    };
    return (_jsxs("div", { className: `bg-white rounded-xl border-2 transition-all ${rule.enabled ? 'border-primary-200' : 'border-gray-200'} p-6`, children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h4", { className: "text-lg font-semibold text-gray-900", children: rule.name }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`, children: rule.enabled ? 'Active' : 'Paused' })] }), rule.description && (_jsx("p", { className: "text-sm text-gray-600", children: rule.description }))] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => onEdit(rule), className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) }) }), _jsx("button", { onClick: handleToggle, disabled: toggling, className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.enabled ? 'bg-primary-600' : 'bg-gray-300'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-1'}` }) })] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx("span", { className: "font-medium text-gray-700", children: "IF" }), _jsx("span", { className: "px-3 py-1 bg-white border border-gray-300 rounded-md font-mono", children: rule.condition.sensorId }), _jsx("span", { className: "font-bold text-gray-900", children: getOperatorSymbol() }), _jsx("span", { className: "px-3 py-1 bg-white border border-gray-300 rounded-md font-mono", children: rule.condition.value })] }), _jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx("span", { className: "font-medium text-gray-700", children: "THEN" }), _jsx("span", { className: "px-3 py-1 bg-white border border-gray-300 rounded-md font-mono", children: rule.action.actuatorId }), _jsx("span", { className: "font-bold text-gray-900", children: "\u2192" }), _jsxs("span", { className: "px-3 py-1 bg-primary-100 text-primary-700 rounded-md font-medium capitalize", children: [rule.action.command, rule.action.duration && ` for ${rule.action.duration}s`] })] })] }), rule.cooldownSeconds && (_jsxs("div", { className: "mt-3 text-xs text-gray-500", children: ["Cooldown: ", rule.cooldownSeconds, "s between triggers"] }))] }));
}
// ============================================
// SCHEDULES VIEW
// ============================================
function SchedulesView({ schedules, moduleId }) {
    const [editingSchedule, setEditingSchedule] = useState(null);
    if (schedules.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\u23F0" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No Schedules Yet" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "Create time-based schedules like \"Run pump at 6:00 AM daily\" or \"Lights on every 4 hours\"" })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [schedules.map(schedule => (_jsx(ScheduleCard, { schedule: schedule, onEdit: setEditingSchedule }, schedule.id))), editingSchedule && (_jsx(EditScheduleModal, { schedule: editingSchedule, onClose: () => setEditingSchedule(null) }))] }));
}
function ScheduleCard({ schedule, onEdit }) {
    const [toggling, setToggling] = useState(false);
    const handleToggle = async () => {
        setToggling(true);
        try {
            await updateDoc(doc(db, 'schedules', schedule.id), {
                enabled: !schedule.enabled,
                updatedAt: Timestamp.now(),
            });
        }
        catch (err) {
            console.error('Failed to toggle schedule:', err);
        }
        finally {
            setToggling(false);
        }
    };
    const getScheduleDescription = () => {
        if (schedule.type === 'time') {
            const days = schedule.daysOfWeek?.join(', ') || 'Daily';
            return `At ${schedule.time} on ${days}`;
        }
        else {
            return `Every ${schedule.intervalMinutes} minutes`;
        }
    };
    return (_jsx("div", { className: `bg-white rounded-xl border-2 transition-all ${schedule.enabled ? 'border-primary-200' : 'border-gray-200'} p-6`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h4", { className: "text-lg font-semibold text-gray-900", children: schedule.name }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${schedule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`, children: schedule.enabled ? 'Active' : 'Paused' })] }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: getScheduleDescription() }), _jsxs("div", { className: "flex items-center space-x-4 text-sm", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-gray-500", children: "Device:" }), _jsx("span", { className: "font-mono text-gray-900", children: schedule.actuatorId })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-gray-500", children: "Action:" }), _jsx("span", { className: "font-medium text-primary-600 capitalize", children: schedule.action })] }), schedule.duration && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-gray-500", children: "Duration:" }), _jsxs("span", { className: "font-medium text-gray-900", children: [schedule.duration, "s"] })] }))] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => onEdit(schedule), className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) }) }), _jsx("button", { onClick: handleToggle, disabled: toggling, className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedule.enabled ? 'bg-primary-600' : 'bg-gray-300'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule.enabled ? 'translate-x-6' : 'translate-x-1'}` }) })] })] }) }));
}
// ============================================
// MODALS (PLACEHOLDERS FOR NOW)
// ============================================
function AddAutomationModal({ moduleId, type, onClose }) {
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6", children: [_jsxs("h2", { className: "text-xl font-bold mb-4", children: ["Add ", type === 'rules' ? 'Rule' : 'Schedule'] }), _jsxs("p", { className: "text-gray-600 mb-6", children: ["This feature will allow you to create ", type === 'rules' ? 'conditional automation rules' : 'time-based schedules', "."] }), _jsx("button", { onClick: onClose, className: "btn-secondary w-full", children: "Close" })] }) }));
}
function EditRuleModal({ rule, onClose }) {
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6", children: [_jsxs("h2", { className: "text-xl font-bold mb-4", children: ["Edit Rule: ", rule.name] }), _jsx("p", { className: "text-gray-600 mb-6", children: "Edit functionality coming soon..." }), _jsx("button", { onClick: onClose, className: "btn-secondary w-full", children: "Close" })] }) }));
}
function EditScheduleModal({ schedule, onClose }) {
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6", children: [_jsxs("h2", { className: "text-xl font-bold mb-4", children: ["Edit Schedule: ", schedule.name] }), _jsx("p", { className: "text-gray-600 mb-6", children: "Edit functionality coming soon..." }), _jsx("button", { onClick: onClose, className: "btn-secondary w-full", children: "Close" })] }) }));
}
function AutomationsSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "w-48 h-8 bg-gray-200 rounded animate-pulse" }), _jsx("div", { className: "w-40 h-10 bg-gray-200 rounded animate-pulse" })] }), _jsx("div", { className: "w-full h-10 bg-gray-200 rounded animate-pulse" }), [1, 2, 3].map(i => (_jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: _jsx("div", { className: "w-full h-20 bg-gray-200 rounded animate-pulse" }) }, i)))] }));
}
