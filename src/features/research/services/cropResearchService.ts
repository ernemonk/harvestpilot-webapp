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
import type { CropResearch } from '../types';

const COLLECTION_NAME = 'cropResearch';

export const cropResearchService = {
  // Get all crop research data (shared across all users)
  async getOrganizationCropResearch(_organizationId?: string, _userId?: string): Promise<CropResearch[]> {
    try {
      // Fetch ALL crop research data - it's a shared database
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CropResearch));
    } catch (error: any) {
      // Fallback without orderBy if index is missing
      if (error.code === 'failed-precondition') {
        console.log('[CropResearch] Fetching all data without ordering...');
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CropResearch));
        return results.sort((a, b) => a.name.localeCompare(b.name));
      }
      console.error('[CropResearch] Error fetching data:', error);
      throw error;
    }
  },

  // Backwards compatibility: Get all crop research data for a user
  async getUserCropResearch(userId: string): Promise<CropResearch[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CropResearch));
  },

  // Get crop research filtered by category
  async getCropResearchByCategory(organizationId: string, category: string): Promise<CropResearch[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('category', '==', category),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CropResearch));
  },

  // Get single crop research by ID
  async getCropResearch(cropResearchId: string): Promise<CropResearch | null> {
    const docRef = doc(db, COLLECTION_NAME, cropResearchId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as CropResearch;
    }
    return null;
  },

  // Create new crop research entry
  async createCropResearch(cropResearchData: Omit<CropResearch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cropResearchData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update crop research
  async updateCropResearch(cropResearchId: string, updates: Partial<CropResearch>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, cropResearchId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  // Delete crop research
  async deleteCropResearch(cropResearchId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, cropResearchId);
    await deleteDoc(docRef);
  },

  // Get unique categories
  async getCategories(organizationId: string): Promise<string[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    const categories = new Set<string>();
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    return Array.from(categories).sort();
  },

  // Search crop research by name or category
  async searchCropResearch(organizationId: string, searchTerm: string): Promise<CropResearch[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const allCrops = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CropResearch));
    
    // Client-side filtering for name and category
    const searchLower = searchTerm.toLowerCase();
    return allCrops.filter(crop => 
      crop.name.toLowerCase().includes(searchLower) ||
      crop.category.toLowerCase().includes(searchLower)
    );
  }
};
