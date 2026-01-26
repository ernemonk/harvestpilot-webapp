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
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Organization, OrganizationMember, Role } from '../types';

const ORG_COLLECTION = 'organizations';
const MEMBER_COLLECTION = 'organization_members';

export const organizationService = {
  // Create a new organization (called during signup)
  async createOrganization(
    name: string,
    ownerId: string,
    ownerEmail: string,
    ownerName: string
  ): Promise<Organization> {
    const orgData: Omit<Organization, 'id'> = {
      name,
      type: 'farm',
      ownerId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      settings: {
        timezone: 'America/Los_Angeles',
        defaultUnits: 'imperial',
        fiscalYearStart: '01-01'
      },
      subscription: {
        plan: 'free',
        status: 'active'
      }
    };

    const orgRef = await addDoc(collection(db, ORG_COLLECTION), orgData);
    await this.addMember(orgRef.id, ownerId, ownerEmail, ownerName, 'owner' as Role, ownerId);

    return { id: orgRef.id, ...orgData };
  },

  // Get organization by ID
  async getOrganization(orgId: string): Promise<Organization | null> {
    const docRef = doc(db, ORG_COLLECTION, orgId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Organization;
    }
    return null;
  },

  // Update organization
  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    const docRef = doc(db, ORG_COLLECTION, orgId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  // Get all organizations a user is a member of
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    console.log('[OrgService] Getting organizations for user:', userId);
    const memberQuery = query(
      collection(db, MEMBER_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const memberSnap = await getDocs(memberQuery);
    console.log('[OrgService] Found member records:', memberSnap.docs.length);
    
    const organizations: Organization[] = [];
    for (const memberDoc of memberSnap.docs) {
      const member = memberDoc.data() as OrganizationMember;
      console.log('[OrgService] Loading org:', member.organizationId);
      const org = await this.getOrganization(member.organizationId);
      if (org) {
        organizations.push(org);
      }
    }
    
    console.log('[OrgService] Returning organizations:', organizations.length);
    return organizations;
  },

  // Add a member to an organization
  async addMember(
    organizationId: string,
    userId: string,
    userEmail: string,
    userName: string,
    role: Role,
    invitedBy: string,
    status: 'active' | 'invited' = 'active'
  ): Promise<void> {
    const memberId = `${userId}_${organizationId}`;
    const memberData: Omit<OrganizationMember, 'id'> = {
      organizationId,
      userId,
      userEmail,
      userName,
      role,
      invitedBy,
      joinedAt: Timestamp.now(),
      status
    };

    await setDoc(doc(db, MEMBER_COLLECTION, memberId), memberData);
  },

  // Get all members of an organization
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const q = query(
      collection(db, MEMBER_COLLECTION),
      where('organizationId', '==', organizationId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrganizationMember));
  },

  // Get a specific member
  async getMember(userId: string, organizationId: string): Promise<OrganizationMember | null> {
    const memberId = `${userId}_${organizationId}`;
    const docRef = doc(db, MEMBER_COLLECTION, memberId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as OrganizationMember;
    }
    return null;
  },

  // Update member role
  async updateMemberRole(userId: string, organizationId: string, newRole: Role): Promise<void> {
    const memberId = `${userId}_${organizationId}`;
    const docRef = doc(db, MEMBER_COLLECTION, memberId);
    await updateDoc(docRef, { role: newRole });
  },

  // Remove a member from an organization
  async removeMember(userId: string, organizationId: string): Promise<void> {
    const memberId = `${userId}_${organizationId}`;
    await deleteDoc(doc(db, MEMBER_COLLECTION, memberId));
  },

  // Invite a new member (creates record, returns token for manual link sharing)
  async inviteMember(
    organizationId: string,
    email: string,
    role: Role,
    invitedBy: string
  ): Promise<string> {
    const inviteToken = crypto.randomUUID();
    const tempUserId = `pending_${inviteToken}`;
    const memberId = `${tempUserId}_${organizationId}`;
    
    const memberData: Omit<OrganizationMember, 'id'> = {
      organizationId,
      userId: tempUserId,
      userEmail: email,
      userName: email,
      role,
      invitedBy,
      joinedAt: Timestamp.now(),
      status: 'invited',
      inviteToken
    };

    await setDoc(doc(db, MEMBER_COLLECTION, memberId), memberData);
    return inviteToken;
  },

  // Accept invitation (convert pending member to active)
  async acceptInvitation(inviteToken: string, userId: string, userName: string): Promise<string | null> {
    const q = query(
      collection(db, MEMBER_COLLECTION),
      where('inviteToken', '==', inviteToken),
      where('status', '==', 'invited')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null; // Invalid or expired token
    }

    const inviteDoc = snapshot.docs[0];
    const inviteData = inviteDoc.data() as OrganizationMember;
    
    // Delete the pending invite
    await deleteDoc(inviteDoc.ref);
    
    // Create active membership
    await this.addMember(
      inviteData.organizationId,
      userId,
      inviteData.userEmail,
      userName,
      inviteData.role,
      inviteData.invitedBy,
      'active'
    );

    return inviteData.organizationId;
  }
};
