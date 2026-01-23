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
import type { Customer } from '../types';

const COLLECTION_NAME = 'customers';

export const customerService = {
  // Get all customers for an organization
  async getOrganizationCustomers(organizationId: string): Promise<Customer[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        console.warn('Composite index missing for customers, using simple query');
        const q = query(
          collection(db, COLLECTION_NAME),
          where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(q);
        const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        return customers.sort((a, b) => a.name.localeCompare(b.name));
      }
      throw error;
    }
  },

  // Backwards compatibility: Get all customers for a user
  async getUserCustomers(userId: string): Promise<Customer[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
  },

  // Get customers by status
  async getCustomersByStatus(organizationId: string, status: Customer['status']): Promise<Customer[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('status', '==', status),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
  },

  // Get customers by type
  async getCustomersByType(organizationId: string, type: Customer['type']): Promise<Customer[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId),
      where('type', '==', type),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
  },

  // Get single customer
  async getCustomer(customerId: string): Promise<Customer | null> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Customer;
    }
    return null;
  },

  // Create new customer
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...customerData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  },

  // Update customer
  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  // Delete customer
  async deleteCustomer(customerId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    await deleteDoc(docRef);
  },

  // Get active customers count
  async getActiveCustomersCount(organizationId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        console.warn('Composite index missing for active customers count, using simple query');
        const q = query(
          collection(db, COLLECTION_NAME),
          where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.filter(doc => doc.data().status === 'active').length;
      }
      throw error;
    }
  },

  // Search customers by name
  async searchCustomers(organizationId: string, searchTerm: string): Promise<Customer[]> {
    const customers = await this.getOrganizationCustomers(organizationId);
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
};
