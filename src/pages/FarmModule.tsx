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

type TabType = 'overview' | 'devices' | 'automations' | 'analytics' | 'harvest' | 'camera';

export default function FarmModule() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { currentOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const { module, loading, error } = useFarmModule(moduleId);

  // Redirect if no module ID
  useEffect(() => {
    if (!moduleId) {
      navigate('/');
    }
  }, [moduleId, navigate]);

  if (loading) {
    return <ModulePageSkeleton />;
  }

  if (error || !module) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Module Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error?.message || "The farm module you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            ← Back to Farm Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'devices', label: 'Devices', icon: '🔧' },
    { id: 'automations', label: 'Automations', icon: '⚙️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'harvest', label: 'Harvest Cycle', icon: '🌱' },
    { id: 'camera', label: 'Camera', icon: '📷' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{module.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {module.location || `Module ${module.deviceId}`}
                  <span className="mx-2">•</span>
                  <span className={`${module.status === 'online' ? 'text-green-600' : 'text-gray-400'}`}>
                    {module.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Settings
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                Start Harvest
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200 -mb-px">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <ModuleOverview module={module} />}
        {activeTab === 'devices' && <DevicesSection moduleId={module.id} hardwareSerial={module.id} />}
        {activeTab === 'automations' && <AutomationsSection moduleId={module.id} />}
        {activeTab === 'analytics' && <GrowthAnalytics moduleId={module.id} />}
        {activeTab === 'harvest' && <HarvestCycleSection moduleId={module.id} />}
        {activeTab === 'camera' && <CameraSection moduleId={module.id} />}
      </div>
    </div>
  );
}

// Loading Skeleton
function ModulePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            <div>
              <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-64 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-6 flex space-x-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 h-48 animate-pulse">
              <div className="w-32 h-4 bg-gray-200 rounded mb-4" />
              <div className="w-full h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
