import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Farm Module Page
 *
 * Central management interface for a single Raspberry Pi farm automation module.
 * Provides overview, device management, automation, analytics, harvest tracking, and camera integration.
 *
 * Design Philosophy: Apple-like - clean, spacious, minimal, intentional.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Components
import ModuleOverview from '../components/farmModule/ModuleOverview';
import DevicesSection from '../components/farmModule/DevicesSection';
import AutomationsSection from '../components/farmModule/AutomationsSection';
import GrowthAnalytics from '../components/farmModule/GrowthAnalytics';
import HarvestCycleSection from '../components/farmModule/HarvestCycleSection';
import CameraSection from '../components/farmModule/CameraSection';
// Hooks & Services
import { useFarmModule } from '../hooks/useFarmModule';
export default function FarmModule() {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { currentOrganization } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const { module, loading, error } = useFarmModule(moduleId);
    // Redirect if no module ID
    useEffect(() => {
        if (!moduleId) {
            navigate('/');
        }
    }, [moduleId, navigate]);
    if (loading) {
        return _jsx(ModulePageSkeleton, {});
    }
    if (error || !module) {
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDEAB" }), _jsx("h2", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "Module Not Found" }), _jsx("p", { className: "text-gray-600 mb-6", children: error?.message || "The farm module you're looking for doesn't exist." }), _jsx("button", { onClick: () => navigate('/'), className: "btn-primary", children: "\u2190 Back to Farm Dashboard" })] }) }));
    }
    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'devices', label: 'Devices', icon: '🔧' },
        { id: 'automations', label: 'Automations', icon: '⚙️' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'harvest', label: 'Harvest Cycle', icon: '🌱' },
        { id: 'camera', label: 'Camera', icon: '📷' },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: () => navigate('/'), className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: module.name }), _jsxs("p", { className: "text-sm text-gray-500 mt-0.5", children: [module.location || `Module ${module.deviceId}`, _jsx("span", { className: "mx-2", children: "\u2022" }), _jsx("span", { className: `${module.status === 'online' ? 'text-green-600' : 'text-gray-400'}`, children: module.status === 'online' ? '🟢 Online' : '⚫ Offline' })] })] })] }), _jsxs("div", { className: "hidden md:flex items-center space-x-3", children: [_jsx("button", { className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "Settings" }), _jsx("button", { className: "px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors", children: "Start Harvest" })] })] }), _jsx("div", { className: "mt-6 border-b border-gray-200 -mb-px", children: _jsx("nav", { className: "flex space-x-8", children: tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `
                    pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `, children: [_jsx("span", { className: "mr-2", children: tab.icon }), tab.label] }, tab.id))) }) })] }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [activeTab === 'overview' && _jsx(ModuleOverview, { module: module }), activeTab === 'devices' && _jsx(DevicesSection, { moduleId: module.id }), activeTab === 'automations' && _jsx(AutomationsSection, { moduleId: module.id }), activeTab === 'analytics' && _jsx(GrowthAnalytics, { moduleId: module.id }), activeTab === 'harvest' && _jsx(HarvestCycleSection, { moduleId: module.id }), activeTab === 'camera' && _jsx(CameraSection, { moduleId: module.id })] })] }));
}
// Loading Skeleton
function ModulePageSkeleton() {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-6 h-6 bg-gray-200 rounded animate-pulse" }), _jsxs("div", { children: [_jsx("div", { className: "w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" }), _jsx("div", { className: "w-64 h-4 bg-gray-200 rounded animate-pulse" })] })] }), _jsx("div", { className: "mt-6 flex space-x-8", children: [1, 2, 3, 4, 5, 6].map((i) => (_jsx("div", { className: "w-24 h-4 bg-gray-200 rounded animate-pulse" }, i))) })] }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [1, 2, 3, 4, 5, 6].map((i) => (_jsxs("div", { className: "bg-white rounded-xl p-6 h-48 animate-pulse", children: [_jsx("div", { className: "w-32 h-4 bg-gray-200 rounded mb-4" }), _jsx("div", { className: "w-full h-20 bg-gray-200 rounded" })] }, i))) }) })] }));
}
