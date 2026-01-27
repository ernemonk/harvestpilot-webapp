import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Harvest Cycle Section
 *
 * Track and manage harvest cycles from seeding to harvest.
 * Features: Stage progression, timeline, checklist, yield logging.
 */
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
export default function HarvestCycleSection({ moduleId }) {
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewCycle, setShowNewCycle] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    // Subscribe to harvest cycles
    useEffect(() => {
        const cyclesRef = collection(db, 'harvest_cycles');
        const q = query(cyclesRef, where('moduleId', '==', moduleId), orderBy('startDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCycles(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [moduleId]);
    const activeCycle = cycles.find(c => c.status === 'active');
    const completedCycles = cycles.filter(c => c.status === 'completed');
    if (loading) {
        return _jsx(HarvestSkeleton, {});
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Harvest Cycles" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: activeCycle ? 'Active cycle in progress' : 'No active cycle' })] }), !activeCycle && (_jsxs("button", { onClick: () => setShowNewCycle(true), className: "btn-primary flex items-center space-x-2", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }), _jsx("span", { children: "Start New Cycle" })] }))] }), activeCycle ? (_jsx(ActiveCycleCard, { cycle: activeCycle, onComplete: () => setShowCompleteModal(true) })) : (_jsx(EmptyState, { onStart: () => setShowNewCycle(true) })), activeCycle && _jsx(CycleTimeline, { cycle: activeCycle }), activeCycle && _jsx(StageChecklist, { cycle: activeCycle }), completedCycles.length > 0 && (_jsx(CycleHistory, { cycles: completedCycles })), showNewCycle && (_jsx(NewCycleModal, { moduleId: moduleId, onClose: () => setShowNewCycle(false) })), showCompleteModal && activeCycle && (_jsx(CompleteCycleModal, { cycle: activeCycle, onClose: () => setShowCompleteModal(false) }))] }));
}
// ============================================
// SUB-COMPONENTS
// ============================================
function ActiveCycleCard({ cycle, onComplete }) {
    const progress = getStageProgress(cycle.currentStage);
    const daysElapsed = Math.floor((Date.now() - cycle.startDate.seconds * 1000) / (1000 * 60 * 60 * 24));
    const expectedDays = cycle.expectedDays || 0;
    const daysRemaining = Math.max(0, expectedDays - daysElapsed);
    return (_jsxs("div", { className: "bg-gradient-to-br from-primary-50 to-white rounded-xl border-2 border-primary-200 p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900", children: cycle.cropType }), _jsx("span", { className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium", children: "Active" })] }), _jsxs("p", { className: "text-gray-600", children: ["Day ", daysElapsed, " of ", expectedDays, " \u2022 ", daysRemaining, " days remaining"] })] }), _jsx("button", { onClick: onComplete, className: "btn-primary", children: "Complete Harvest" })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Overall Progress" }), _jsxs("span", { className: "text-sm font-semibold text-primary-600", children: [progress, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3 overflow-hidden", children: _jsx("div", { className: "bg-gradient-to-r from-primary-500 to-green-500 h-full rounded-full transition-all duration-500", style: { width: `${progress}%` } }) })] }), _jsxs("div", { className: "flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200", children: [_jsx("div", { className: "text-3xl", children: getStageIcon(cycle.currentStage) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Current Stage" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 capitalize", children: cycle.currentStage.replace('_', ' ') })] })] })] }));
}
function CycleTimeline({ cycle }) {
    const stages = ['seeding', 'germination', 'blackout', 'light_exposure', 'growth', 'harvest'];
    const currentIndex = stages.indexOf(cycle.currentStage);
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-6", children: "Growth Timeline" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" }), _jsx("div", { className: "space-y-6", children: stages.map((stage, index) => {
                            const isCompleted = index < currentIndex;
                            const isCurrent = index === currentIndex;
                            const isPending = index > currentIndex;
                            return (_jsxs("div", { className: "relative flex items-start", children: [_jsx("div", { className: `relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${isCompleted
                                            ? 'bg-green-500 border-green-200'
                                            : isCurrent
                                                ? 'bg-primary-500 border-primary-200 ring-4 ring-primary-100'
                                                : 'bg-white border-gray-300'}`, children: isCompleted ? (_jsx("svg", { className: "w-6 h-6 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) })) : (_jsx("span", { className: "text-xl", children: getStageIcon(stage) })) }), _jsxs("div", { className: "ml-6 flex-1", children: [_jsx("h4", { className: `text-base font-semibold capitalize ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`, children: stage.replace('_', ' ') }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: getStageDescription(stage) }), isCurrent && (_jsxs("div", { className: "mt-2 flex items-center space-x-2 text-xs text-primary-600", children: [_jsx("div", { className: "w-2 h-2 bg-primary-500 rounded-full animate-pulse" }), _jsx("span", { className: "font-medium", children: "In Progress" })] }))] })] }, stage));
                        }) })] })] }));
}
function StageChecklist({ cycle }) {
    const tasks = getStageChecklist(cycle.currentStage);
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Stage Checklist" }), _jsx("div", { className: "space-y-3", children: tasks.map((task, i) => (_jsx(TaskItem, { task: task }, i))) })] }));
}
function TaskItem({ task }) {
    return (_jsxs("div", { className: "flex items-center space-x-3 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: `flex items-center justify-center w-5 h-5 rounded border-2 ${task.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'}`, children: task.completed && (_jsx("svg", { className: "w-3 h-3 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }) })) }), _jsx("span", { className: `text-sm ${task.completed ? 'text-gray-600 line-through' : 'text-gray-900 font-medium'}`, children: task.label })] }));
}
function CycleHistory({ cycles }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Previous Harvests" }), _jsx("div", { className: "space-y-3", children: cycles.slice(0, 5).map(cycle => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900", children: cycle.cropType }), _jsxs("p", { className: "text-sm text-gray-500", children: [formatDate(cycle.startDate), " - ", formatDate(cycle.harvestDate)] })] }), cycle.yieldWeight && (_jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-lg font-semibold text-gray-900", children: [cycle.yieldWeight, " oz"] }), _jsx("p", { className: "text-xs text-gray-500", children: "Yield" })] }))] }, cycle.id))) })] }));
}
function EmptyState({ onStart }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDF31" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No Active Harvest Cycle" }), _jsx("p", { className: "text-gray-500 mb-6 max-w-md mx-auto", children: "Start a new harvest cycle to track growth from seeding to harvest." }), _jsx("button", { onClick: onStart, className: "btn-primary", children: "Start Your First Cycle" })] }));
}
function NewCycleModal({ moduleId, onClose }) {
    const [formData, setFormData] = useState({
        cropType: 'Arugula',
        expectedDays: 7,
        notes: '',
    });
    const [saving, setSaving] = useState(false);
    const handleSubmit = async (e) => {
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
        }
        catch (err) {
            console.error('Failed to create cycle:', err);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-md w-full", children: [_jsx("div", { className: "border-b border-gray-200 px-6 py-4", children: _jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Start New Harvest Cycle" }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Crop Type" }), _jsxs("select", { value: formData.cropType, onChange: (e) => setFormData({ ...formData, cropType: e.target.value }), className: "input", children: [_jsx("option", { children: "Arugula" }), _jsx("option", { children: "Basil" }), _jsx("option", { children: "Kale" }), _jsx("option", { children: "Lettuce" }), _jsx("option", { children: "Mustard Greens" }), _jsx("option", { children: "Radish" }), _jsx("option", { children: "Sunflower" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Expected Days to Harvest" }), _jsx("input", { type: "number", value: formData.expectedDays, onChange: (e) => setFormData({ ...formData, expectedDays: parseInt(e.target.value) }), className: "input", min: "1", max: "30" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Notes (optional)" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), className: "input", rows: 3, placeholder: "Add any notes about this cycle..." })] }), _jsxs("div", { className: "flex space-x-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "btn-primary flex-1", children: saving ? 'Starting...' : 'Start Cycle' })] })] })] }) }));
}
function CompleteCycleModal({ cycle, onClose }) {
    const [formData, setFormData] = useState({
        yieldWeight: '',
        quality: 'good',
        notes: '',
    });
    const [saving, setSaving] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateDoc(doc(db, 'harvest_cycles', cycle.id), {
                status: 'completed',
                harvestDate: Timestamp.now(),
                yieldWeight: parseFloat(formData.yieldWeight) || undefined,
                quality: formData.quality,
                notes: cycle.notes ? `${cycle.notes}\n\nHarvest: ${formData.notes}` : formData.notes,
                updatedAt: Timestamp.now(),
            });
            onClose();
        }
        catch (err) {
            console.error('Failed to complete cycle:', err);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-md w-full", children: [_jsx("div", { className: "border-b border-gray-200 px-6 py-4", children: _jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Complete Harvest" }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Yield Weight (oz)" }), _jsx("input", { type: "number", step: "0.1", value: formData.yieldWeight, onChange: (e) => setFormData({ ...formData, yieldWeight: e.target.value }), className: "input", placeholder: "e.g., 12.5" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Quality Rating" }), _jsxs("select", { value: formData.quality, onChange: (e) => setFormData({ ...formData, quality: e.target.value }), className: "input", children: [_jsx("option", { value: "excellent", children: "Excellent" }), _jsx("option", { value: "good", children: "Good" }), _jsx("option", { value: "fair", children: "Fair" }), _jsx("option", { value: "poor", children: "Poor" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Harvest Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), className: "input", rows: 3, placeholder: "Notes about yield quality, issues, etc." })] }), _jsxs("div", { className: "flex space-x-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "btn-primary flex-1", children: saving ? 'Completing...' : 'Complete Harvest' })] })] })] }) }));
}
function HarvestSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "w-48 h-8 bg-gray-200 rounded animate-pulse" }), _jsx("div", { className: "w-40 h-10 bg-gray-200 rounded animate-pulse" })] }), _jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: _jsx("div", { className: "w-full h-48 bg-gray-200 rounded animate-pulse" }) })] }));
}
// ============================================
// UTILITY FUNCTIONS
// ============================================
function getStageIcon(stage) {
    const icons = {
        seeding: '🌾',
        germination: '🌱',
        blackout: '🌑',
        light_exposure: '💡',
        growth: '🌿',
        harvest: '✂️',
    };
    return icons[stage] || '🌱';
}
function getStageProgress(stage) {
    const progress = {
        seeding: 10,
        germination: 25,
        blackout: 40,
        light_exposure: 60,
        growth: 80,
        harvest: 100,
    };
    return progress[stage] || 0;
}
function getStageDescription(stage) {
    const descriptions = {
        seeding: 'Plant seeds in growing medium',
        germination: 'Seeds are sprouting, keep moist',
        blackout: 'Cover trays, maintain high humidity',
        light_exposure: 'Remove covers, introduce light',
        growth: 'Maintain optimal conditions for growth',
        harvest: 'Ready to harvest and package',
    };
    return descriptions[stage] || '';
}
function getStageChecklist(stage) {
    const checklists = {
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
function formatDate(timestamp) {
    if (!timestamp)
        return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
