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

    // Subscribe to module document
    const moduleRef = doc(db, 'modules', moduleId);
    
    const unsubscribe = onSnapshot(
      moduleRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setModule({ id: snapshot.id, ...snapshot.data() } as FarmModule);
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
