/**
 * useFarmModule - Fetch and subscribe to farm module data
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FarmModule } from '../types/farmModule';

interface UseFarmModuleResult {
  module: FarmModule | null;
  loading: boolean;
  error: Error | null;
}

export function useFarmModule(moduleId: string | undefined): UseFarmModuleResult {
  const [module, setModule] = useState<FarmModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!moduleId) {
      setLoading(false);
      return;
    }

    // Subscribe to device document (farm modules map to devices)
    const deviceRef = doc(db, 'devices', moduleId);
    
    const unsubscribe = onSnapshot(
      deviceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Convert Firestore Timestamps to milliseconds for consistency
          const convertedData: any = {
            ...data,
            lastHeartbeat: data.lastHeartbeat?.toMillis?.() ?? data.lastHeartbeat ?? Date.now(),
            lastSyncAt: data.lastSyncAt?.toMillis?.() ?? data.lastSyncAt ?? null,
          };
          setModule({ id: snapshot.id, ...convertedData } as FarmModule);
        } else {
          setModule(null);
          setError(new Error('Module not found'));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Module subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [moduleId]);

  return { module, loading, error };
}

// TODO: Add API integration when backend endpoints are ready
// For now, using Firestore directly. Future: REST API or Firebase Functions
