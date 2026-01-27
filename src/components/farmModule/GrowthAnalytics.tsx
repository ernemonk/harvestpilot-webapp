/**
 * Growth Analytics Section
 * 
 * Visualize sensor data trends and growth metrics over time.
 * Features: Line charts, bar charts, date range selector, metric cards.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Reading, GrowthMetrics } from '../../types/farmModule';

interface GrowthAnalyticsSectionProps {
  moduleId: string;
}

type TimeRange = '24h' | '7d' | '30d' | '90d';
type ChartMetric = 'temperature' | 'humidity' | 'soil_moisture' | 'light';

export default function GrowthAnalyticsSection({ moduleId }: GrowthAnalyticsSectionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('temperature');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to recent readings
  useEffect(() => {
    const readingsRef = collection(db, 'sensor_readings');
    const cutoffDate = getCutoffDate(timeRange);
    
    const q = query(
      readingsRef,
      where('moduleId', '==', moduleId),
      where('timestamp', '>=', cutoffDate),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Reading);
      setReadings(data.reverse()); // Reverse to chronological order
      setLoading(false);
    });

    return () => unsubscribe();
  }, [moduleId, timeRange]);

  // Calculate summary metrics
  useEffect(() => {
    if (readings.length === 0) return;

    const tempReadings = readings.filter(r => r.sensorType === 'temperature').map(r => (typeof r.value === 'number' ? r.value : 0));
    const humidityReadings = readings.filter(r => r.sensorType === 'humidity').map(r => (typeof r.value === 'number' ? r.value : 0));
    const soilReadings = readings.filter(r => r.sensorType === 'soil_moisture').map(r => (typeof r.value === 'number' ? r.value : 0));

    setMetrics({
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      avgTemperature: average(tempReadings),
      avgHumidity: average(humidityReadings),
      avgSoilMoisture: average(soilReadings),
      minTemperature: tempReadings.length > 0 ? Math.min(...tempReadings) : 0,
      maxTemperature: tempReadings.length > 0 ? Math.max(...tempReadings) : 0,
      totalLightHours: 0, // TODO: Calculate from light sensor
      wateringEvents: readings.filter(r => r.sensorType === 'pump').length,
      moduleId,
      cycleId: 'current', // TODO: Get from context
    });
  }, [readings]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Growth Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Environmental data and growth trends
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary Cards */}
      {metrics && <SummaryCards metrics={metrics} timeRange={timeRange} />}

      {/* Main Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Environmental Trends</h3>
          <MetricSelector value={selectedMetric} onChange={setSelectedMetric} />
        </div>
        <LineChart
          data={readings.filter(r => r.sensorType === selectedMetric)}
          metric={selectedMetric}
          timeRange={timeRange}
        />
      </div>

      {/* Events Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Watering Events</h3>
        <EventsChart readings={readings} timeRange={timeRange} />
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const options: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MetricSelector({ value, onChange }: { value: ChartMetric; onChange: (v: ChartMetric) => void }) {
  const metrics: { value: ChartMetric; label: string; icon: string }[] = [
    { value: 'temperature', label: 'Temperature', icon: '🌡️' },
    { value: 'humidity', label: 'Humidity', icon: '💧' },
    { value: 'soil_moisture', label: 'Soil Moisture', icon: '🌱' },
    { value: 'light', label: 'Light', icon: '☀️' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ChartMetric)}
      className="input text-sm py-2"
    >
      {metrics.map(m => (
        <option key={m.value} value={m.value}>
          {m.icon} {m.label}
        </option>
      ))}
    </select>
  );
}

function SummaryCards({ metrics, timeRange }: { metrics: GrowthMetrics; timeRange: TimeRange }) {
  const cards = [
    {
      label: 'Avg Temperature',
      value: `${Math.round(metrics.avgTemperature)}°F`,
      subtitle: `Range: ${Math.round(metrics.minTemperature)}° - ${Math.round(metrics.maxTemperature)}°`,
      icon: '🌡️',
    },
    {
      label: 'Avg Humidity',
      value: `${Math.round(metrics.avgHumidity)}%`,
      subtitle: `Last ${timeRange}`,
      icon: '💧',
    },
    {
      label: 'Avg Soil Moisture',
      value: `${Math.round(metrics.avgSoilMoisture)}%`,
      subtitle: `Last ${timeRange}`,
      icon: '🌱',
    },
    {
      label: 'Watering Events',
      value: metrics.wateringEvents.toString(),
      subtitle: `Last ${timeRange}`,
      icon: '💦',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-3xl">{card.icon}</span>
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{card.value}</p>
          <p className="text-xs text-gray-500">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, metric }: { data: Reading[]; metric: ChartMetric; timeRange: TimeRange }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">No data available for this time range</p>
        </div>
      </div>
    );
  }

  // SVG dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate bounds
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Create points
  const points = data.map((reading, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((reading.value - minValue) / valueRange) * chartHeight;
    return { x, y, value: reading.value, timestamp: reading.timestamp };
  });

  // Create path
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Create area path (for gradient fill)
  const areaData = `${pathData} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Y-axis labels
  const yLabels = [minValue, (minValue + maxValue) / 2, maxValue].map(val => Math.round(val));

  // X-axis labels (show 5 evenly spaced timestamps)
  const xLabelIndices = [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(3 * data.length / 4), data.length - 1];
  const xLabels = xLabelIndices.map(i => ({
    x: points[i]?.x || padding.left,
    label: formatTimestamp(data[i]?.timestamp, timeRange),
  }));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '600px' }}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding.top + (i * chartHeight) / 4;
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaData} fill="url(#gradient)" opacity="0.2" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Line */}
        <path d={pathData} stroke="#10b981" strokeWidth="2" fill="none" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label, i) => {
          const y = padding.top + chartHeight - (i * chartHeight) / 2;
          return (
            <text key={i} x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#6b7280">
              {label}
            </text>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((item, i) => (
          <text
            key={i}
            x={item.x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
          >
            {item.label}
          </text>
        ))}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function EventsChart({ readings, timeRange }: { readings: Reading[]; timeRange: TimeRange }) {
  const wateringEvents = readings.filter(r => r.sensorType === 'pump' || r.sensorType === 'valve');

  if (wateringEvents.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">💦</div>
          <p className="text-sm">No watering events in this time range</p>
        </div>
      </div>
    );
  }

  // Group events by day
  const eventsByDay = wateringEvents.reduce((acc, event) => {
    const date = new Date((event.timestamp as any).seconds * 1000);
    const dayKey = date.toLocaleDateString();
    acc[dayKey] = (acc[dayKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const days = Object.keys(eventsByDay);
  const counts = Object.values(eventsByDay);
  const maxCount = Math.max(...counts);

  // SVG dimensions
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.min(40, chartWidth / days.length - 10);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '600px' }}>
        {/* Bars */}
        {days.map((day, i) => {
          const count = eventsByDay[day];
          const barHeight = (count / maxCount) * chartHeight;
          const x = padding.left + (i * chartWidth) / days.length + (chartWidth / days.length - barWidth) / 2;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={day}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#3b82f6"
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="12"
                fill="#374151"
                fontWeight="600"
              >
                {count}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {formatDayLabel(day, timeRange)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-64 h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-full h-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-full h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getCutoffDate(range: TimeRange): Timestamp {
  const now = new Date();
  const hours: Record<TimeRange, number> = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
    '90d': 24 * 90,
  };
  const cutoff = new Date(now.getTime() - hours[range] * 60 * 60 * 1000);
  return Timestamp.fromDate(cutoff);
}

function formatTimestamp(timestamp: any, range: TimeRange): string {
  if (!timestamp) return '';
  const date = new Date(timestamp.seconds * 1000);
  
  if (range === '24h') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function formatDayLabel(dayStr: string, range: TimeRange): string {
  const date = new Date(dayStr);
  if (range === '24h' || range === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
