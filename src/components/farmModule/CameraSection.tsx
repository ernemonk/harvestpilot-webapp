/**
 * Camera Section
 * 
 * View camera feeds, snapshots, and timelapse from farm module.
 * Features: Live preview, snapshot capture, timelapse gallery.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { CameraConfig } from '../../types/farmModule';

interface CameraSectionProps {
  moduleId: string;
}

interface Snapshot {
  id?: string;
  moduleId: string;
  url: string;
  timestamp: Timestamp;
  type: 'manual' | 'timelapse' | 'alert';
}

export default function CameraSection({ moduleId }: CameraSectionProps) {
  const [cameraConfig, setCameraConfig] = useState<CameraConfig | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);

  // Subscribe to camera config
  useEffect(() => {
    const configRef = collection(db, 'camera_configs');
    const q = query(configRef, where('moduleId', '==', moduleId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setCameraConfig({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CameraConfig);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [moduleId]);

  // Subscribe to snapshots
  useEffect(() => {
    const snapshotsRef = collection(db, 'camera_snapshots');
    const q = query(
      snapshotsRef,
      where('moduleId', '==', moduleId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Snapshot));
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
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
    } finally {
      setTimeout(() => setCapturing(false), 1000);
    }
  };

  if (loading) {
    return <CameraSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Camera</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your crops with live camera feed
          </p>
        </div>
      </div>

      {cameraConfig ? (
        <>
          {/* Camera Status & Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CameraStatus config={cameraConfig} />
            <CameraControls
              config={cameraConfig}
              onCapture={handleCaptureSnapshot}
              capturing={capturing}
            />
          </div>

          {/* Live Preview */}
          <LivePreview config={cameraConfig} />

          {/* Snapshots Gallery */}
          <SnapshotsGallery snapshots={snapshots} />
        </>
      ) : (
        <NoCameraState moduleId={moduleId} />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CameraStatus({ config }: { config: CameraConfig }) {
  const isOnline = config.enabled && config.streamUrl;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
        <h3 className="text-lg font-semibold text-gray-900">Camera Status</h3>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status</span>
          <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Resolution</span>
          <span className="font-medium text-gray-900">{config.resolution || '1920x1080'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Frame Rate</span>
          <span className="font-medium text-gray-900">{config.frameRate || 30} fps</span>
        </div>
      </div>
    </div>
  );
}

function CameraControls({ config, onCapture, capturing }: any) {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onCapture}
          disabled={!config.enabled || capturing}
          className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {capturing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Capturing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Capture Snapshot</span>
            </>
          )}
        </button>
        <button
          disabled
          className="btn-secondary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Start Timelapse</span>
        </button>
        <button
          disabled
          className="btn-secondary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Camera Settings</span>
        </button>
        <button
          disabled
          className="btn-secondary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download All</span>
        </button>
      </div>
    </div>
  );
}

function LivePreview({ config }: { config: CameraConfig }) {
  if (!config.streamUrl) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        </div>
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg font-medium mb-2">Camera Stream Not Available</p>
            <p className="text-sm text-gray-400">
              Configure camera settings to enable live preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">LIVE</span>
        </div>
      </div>
      <div className="aspect-video bg-gray-900">
        <img
          src={config.streamUrl || `https://picsum.photos/1280/720?random=${Date.now()}`}
          alt="Live camera feed"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

function SnapshotsGallery({ snapshots }: { snapshots: Snapshot[] }) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Snapshots Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Capture snapshots to track crop progress over time
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Snapshots ({snapshots.length})
          </h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {snapshots.map(snapshot => (
            <button
              key={snapshot.id}
              onClick={() => setSelectedSnapshot(snapshot)}
              className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-all"
            >
              <img
                src={snapshot.url}
                alt="Snapshot"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-xs text-white font-medium">
                  {formatSnapshotTime(snapshot.timestamp)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedSnapshot && (
        <SnapshotLightbox
          snapshot={selectedSnapshot}
          onClose={() => setSelectedSnapshot(null)}
        />
      )}
    </>
  );
}

function SnapshotLightbox({ snapshot, onClose }: { snapshot: Snapshot; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="max-w-5xl w-full">
        <img
          src={snapshot.url}
          alt="Snapshot"
          className="w-full rounded-lg shadow-2xl"
        />
        <div className="mt-4 text-center text-white">
          <p className="text-lg font-medium">
            {new Date((snapshot.timestamp as any).seconds * 1000).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 capitalize">{snapshot.type} Snapshot</p>
        </div>
      </div>
    </div>
  );
}

function NoCameraState({ moduleId }: { moduleId: string }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="text-6xl mb-4">📷</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Camera Configured</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Connect a camera to your Raspberry Pi module to monitor crop growth and capture snapshots.
      </p>
      <button disabled className="btn-primary opacity-50 cursor-not-allowed">
        Setup Camera (Coming Soon)
      </button>
    </div>
  );
}

function CameraSkeleton() {
  return (
    <div className="space-y-6">
      <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-full h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-full aspect-video bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatSnapshotTime(timestamp: any): string {
  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
