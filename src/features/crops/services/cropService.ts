import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Crop } from '../types';

const COLLECTION_NAME = 'crops';

export const cropService = {
  // Get all crops for an organization
  async getOrganizationCrops(organizationId: string): Promise<Crop[]> {
    try {
      // Try with orderBy first (requires composite index)
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('plantedDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Crop));
    } catch (error: any) {
      // If index doesn't exist, fallback to simple query
      if (error.code === 'failed-precondition') {
        console.warn('Composite index missing for crops, using simple query');
        const q = query(
          collection(db, COLLECTION_NAME),
          where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(q);
        const crops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Crop));
        // Sort in memory
        return crops.sort((a, b) => {
          const dateA = a.plantedDate?.toMillis?.() || 0;
          const dateB = b.plantedDate?.toMillis?.() || 0;
          return dateB - dateA;
        });
      }
      throw error;
    }
  },

  // Backward compatibility: Get all crops for a user
  async getUserCrops(userId: string): Promise<Crop[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('plantedDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Crop));
  },

  // Get crops by status
  async getCropsByStatus(organizationId: string, status: Crop['status']): Promise<Crop[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('status', '==', status),
      orderBy('plantedDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Crop));
  },

  // Get single crop
  async getCrop(cropId: string): Promise<Crop | null> {
    const docRef = doc(db, COLLECTION_NAME, cropId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Crop;
    }
    return null;
  },

  // Create new crop
  async createCrop(cropData: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cropData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  },

  // Update crop
  async updateCrop(cropId: string, updates: Partial<Crop>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, cropId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  // Delete crop
  async deleteCrop(cropId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, cropId);
    await deleteDoc(docRef);
  },

  // Get active crops count
  async getActiveCropsCount(organizationId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('status', 'in', ['planted', 'growing', 'ready'])
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        console.warn('Composite index missing for active crops count, using simple query');
        const q = query(
          collection(db, COLLECTION_NAME),
          where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.filter(doc => {
          const status = doc.data().status;
          return ['planted', 'growing', 'ready'].includes(status);
        }).length;
      }
      throw error;
    }
  }
};
