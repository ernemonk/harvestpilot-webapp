import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
const COLLECTION_NAME = 'cropResearch';
export const cropResearchService = {
    // Get all crop research data (shared across all users)
    async getOrganizationCropResearch(_organizationId, _userId) {
        try {
            // Fetch ALL crop research data - it's a shared database
            const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            // Fallback without orderBy if index is missing
            if (error.code === 'failed-precondition') {
                console.log('[CropResearch] Fetching all data without ordering...');
                const snapshot = await getDocs(collection(db, COLLECTION_NAME));
                const results = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                return results.sort((a, b) => a.name.localeCompare(b.name));
            }
            console.error('[CropResearch] Error fetching data:', error);
            throw error;
        }
    },
    // Backwards compatibility: Get all crop research data for a user
    async getUserCropResearch(userId) {
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },
    // Get crop research filtered by category
    async getCropResearchByCategory(organizationId, category) {
        const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId), where('category', '==', category), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },
    // Get single crop research by ID
    async getCropResearch(cropResearchId) {
        const docRef = doc(db, COLLECTION_NAME, cropResearchId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        return null;
    },
    // Create new crop research entry
    async createCropResearch(cropResearchData) {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...cropResearchData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },
    // Update crop research
    async updateCropResearch(cropResearchId, updates) {
        const docRef = doc(db, COLLECTION_NAME, cropResearchId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
    },
    // Delete crop research
    async deleteCropResearch(cropResearchId) {
        const docRef = doc(db, COLLECTION_NAME, cropResearchId);
        await deleteDoc(docRef);
    },
    // Get unique categories
    async getCategories(organizationId) {
        const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId));
        const querySnapshot = await getDocs(q);
        const categories = new Set();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.category) {
                categories.add(data.category);
            }
        });
        return Array.from(categories).sort();
    },
    // Search crop research by name or category
    async searchCropResearch(organizationId, searchTerm) {
        const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const allCrops = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Client-side filtering for name and category
        const searchLower = searchTerm.toLowerCase();
        return allCrops.filter(crop => crop.name.toLowerCase().includes(searchLower) ||
            crop.category.toLowerCase().includes(searchLower));
    }
};
