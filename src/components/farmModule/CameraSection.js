import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Camera Section
 *
 * View camera feeds, snapshots, and timelapse from farm module.
 * Features: Live preview, snapshot capture, timelapse gallery.
 */
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
export default function CameraSection({ moduleId }) {
    const [cameraConfig, setCameraConfig] = useState(null);
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [capturing, setCapturing] = useState(false);
    // Subscribe to camera config
    useEffect(() => {
        const configRef = collection(db, 'camera_configs');
        const q = query(configRef, where('moduleId', '==', moduleId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setCameraConfig({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [moduleId]);
    // Subscribe to snapshots
    useEffect(() => {
        const snapshotsRef = collection(db, 'camera_snapshots');
        const q = query(snapshotsRef, where('moduleId', '==', moduleId), orderBy('timestamp', 'desc'), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSnapshots(data);
        });
        return () => unsubscribe();
    }, [moduleId]);
    const handleCaptureSnapshot = async () => {
        setCapturing(true);
        try {
            // TODO: Implement actual camera capture via API
            await addDoc(collection(db, 'camera_snapshots'), {
                moduleId,
                url: `https://picsum.photos/800/600?random=${Date.now()}`, // Placeholder
                timestamp: Timestamp.now(),
                type: 'manual',
            });
        }
        catch (err) {
            console.error('Failed to capture snapshot:', err);
        }
        finally {
            setTimeout(() => setCapturing(false), 1000);
        }
    };
    if (loading) {
        return _jsx(CameraSkeleton, {});
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Camera" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Monitor your crops with live camera feed" })] }) }), cameraConfig ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx(CameraStatus, { config: cameraConfig }), _jsx(CameraControls, { config: cameraConfig, onCapture: handleCaptureSnapshot, capturing: capturing })] }), _jsx(LivePreview, { config: cameraConfig }), _jsx(SnapshotsGallery, { snapshots: snapshots })] })) : (_jsx(NoCameraState, { moduleId: moduleId }))] }));
}
// ============================================
// SUB-COMPONENTS
// ============================================
function CameraStatus({ config }) {
    const isOnline = config.enabled && config.streamUrl;
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} animate-pulse` }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Camera Status" })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Status" }), _jsx("span", { className: `font-medium ${isOnline ? 'text-green-600' : 'text-gray-400'}`, children: isOnline ? 'Online' : 'Offline' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Resolution" }), _jsx("span", { className: "font-medium text-gray-900", children: config.resolution || '1920x1080' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Frame Rate" }), _jsxs("span", { className: "font-medium text-gray-900", children: [config.frameRate || 30, " fps"] })] })] })] }));
}
function CameraControls({ config, onCapture, capturing }) {
    return (_jsxs("div", { className: "lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("button", { onClick: onCapture, disabled: !config.enabled || capturing, className: "btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed", children: capturing ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "w-5 h-5 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Capturing..." })] })) : (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z" })] }), _jsx("span", { children: "Capture Snapshot" })] })) }), _jsxs("button", { disabled: true, className: "btn-secondary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: "Start Timelapse" })] }), _jsxs("button", { disabled: true, className: "btn-secondary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed", children: [_jsxs("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] }), _jsx("span", { children: "Camera Settings" })] }), _jsxs("button", { disabled: true, className: "btn-secondary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }), _jsx("span", { children: "Download All" })] })] })] }));
}
function LivePreview({ config }) {
    if (!config.streamUrl) {
        return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Live Preview" }) }), _jsx("div", { className: "aspect-video bg-gray-900 flex items-center justify-center", children: _jsxs("div", { className: "text-center text-white", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCF7" }), _jsx("p", { className: "text-lg font-medium mb-2", children: "Camera Stream Not Available" }), _jsx("p", { className: "text-sm text-gray-400", children: "Configure camera settings to enable live preview" })] }) })] }));
    }
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 overflow-hidden", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Live Preview" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-red-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-sm text-gray-600", children: "LIVE" })] })] }), _jsx("div", { className: "aspect-video bg-gray-900", children: _jsx("img", { src: config.streamUrl || `https://picsum.photos/1280/720?random=${Date.now()}`, alt: "Live camera feed", className: "w-full h-full object-cover" }) })] }));
}
function SnapshotsGallery({ snapshots }) {
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);
    if (snapshots.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCF8" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No Snapshots Yet" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "Capture snapshots to track crop progress over time" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Snapshots (", snapshots.length, ")"] }), _jsx("button", { className: "text-sm text-primary-600 hover:text-primary-700 font-medium", children: "View All" })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: snapshots.map(snapshot => (_jsxs("button", { onClick: () => setSelectedSnapshot(snapshot), className: "group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-all", children: [_jsx("img", { src: snapshot.url, alt: "Snapshot", className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" }), _jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent", children: _jsx("p", { className: "text-xs text-white font-medium", children: formatSnapshotTime(snapshot.timestamp) }) })] }, snapshot.id))) })] }), selectedSnapshot && (_jsx(SnapshotLightbox, { snapshot: selectedSnapshot, onClose: () => setSelectedSnapshot(null) }))] }));
}
function SnapshotLightbox({ snapshot, onClose }) {
    return (_jsxs("div", { className: "fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-white hover:text-gray-300 transition-colors", children: _jsx("svg", { className: "w-8 h-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }), _jsxs("div", { className: "max-w-5xl w-full", children: [_jsx("img", { src: snapshot.url, alt: "Snapshot", className: "w-full rounded-lg shadow-2xl" }), _jsxs("div", { className: "mt-4 text-center text-white", children: [_jsx("p", { className: "text-lg font-medium", children: new Date(snapshot.timestamp.seconds * 1000).toLocaleString() }), _jsxs("p", { className: "text-sm text-gray-400 capitalize", children: [snapshot.type, " Snapshot"] })] })] })] }));
}
function NoCameraState({ moduleId }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCF7" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No Camera Configured" }), _jsx("p", { className: "text-gray-500 mb-6 max-w-md mx-auto", children: "Connect a camera to your Raspberry Pi module to monitor crop growth and capture snapshots." }), _jsx("button", { disabled: true, className: "btn-primary opacity-50 cursor-not-allowed", children: "Setup Camera (Coming Soon)" })] }));
}
function CameraSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "w-48 h-8 bg-gray-200 rounded animate-pulse" }), _jsx("div", { className: "grid grid-cols-3 gap-6", children: [1, 2, 3].map(i => (_jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: _jsx("div", { className: "w-full h-24 bg-gray-200 rounded animate-pulse" }) }, i))) }), _jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: _jsx("div", { className: "w-full aspect-video bg-gray-200 rounded animate-pulse" }) })] }));
}
// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatSnapshotTime(timestamp) {
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    if (diffDays < 7)
        return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
