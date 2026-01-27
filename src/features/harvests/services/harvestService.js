import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
const COLLECTION_NAME = 'harvests';
export const harvestService = {
    // Get all harvests for an organization
    async getOrganizationHarvests(organizationId) {
        try {
            const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId), orderBy('harvestDate', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            if (error.code === 'failed-precondition') {
                console.warn('Composite index missing for harvests, using simple query');
                const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId));
                const snapshot = await getDocs(q);
                const harvests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return harvests.sort((a, b) => {
                    const dateA = a.harvestDate?.toMillis?.() || 0;
                    const dateB = b.harvestDate?.toMillis?.() || 0;
                    return dateB - dateA;
                });
            }
            throw error;
        }
    },
    // Backwards compatibility: Get all harvests for a user
    async getUserHarvests(userId) {
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId), orderBy('harvestDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    // Get harvests for a specific date range
    async getHarvestsByDateRange(organizationId, startDate, endDate) {
        try {
            const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId), where('harvestDate', '>=', startDate), where('harvestDate', '<=', endDate), orderBy('harvestDate', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            if (error.code === 'failed-precondition') {
                console.warn('Composite index missing for harvest date range, using simple query');
                const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId));
                const snapshot = await getDocs(q);
                const harvests = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(h => {
                    const date = h.harvestDate?.toMillis?.() || 0;
                    return date >= startDate.toMillis() && date <= endDate.toMillis();
                });
                return harvests.sort((a, b) => {
                    const dateA = a.harvestDate?.toMillis?.() || 0;
                    const dateB = b.harvestDate?.toMillis?.() || 0;
                    return dateB - dateA;
                });
            }
            throw error;
        }
    },
    // Get recent harvests
    async getRecentHarvests(organizationId, limitCount = 10) {
        try {
            const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId), orderBy('harvestDate', 'desc'), limit(limitCount));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            if (error.code === 'failed-precondition') {
                console.warn('Composite index missing for recent harvests, using simple query');
                const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId));
                const snapshot = await getDocs(q);
                const harvests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return harvests
                    .sort((a, b) => {
                    const dateA = a.harvestDate?.toMillis?.() || 0;
                    const dateB = b.harvestDate?.toMillis?.() || 0;
                    return dateB - dateA;
                })
                    .slice(0, limitCount);
            }
            throw error;
        }
    },
    // Get harvests for a specific crop
    async getHarvestsByCrop(organizationId, cropId) {
        const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId), where('cropId', '==', cropId), orderBy('harvestDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    // Get single harvest
    async getHarvest(harvestId) {
        const docRef = doc(db, COLLECTION_NAME, harvestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },
    // Create new harvest
    async createHarvest(harvestData) {
        const now = Timestamp.now();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...harvestData,
            createdAt: now,
            updatedAt: now
        });
        return docRef.id;
    },
    // Update harvest
    async updateHarvest(harvestId, updates) {
        const docRef = doc(db, COLLECTION_NAME, harvestId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
    },
    // Delete harvest
    async deleteHarvest(harvestId) {
        const docRef = doc(db, COLLECTION_NAME, harvestId);
        await deleteDoc(docRef);
    },
    // Get total harvest quantity for current month
    async getMonthlyHarvestTotal(organizationId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const harvests = await this.getHarvestsByDateRange(organizationId, Timestamp.fromDate(startOfMonth), Timestamp.fromDate(endOfMonth));
        return harvests.reduce((total, harvest) => total + harvest.quantity, 0);
    },
    // Get harvest count for current month
    async getMonthlyHarvestCount(organizationId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const harvests = await this.getHarvestsByDateRange(organizationId, Timestamp.fromDate(startOfMonth), Timestamp.fromDate(endOfMonth));
        return harvests.length;
    }
};
