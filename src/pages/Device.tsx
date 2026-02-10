/**
 * Device Dashboard - Main hardware monitoring and control page
 * 
 * Integrates with Raspberry Pi via Firestore for real-time updates.
 * - View sensor readings (temperature, humidity, soil moisture, water level)
 * - Control pump and lights manually
 * - Monitor automation status
 * - View analytics and historical data
 * - Configure crop settings
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDeviceState, isDeviceOnline } from '../hooks/useDeviceState';
import { useHourlyHistory, formatChartData } from '../hooks/useHourlyHistory';
import { useAlerts } from '../hooks/useAlerts';
import { useCommands } from '../hooks/useCommands';
import { HealthCard } from '../components/dashboard/HealthCard';
import { SensorGauges } from '../components/dashboard/SensorGauges';
import { ScheduleCard } from '../components/dashboard/ScheduleCard';
import { ControlPanel } from '../components/dashboard/ControlPanel';
import { AlertBanner } from '../components/alerts/AlertBanner';
import { NavLink } from 'react-router-dom';
import NoOrganization from '../components/ui/NoOrganization';

// Simple line chart component for analytics
function SimpleChart({ data, title }: { data: { time: string; temperature: number; humidity: number }[]; title: string }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        No data available yet
      </div>
    );
  }

  const maxTemp = Math.max(...data.map(d => d.temperature));
  const minTemp = Math.min(...data.map(d => d.temperature));
  const maxHum = Math.max(...data.map(d => d.humidity));
  const minHum = Math.min(...data.map(d => d.humidity));
  
  const tempRange = maxTemp - minTemp || 1;
  const humRange = maxHum - minHum || 1;

  return (
    <div className="h-64">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Temperature (°F)</span>
        <span>Humidity (%)</span>
      </div>
      <div className="relative h-48 bg-gray-50 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-orange-600">
          <span>{Math.round(maxTemp)}°</span>
          <span>{Math.round(minTemp)}°</span>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-blue-600 text-right">
          <span>{Math.round(maxHum)}%</span>
          <span>{Math.round(minHum)}%</span>
        </div>
        
        {/* Chart area */}
        <svg className="w-[calc(100%-80px)] h-full mx-10" viewBox={`0 0 ${data.length * 20} 100`} preserveAspectRatio="none">
          {/* Temperature line */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            points={data.map((d, i) => 
              `${i * 20},${100 - ((d.temperature - minTemp) / tempRange) * 100}`
            ).join(' ')}
          />
          {/* Humidity line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4,2"
            points={data.map((d, i) => 
              `${i * 20},${100 - ((d.humidity - minHum) / humRange) * 100}`
            ).join(' ')}
          />
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-2 ml-10 mr-10">
          <span>{data[0]?.time}</span>
          <span>{data[Math.floor(data.length / 2)]?.time || ''}</span>
          <span>{data[data.length - 1]?.time}</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-orange-500"></span> Temperature
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-500"></span> Humidity
        </span>
      </div>
    </div>
  );
}

// Device info card showing hardware details
function DeviceInfoCard({ state }: { state: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        🔧 Hardware Info
      </h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Device ID:</span>
          <p className="font-mono text-gray-800 truncate">{state.deviceId}</p>
        </div>
        <div>
          <span className="text-gray-500">Firmware:</span>
          <p className="text-gray-800">{state.firmwareVersion || 'Unknown'}</p>
        </div>
        <div>
          <span className="text-gray-500">Last Sync:</span>
          <p className="text-gray-800">
            {state.lastSyncAt 
              ? new Date(state.lastSyncAt).toLocaleString()
              : 'Never'
            }
          </p>
        </div>
        <div>
          <span className="text-gray-500">Status:</span>
          <p className={`font-medium ${isDeviceOnline(state) ? 'text-green-600' : 'text-red-600'}`}>
            {isDeviceOnline(state) ? '🟢 Online' : '🔴 Offline'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Crop configuration display and editor
function CropConfigCard({ cropConfig, deviceId }: { cropConfig: any; deviceId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(cropConfig);
  const commands = useCommands(deviceId);

  const handleSave = async () => {
    try {
      await commands.sendCommand('update_crop_config', config);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update crop config:', err);
    }
  };

  if (!cropConfig) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          🌱 Crop Configuration
        </h3>
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">No crop configured yet</p>
          <NavLink 
            to="/device/setup"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Configure Crop
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          🌱 Crop Configuration
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Crop Type</label>
              <input
                type="text"
                value={config.cropType}
                onChange={(e) => setConfig({ ...config, cropType: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expected Harvest Days</label>
              <input
                type="number"
                value={config.expectedHarvestDays}
                onChange={(e) => setConfig({ ...config, expectedHarvestDays: parseInt(e.target.value) })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Light On Hour (0-23)</label>
              <input
                type="number"
                value={config.lightOnHour}
                onChange={(e) => setConfig({ ...config, lightOnHour: parseInt(e.target.value) })}
                className="w-full border rounded px-2 py-1 text-sm"
                min="0"
                max="23"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Light Off Hour (0-23)</label>
              <input
                type="number"
                value={config.lightOffHour}
                onChange={(e) => setConfig({ ...config, lightOffHour: parseInt(e.target.value) })}
                className="w-full border rounded px-2 py-1 text-sm"
                min="0"
                max="23"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Irrigation Interval (hours)</label>
              <input
                type="number"
                value={config.irrigationIntervalHours}
                onChange={(e) => setConfig({ ...config, irrigationIntervalHours: parseInt(e.target.value) })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Irrigation Duration (seconds)</label>
              <input
                type="number"
                value={config.irrigationDurationSeconds}
                onChange={(e) => setConfig({ ...config, irrigationDurationSeconds: parseInt(e.target.value) })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={commands.sending}
            className="w-full py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
          >
            {commands.sending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Crop Type</span>
            <span className="font-medium">{cropConfig.cropType.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Planted</span>
            <span className="font-medium">{new Date(cropConfig.plantedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Est. Harvest</span>
            <span className="font-medium">
              {new Date(cropConfig.plantedAt + cropConfig.expectedHarvestDays * 86400000).toLocaleDateString()} 
              <span className="text-gray-400 ml-1">({cropConfig.expectedHarvestDays} days)</span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Light Schedule</span>
            <span className="font-medium">
              {cropConfig.lightOnHour}:00 - {cropConfig.lightOffHour}:00
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Irrigation</span>
            <span className="font-medium">
              Every {cropConfig.irrigationIntervalHours}h for {cropConfig.irrigationDurationSeconds}s
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Target Temp</span>
            <span className="font-medium">
              {cropConfig.tempTargetMin}°F - {cropConfig.tempTargetMax}°F
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Device() {
  const { currentUser, currentOrganization, loading: authLoading } = useAuth();
  
  // Get deviceId from user profile (set during device registration)
  const deviceId = (currentUser as any)?.hardwareSerial || localStorage.getItem('harvestpilot_hardware_serial');
  
  const { state, loading: stateLoading, error: stateError } = useDeviceState(deviceId);
  const { data: history, loading: historyLoading } = useHourlyHistory(deviceId, 24);
  const { criticalAlert, activeAlerts } = useAlerts(deviceId);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'settings'>('overview');

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
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Device Connected</h1>
          <p className="text-gray-600 mb-6">
            Set up your HarvestPilot device to start monitoring your grow operation.
          </p>
          <NavLink 
            to="/device/setup"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
          >
            Set Up Device
          </NavLink>
          
          <div className="mt-8 pt-8 border-t text-left">
            <h3 className="font-medium text-gray-900 mb-4">What you'll need:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>Raspberry Pi with HarvestPilot software installed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>DHT22 sensor for temperature/humidity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>Soil moisture sensor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>Water pump with relay module</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">✓</span>
                <span>LED grow lights (optional)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (stateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Connecting to device...</p>
        </div>
      </div>
    );
  }

  if (stateError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{stateError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📡</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Device Not Found</h2>
          <p className="text-gray-600 mb-4">
            Your device hasn't synced yet. Make sure your Raspberry Pi is running and connected to the internet.
          </p>
          <NavLink 
            to="/device/setup"
            className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Troubleshoot Setup
          </NavLink>
        </div>
      </div>
    );
  }

  const chartData = formatChartData(history);

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Device Dashboard</h1>
            <p className="text-sm text-gray-500">
              {state.cropConfig?.cropType 
                ? `Growing ${state.cropConfig.cropType.replace(/_/g, ' ')}`
                : 'No crop configured'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeAlerts.length > 0 && (
              <NavLink 
                to="/alerts"
                className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm hover:bg-amber-200"
              >
                {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}
              </NavLink>
            )}
            <span className={`px-3 py-1 rounded-full text-sm ${
              isDeviceOnline(state) 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isDeviceOnline(state) ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            {(['overview', 'analytics', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && '📊 '}
                {tab === 'analytics' && '📈 '}
                {tab === 'settings' && '⚙️ '}
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
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

            {/* Row 2: Schedule + Controls */}
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

            {/* Row 3: Quick Chart Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Last 24 Hours
                </h3>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View Full Analytics →
                </button>
              </div>
              
              {historyLoading ? (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  Loading chart data...
                </div>
              ) : (
                <SimpleChart data={chartData} title="Temperature & Humidity" />
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {history.length > 0 ? (
                <>
                  <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                    <p className="text-sm text-gray-500">Avg Temperature</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.round(history.reduce((acc, h) => acc + h.tempAvg, 0) / history.length)}°F
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                    <p className="text-sm text-gray-500">Avg Humidity</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(history.reduce((acc, h) => acc + h.humidityAvg, 0) / history.length)}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                    <p className="text-sm text-gray-500">Total Pump Time</p>
                    <p className="text-2xl font-bold text-cyan-600">
                      {Math.round(history.reduce((acc, h) => acc + h.pumpOnMinutes, 0))} min
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                    <p className="text-sm text-gray-500">Total Light Time</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {Math.round(history.reduce((acc, h) => acc + h.lightOnMinutes, 0) / 60)}h
                    </p>
                  </div>
                </>
              ) : (
                <div className="col-span-4 text-center py-8 text-gray-500">
                  No historical data available yet
                </div>
              )}
            </div>

            {/* Full Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Temperature & Humidity Trends (24 Hours)
              </h3>
              <SimpleChart data={chartData} title="Temperature & Humidity" />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Hourly Data
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Time</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Temp (°F)</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Humidity (%)</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Soil (%)</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Water (%)</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Pump (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(-12).reverse().map((h, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 px-2">{new Date(h.hour).toLocaleTimeString()}</td>
                        <td className="text-center py-2 px-2">{Math.round(h.tempAvg)}</td>
                        <td className="text-center py-2 px-2">{Math.round(h.humidityAvg)}</td>
                        <td className="text-center py-2 px-2">{Math.round(h.soilMoistureAvg)}</td>
                        <td className="text-center py-2 px-2">{Math.round(h.waterLevelAvg)}</td>
                        <td className="text-center py-2 px-2">{h.pumpOnMinutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <p className="text-center py-4 text-gray-500">No data available yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DeviceInfoCard state={state} />
            <CropConfigCard cropConfig={state.cropConfig} deviceId={deviceId} />
          </div>
        )}
      </div>
    </div>
  );
}
