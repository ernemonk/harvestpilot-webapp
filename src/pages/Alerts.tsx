/**
 * Alerts Page - Alert history with acknowledgment
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../hooks/useAlerts';
import type { Alert } from '../hooks/useAlerts';
import { AlertList } from '../components/alerts/AlertList';
import NoOrganization from '../components/ui/NoOrganization';

type FilterType = 'all' | 'active' | 'resolved';

export default function Alerts() {
  const { currentUser, currentOrganization, loading: authLoading } = useAuth();
  
  // Get deviceId from user profile or localStorage
  const deviceId = (currentUser as any)?.deviceId || localStorage.getItem('harvestpilot_device_id');
  
  const { alerts, activeAlerts, loading, error, acknowledgeAlert } = useAlerts(deviceId);
  const [filter, setFilter] = useState<FilterType>('active');

  // Show loading while checking organization
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show NoOrganization if user doesn't have an organization
  if (!currentOrganization) {
    return <NoOrganization />;
  }

  // No device registered
  if (!deviceId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔔</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Device Connected</h2>
          <p className="text-gray-600 mb-4">Set up a device to see alerts.</p>
          <a href="/device/setup" className="text-primary-600 hover:underline">Set Up Device →</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">⚠️ Error loading alerts</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const resolvedAlerts = alerts.filter((a) => a.resolvedAt);
  
  const getFilteredAlerts = (): Alert[] => {
    switch (filter) {
      case 'active':
        return activeAlerts;
      case 'resolved':
        return resolvedAlerts;
      default:
        return alerts;
    }
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          
          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                filter === 'active'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeAlerts.length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                filter === 'resolved'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Resolved ({resolvedAlerts.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({alerts.length})
            </button>
          </div>
        </div>

        <AlertList
          alerts={filteredAlerts}
          onAcknowledge={acknowledgeAlert}
          emptyMessage={
            filter === 'active'
              ? 'No active alerts. Your system is running smoothly! ✓'
              : filter === 'resolved'
              ? 'No resolved alerts yet.'
              : 'No alerts recorded.'
          }
        />
      </div>
    </div>
  );
}
