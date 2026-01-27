import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
const COLLECTION_NAME = 'fields';
export const fieldService = {
    // Get all fields for an organization
    async getOrganizationFields(organizationId) {
        try {
            const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            if (error.code === 'failed-precondition') {
                console.warn('Composite index missing for fields, using simple query');
                const q = query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId));
                const snapshot = await getDocs(q);
                const fields = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return fields.sort((a, b) => a.name.localeCompare(b.name));
            }
            throw error;
        }
    },
    // Backwards compatibility: Get all fields for a user
    async getUserFields(userId) {
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    // Get single field
    async getField(fieldId) {
        const docRef = doc(db, COLLECTION_NAME, fieldId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },
    // Create new field
    async createField(fieldData) {
        const now = Timestamp.now();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...fieldData,
            createdAt: now,
            updatedAt: now
        });
        return docRef.id;
    },
    // Update field
    async updateField(fieldId, updates) {
        const docRef = doc(db, COLLECTION_NAME, fieldId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
    },
    // Delete field
    async deleteField(fieldId) {
        const docRef = doc(db, COLLECTION_NAME, fieldId);
        await deleteDoc(docRef);
    },
    // Add section to field
    async addSection(fieldId, section) {
        const field = await this.getField(fieldId);
        if (!field)
            throw new Error('Field not found');
        const updatedSections = [...field.sections, section];
        await this.updateField(fieldId, { sections: updatedSections });
    },
    // Update section in field
    async updateSection(fieldId, sectionId, updates) {
        const field = await this.getField(fieldId);
        if (!field)
            throw new Error('Field not found');
        const updatedSections = field.sections.map(section => section.id === sectionId ? { ...section, ...updates } : section);
        await this.updateField(fieldId, { sections: updatedSections });
    },
    // Remove section from field
    async removeSection(fieldId, sectionId) {
        const field = await this.getField(fieldId);
        if (!field)
            throw new Error('Field not found');
        const updatedSections = field.sections.filter(section => section.id !== sectionId);
        await this.updateField(fieldId, { sections: updatedSections });
    },
    // Get available sections (not currently planted)
    async getAvailableSections(organizationId) {
        const fields = await this.getOrganizationFields(organizationId);
        const available = [];
        fields.forEach(field => {
            field.sections.forEach(section => {
                if (section.status === 'available' || section.status === 'preparing') {
                    available.push({ field, section });
                }
            });
        });
        return available;
    },
    // Get sections by field
    getSections(field) {
        return field.sections;
    },
    // Find section by ID across all fields
    async findSection(organizationId, sectionId) {
        const fields = await this.getOrganizationFields(organizationId);
        for (const field of fields) {
            const section = field.sections.find(s => s.id === sectionId);
            if (section) {
                return { field, section };
            }
        }
        return null;
    },
    // Mark section as planted
    async markSectionPlanted(fieldId, sectionId, cropId) {
        await this.updateSection(fieldId, sectionId, {
            status: 'planted',
            currentCropId: cropId
        });
    },
    // Mark section as available (after harvest)
    async markSectionAvailable(fieldId, sectionId, lastCropId) {
        await this.updateSection(fieldId, sectionId, {
            status: 'available',
            currentCropId: undefined,
            lastCropId: lastCropId
        });
    }
};
