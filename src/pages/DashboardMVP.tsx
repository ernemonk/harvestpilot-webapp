/**
 * MVP Dashboard - Analytics-first device monitoring
 * 
 * This is the new single-device focused dashboard per the MVP plan.
 */

import { useAuth } from '../contexts/AuthContext';
import { useDeviceState, isDeviceOnline } from '../hooks/useDeviceState';
import { useHourlyHistory } from '../hooks/useHourlyHistory';
import { useAlerts } from '../hooks/useAlerts';
import { HealthCard } from '../components/dashboard/HealthCard';
import { SensorGauges } from '../components/dashboard/SensorGauges';
import { ScheduleCard } from '../components/dashboard/ScheduleCard';
import { ControlPanel } from '../components/dashboard/ControlPanel';
import { AlertBanner } from '../components/alerts/AlertBanner';

export default function DashboardMVP() {
  // For MVP, get deviceId from user profile or use a default
  const { currentUser } = useAuth();
  const deviceId = (currentUser as any)?.deviceId || 'demo-device';
  
  const { state, loading: stateLoading, error: stateError } = useDeviceState(deviceId);
  const { data: history, loading: historyLoading } = useHourlyHistory(deviceId, 24);
  const { criticalAlert, activeAlerts } = useAlerts(deviceId);

  if (stateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading device data...</p>
        </div>
      </div>
    );
  }

  if (stateError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">⚠️ Error loading device</p>
          <p className="text-sm">{stateError.message}</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl mb-2">📡 No device connected</p>
          <p className="text-gray-600 mb-4">Set up your HarvestPilot device to get started.</p>
          <a 
            href="/setup" 
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Set Up Device
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Critical Alert Banner */}
      {criticalAlert && (
        <AlertBanner 
          alert={criticalAlert}
          onViewDetails={() => window.location.href = '/alerts'}
        />
      )}
      
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {activeAlerts.length > 0 && (
            <a 
              href="/alerts"
              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
            >
              {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
            </a>
          )}
        </div>

        {/* Row 1: Health + Current Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HealthCard
            status={isDeviceOnline(state) ? 'online' : 'offline'}
            autopilotMode={state.autopilotMode}
            lastHeartbeat={state.lastHeartbeat}
            failsafeTriggered={state.failsafeTriggered}
            failsafeReason={state.failsafeReason}
          />
          
          <SensorGauges
            currentReading={state.currentReading}
            cropConfig={state.cropConfig}
          />
        </div>

        {/* Row 2: Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Temperature & Humidity (Last 24 Hours)
          </h3>
          
          {historyLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              Loading chart data...
            </div>
          ) : history.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No historical data yet. Data will appear after the first hour of operation.
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              {/* Recharts component would go here */}
              <div className="text-center">
                <p>📊 {history.length} data points available</p>
                <p className="text-sm mt-1">
                  Temp range: {Math.round(Math.min(...history.map(h => h.tempMin)))}°F - 
                  {Math.round(Math.max(...history.map(h => h.tempMax)))}°F
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Schedule + Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScheduleCard
            lastIrrigationAt={state.lastIrrigationAt}
            nextIrrigationAt={state.nextIrrigationAt}
            irrigationIntervalHours={state.cropConfig?.irrigationIntervalHours || 4}
          />
          
          <ControlPanel
            deviceId={deviceId}
            autopilotMode={state.autopilotMode}
            lightsOn={state.lightsOn}
            failsafeTriggered={state.failsafeTriggered}
            waterLevel={state.currentReading?.waterLevel || 0}
          />
        </div>

        {/* Row 4: Crop Info */}
        {state.cropConfig && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Crop Info
                </h3>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {state.cropConfig.cropType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>
                  Planted: {new Date(state.cropConfig.plantedAt).toLocaleDateString()}
                </p>
                <p>
                  Est. harvest: {
                    new Date(
                      state.cropConfig.plantedAt + 
                      state.cropConfig.expectedHarvestDays * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()
                  } ({state.cropConfig.expectedHarvestDays} days)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
