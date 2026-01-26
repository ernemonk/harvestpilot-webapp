import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { organizationService } from '../services/organizationService';
import type { Organization, OrganizationMember, Role } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  currentOrganization: Organization | null;
  allOrganizations: Organization[];
  userMembership: OrganizationMember | null;
  userRole: Role | null;
  signup: (email: string, password: string, displayName: string, organizationName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshOrganization: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [userMembership, setUserMembership] = useState<OrganizationMember | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserOrganization = useCallback(async (userId: string, userEmail?: string | null, userName?: string | null) => {
    try {
      console.log('[Auth] Loading organizations for user:', userId);
      let orgs = await organizationService.getUserOrganizations(userId);
      console.log('[Auth] Found organizations:', orgs.length, orgs);
      
      // If no organizations found, auto-create one for the user
      if (orgs.length === 0 && userEmail) {
        console.log('[Auth] No organization found, auto-creating one...');
        try {
          const defaultOrgName = userName ? `${userName}'s Farm` : 'My Farm';
          const newOrg = await organizationService.createOrganization(
            defaultOrgName,
            userId,
            userEmail,
            userName || userEmail.split('@')[0]
          );
          console.log('[Auth] Created new organization:', newOrg.name);
          orgs = [newOrg];
        } catch (createError) {
          console.error('[Auth] Failed to auto-create organization:', createError);
        }
      }
      
      setAllOrganizations(orgs);
      
      if (orgs.length > 0) {
        // Check if there's a saved org preference
        const savedOrgId = localStorage.getItem('currentOrgId');
        const org = savedOrgId ? orgs.find(o => o.id === savedOrgId) || orgs[0] : orgs[0];
        console.log('[Auth] Setting current organization:', org.name);
        setCurrentOrganization(org);
        localStorage.setItem('currentOrgId', org.id);
        
        const membership = await organizationService.getMember(userId, org.id);
        setUserMembership(membership);
        setUserRole(membership?.role || null);
      } else {
        console.warn('[Auth] No organizations found for user - they may need to create one');
        setCurrentOrganization(null);
        setUserMembership(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('[Auth] Error loading organization:', error);
      // Still clear state on error so user isn't stuck
      setCurrentOrganization(null);
      setUserMembership(null);
      setUserRole(null);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string, organizationName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      const org = await organizationService.createOrganization(
        organizationName,
        userCredential.user.uid,
        email,
        displayName
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        defaultOrganizationId: org.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Load the organization data immediately after creating it
      console.log('[Auth] Signup complete, loading organization...');
      await loadUserOrganization(userCredential.user.uid);
    }
  }, [loadUserOrganization]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentOrganization(null);
    setAllOrganizations([]);
    setUserMembership(null);
    setUserRole(null);
    localStorage.removeItem('currentOrgId');
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const refreshOrganization = useCallback(async () => {
    if (currentUser) {
      await loadUserOrganization(currentUser.uid, currentUser.email, currentUser.displayName);
    }
  }, [currentUser, loadUserOrganization]);

  const switchOrganization = useCallback(async (orgId: string) => {
    if (!currentUser) return;
    
    const org = allOrganizations.find(o => o.id === orgId);
    if (!org) return;
    
    setCurrentOrganization(org);
    localStorage.setItem('currentOrgId', org.id);
    
    const membership = await organizationService.getMember(currentUser.uid, org.id);
    setUserMembership(membership);
    setUserRole(membership?.role || null);
  }, [currentUser, allOrganizations]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserOrganization(user.uid, user.email, user.displayName);
      } else {
        setCurrentOrganization(null);
        setUserMembership(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [loadUserOrganization]);

  const value = useMemo(() => ({
    currentUser,
    loading,
    currentOrganization,
    allOrganizations,
    userMembership,
    userRole,
    signup,
    login,
    logout,
    resetPassword,
    refreshOrganization,
    switchOrganization
  }), [currentUser, loading, currentOrganization, allOrganizations, userMembership, userRole, signup, login, logout, resetPassword, refreshOrganization, switchOrganization]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
