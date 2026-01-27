/**
 * Farm Dashboard - Multi-Device Overview
 * 
 * The primary landing page for farmers managing multiple growing racks.
 * Provides at-a-glance status of all devices, recent alerts, and quick access to individual device controls.
 * 
 * Design Philosophy:
 * - Calm, spacious layout (not cramped)
 * - Status-first (online/offline, health indicators)
 * - Click to drill down into device details
 * - Aligned with "plug in and walk away" vision
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import NoOrganization from '../components/ui/NoOrganization';

interface DeviceStatus {
  deviceId: string;
  deviceName: string;
  status: 'online' | 'offline';
  lastHeartbeat: Timestamp;
  temperature?: number;
  humidity?: number;
  soilMoisture?: number;
  waterLevel?: number;
  cropType?: string;
  plantedAt?: Timestamp;
  estimatedHarvestDays?: number;
  currentDay?: number;
}

interface Alert {
  id: string;
  deviceId: string;
  deviceName?: string;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: Timestamp;
  acknowledged: boolean;
}

export default function FarmDashboard() {
  const { currentOrganization } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }

    // Real-time listener for all devices
    const devicesRef = collection(db, 'devices');
    const devicesQuery = query(devicesRef);

    const unsubscribeDevices = onSnapshot(devicesQuery, (snapshot) => {
      const deviceData: DeviceStatus[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const lastHeartbeat = data.lastHeartbeat as Timestamp;
        const now = Timestamp.now();
        const minutesSinceHeartbeat = (now.seconds - lastHeartbeat.seconds) / 60;
        
        return {
          deviceId: doc.id,
          deviceName: data.deviceName || doc.id,
          status: minutesSinceHeartbeat < 5 ? 'online' : 'offline',
          lastHeartbeat,
          temperature: data.currentReading?.temperature,
          humidity: data.currentReading?.humidity,
          soilMoisture: data.currentReading?.soilMoisture,
          waterLevel: data.currentReading?.waterLevel,
          cropType: data.cropConfig?.cropType,
          plantedAt: data.cropConfig?.plantedAt,
          estimatedHarvestDays: data.cropConfig?.estimatedHarvestDays || 30,
          currentDay: data.cropConfig?.plantedAt 
            ? Math.floor((now.seconds - data.cropConfig.plantedAt.seconds) / 86400)
            : undefined
        };
      });

      setDevices(deviceData);
      setLoading(false);
    });

    // Real-time listener for recent alerts
    const alertsRef = collection(db, 'alerts');
    const alertsQuery = query(
      alertsRef,
      where('organizationId', '==', currentOrganization.id)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alertData: Alert[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Alert))
        .filter(alert => !alert.acknowledged)
        .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
        .slice(0, 5); // Show 5 most recent

      setAlerts(alertData);
    });

    return () => {
      unsubscribeDevices();
      unsubscribeAlerts();
    };
  }, [currentOrganization]);

  if (!currentOrganization) {
    return <NoOrganization />;
  }

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentOrganization.name}
        </h1>
        <p className="text-lg text-gray-600">
          {devices.length} {devices.length === 1 ? 'device' : 'devices'} · {onlineCount} online
          {criticalAlerts > 0 && (
            <span className="ml-3 text-red-600 font-medium">
              · {criticalAlerts} critical {criticalAlerts === 1 ? 'alert' : 'alerts'}
            </span>
          )}
        </p>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts > 0 && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Critical Alerts Require Attention
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {alerts.filter(a => a.severity === 'critical').slice(0, 3).map(alert => (
                  <div key={alert.id} className="mb-1">
                    • {alert.deviceName || alert.deviceId}: {alert.message}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <NavLink
                  to="/alerts"
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  View all alerts →
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading devices...</div>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No devices registered</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Set up your first HarvestPilot device to start monitoring your farm.
          </p>
          <div className="mt-6">
            <NavLink
              to="/device/setup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Set Up Device
            </NavLink>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => (
            <DeviceCard key={device.deviceId} device={device} navigate={navigate} />
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {devices.length > 0 && alerts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {alert.deviceName || alert.deviceId}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Device Card Component
function DeviceCard({ device, navigate }: { device: DeviceStatus; navigate: any }) {
  const isOnline = device.status === 'online';
  const harvestProgress = device.currentDay && device.estimatedHarvestDays
    ? Math.min((device.currentDay / device.estimatedHarvestDays) * 100, 100)
    : 0;
  const daysRemaining = device.currentDay && device.estimatedHarvestDays
    ? Math.max(device.estimatedHarvestDays - device.currentDay, 0)
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-primary-500 transition-all hover:shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {device.deviceName}
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className={`text-sm font-medium ${isOnline ? 'text-green-700' : 'text-gray-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <span className="text-3xl">🌱</span>
        </div>

        {/* Sensor Readings */}
        {isOnline && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs font-medium text-orange-900 mb-1">Temperature</div>
              <div className="text-lg font-bold text-orange-700">
                {device.temperature ? `${Math.round(device.temperature)}°F` : '--'}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-900 mb-1">Humidity</div>
              <div className="text-lg font-bold text-blue-700">
                {device.humidity ? `${Math.round(device.humidity)}%` : '--'}
              </div>
            </div>
          </div>
        )}

        {/* Crop Info */}
        {device.cropType && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{device.cropType}</span>
              <span className="text-xs text-gray-500">
                Day {device.currentDay || 0} of {device.estimatedHarvestDays}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${harvestProgress}%` }}
              />
            </div>
            {daysRemaining !== null && (
              <p className="text-xs text-gray-600 mt-1">
                {daysRemaining === 0 ? '🎉 Ready to harvest!' : `${daysRemaining} days to harvest`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex space-x-3">
        <button
          onClick={() => navigate(`/farm-module/${device.deviceId}`)}
          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => navigate('/device', { state: { deviceId: device.deviceId, showControls: true } })}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Controls
        </button>
      </div>
    </div>
  );
}

// Time formatting utility
function formatTimeAgo(timestamp: Timestamp): string {
  const now = Date.now();
  const then = timestamp.seconds * 1000;
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}
