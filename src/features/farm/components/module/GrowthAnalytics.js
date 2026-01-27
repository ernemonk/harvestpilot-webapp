import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Growth Analytics Section
 *
 * Visualize sensor data trends and growth metrics over time.
 * Features: Line charts, bar charts, date range selector, metric cards.
 */
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
export default function GrowthAnalyticsSection({ moduleId }) {
    const [timeRange, setTimeRange] = useState('7d');
    const [selectedMetric, setSelectedMetric] = useState('temperature');
    const [readings, setReadings] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    // Subscribe to recent readings
    useEffect(() => {
        const readingsRef = collection(db, 'sensor_readings');
        const cutoffDate = getCutoffDate(timeRange);
        const q = query(readingsRef, where('moduleId', '==', moduleId), where('timestamp', '>=', cutoffDate), orderBy('timestamp', 'desc'), limit(500));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data());
            setReadings(data.reverse()); // Reverse to chronological order
            setLoading(false);
        });
        return () => unsubscribe();
    }, [moduleId, timeRange]);
    // Calculate summary metrics
    useEffect(() => {
        if (readings.length === 0)
            return;
        const tempReadings = readings.filter(r => r.sensorType === 'temperature').map(r => r.value);
        const humidityReadings = readings.filter(r => r.sensorType === 'humidity').map(r => r.value);
        const soilReadings = readings.filter(r => r.sensorType === 'soil_moisture').map(r => r.value);
        setMetrics({
            date: new Date(),
            avgTemperature: average(tempReadings),
            avgHumidity: average(humidityReadings),
            avgSoilMoisture: average(soilReadings),
            minTemperature: Math.min(...tempReadings) || 0,
            maxTemperature: Math.max(...tempReadings) || 0,
            totalLightHours: 0, // TODO: Calculate from light sensor
            wateringEvents: readings.filter(r => r.sensorType === 'pump').length,
        });
    }, [readings]);
    if (loading) {
        return _jsx(AnalyticsSkeleton, {});
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Growth Analytics" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Environmental data and growth trends" })] }), _jsx(TimeRangeSelector, { value: timeRange, onChange: setTimeRange })] }), metrics && _jsx(SummaryCards, { metrics: metrics, timeRange: timeRange }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Environmental Trends" }), _jsx(MetricSelector, { value: selectedMetric, onChange: setSelectedMetric })] }), _jsx(LineChart, { data: readings.filter(r => r.sensorType === selectedMetric), metric: selectedMetric, timeRange: timeRange })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-6", children: "Watering Events" }), _jsx(EventsChart, { readings: readings, timeRange: timeRange })] })] }));
}
// ============================================
// SUB-COMPONENTS
// ============================================
function TimeRangeSelector({ value, onChange }) {
    const options = [
        { value: '24h', label: '24 Hours' },
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
    ];
    return (_jsx("div", { className: "flex space-x-1 bg-gray-100 rounded-lg p-1", children: options.map(opt => (_jsx("button", { onClick: () => onChange(opt.value), className: `px-4 py-2 rounded-md text-sm font-medium transition-all ${value === opt.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'}`, children: opt.label }, opt.value))) }));
}
function MetricSelector({ value, onChange }) {
    const metrics = [
        { value: 'temperature', label: 'Temperature', icon: '🌡️' },
        { value: 'humidity', label: 'Humidity', icon: '💧' },
        { value: 'soil_moisture', label: 'Soil Moisture', icon: '🌱' },
        { value: 'light', label: 'Light', icon: '☀️' },
    ];
    return (_jsx("select", { value: value, onChange: (e) => onChange(e.target.value), className: "input text-sm py-2", children: metrics.map(m => (_jsxs("option", { value: m.value, children: [m.icon, " ", m.label] }, m.value))) }));
}
function SummaryCards({ metrics, timeRange }) {
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
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: cards.map((card, i) => (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-3", children: [_jsx("span", { className: "text-3xl", children: card.icon }), _jsx("p", { className: "text-sm font-medium text-gray-500", children: card.label })] }), _jsx("p", { className: "text-2xl font-semibold text-gray-900 mb-1", children: card.value }), _jsx("p", { className: "text-xs text-gray-500", children: card.subtitle })] }, i))) }));
}
function LineChart({ data, metric, timeRange }) {
    if (data.length === 0) {
        return (_jsx("div", { className: "h-64 flex items-center justify-center text-gray-400", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83D\uDCCA" }), _jsx("p", { className: "text-sm", children: "No data available for this time range" })] }) }));
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
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full", style: { minWidth: '600px' }, children: [[0, 1, 2, 3, 4].map(i => {
                    const y = padding.top + (i * chartHeight) / 4;
                    return (_jsx("line", { x1: padding.left, y1: y, x2: width - padding.right, y2: y, stroke: "#e5e7eb", strokeWidth: "1" }, i));
                }), _jsx("path", { d: areaData, fill: "url(#gradient)", opacity: "0.2" }), _jsx("defs", { children: _jsxs("linearGradient", { id: "gradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: "#10b981" }), _jsx("stop", { offset: "100%", stopColor: "#10b981", stopOpacity: "0" })] }) }), _jsx("path", { d: pathData, stroke: "#10b981", strokeWidth: "2", fill: "none" }), points.map((p, i) => (_jsx("circle", { cx: p.x, cy: p.y, r: "3", fill: "#10b981" }, i))), yLabels.map((label, i) => {
                    const y = padding.top + chartHeight - (i * chartHeight) / 2;
                    return (_jsx("text", { x: padding.left - 10, y: y + 4, textAnchor: "end", fontSize: "12", fill: "#6b7280", children: label }, i));
                }), xLabels.map((item, i) => (_jsx("text", { x: item.x, y: height - padding.bottom + 20, textAnchor: "middle", fontSize: "11", fill: "#6b7280", children: item.label }, i))), _jsx("line", { x1: padding.left, y1: padding.top, x2: padding.left, y2: height - padding.bottom, stroke: "#9ca3af", strokeWidth: "1" }), _jsx("line", { x1: padding.left, y1: height - padding.bottom, x2: width - padding.right, y2: height - padding.bottom, stroke: "#9ca3af", strokeWidth: "1" })] }) }));
}
function EventsChart({ readings, timeRange }) {
    const wateringEvents = readings.filter(r => r.sensorType === 'pump' || r.sensorType === 'valve');
    if (wateringEvents.length === 0) {
        return (_jsx("div", { className: "h-48 flex items-center justify-center text-gray-400", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83D\uDCA6" }), _jsx("p", { className: "text-sm", children: "No watering events in this time range" })] }) }));
    }
    // Group events by day
    const eventsByDay = wateringEvents.reduce((acc, event) => {
        const date = new Date(event.timestamp.seconds * 1000);
        const dayKey = date.toLocaleDateString();
        acc[dayKey] = (acc[dayKey] || 0) + 1;
        return acc;
    }, {});
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
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full", style: { minWidth: '600px' }, children: [days.map((day, i) => {
                    const count = eventsByDay[day];
                    const barHeight = (count / maxCount) * chartHeight;
                    const x = padding.left + (i * chartWidth) / days.length + (chartWidth / days.length - barWidth) / 2;
                    const y = padding.top + chartHeight - barHeight;
                    return (_jsxs("g", { children: [_jsx("rect", { x: x, y: y, width: barWidth, height: barHeight, fill: "#3b82f6", rx: "4" }), _jsx("text", { x: x + barWidth / 2, y: y - 5, textAnchor: "middle", fontSize: "12", fill: "#374151", fontWeight: "600", children: count }), _jsx("text", { x: x + barWidth / 2, y: height - padding.bottom + 20, textAnchor: "middle", fontSize: "10", fill: "#6b7280", children: formatDayLabel(day, timeRange) })] }, day));
                }), _jsx("line", { x1: padding.left, y1: padding.top, x2: padding.left, y2: height - padding.bottom, stroke: "#9ca3af", strokeWidth: "1" }), _jsx("line", { x1: padding.left, y1: height - padding.bottom, x2: width - padding.right, y2: height - padding.bottom, stroke: "#9ca3af", strokeWidth: "1" })] }) }));
}
function AnalyticsSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "w-48 h-8 bg-gray-200 rounded animate-pulse" }), _jsx("div", { className: "w-64 h-10 bg-gray-200 rounded animate-pulse" })] }), _jsx("div", { className: "grid grid-cols-4 gap-6", children: [1, 2, 3, 4].map(i => (_jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: _jsx("div", { className: "w-full h-20 bg-gray-200 rounded animate-pulse" }) }, i))) }), [1, 2].map(i => (_jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: _jsx("div", { className: "w-full h-64 bg-gray-200 rounded animate-pulse" }) }, i)))] }));
}
// ============================================
// UTILITY FUNCTIONS
// ============================================
function getCutoffDate(range) {
    const now = new Date();
    const hours = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
        '90d': 24 * 90,
    };
    const cutoff = new Date(now.getTime() - hours[range] * 60 * 60 * 1000);
    return Timestamp.fromDate(cutoff);
}
function formatTimestamp(timestamp, range) {
    if (!timestamp)
        return '';
    const date = new Date(timestamp.seconds * 1000);
    if (range === '24h') {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
function formatDayLabel(dayStr, range) {
    const date = new Date(dayStr);
    if (range === '24h' || range === '7d') {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function average(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}
