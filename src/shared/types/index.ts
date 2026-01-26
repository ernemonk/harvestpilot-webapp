import type { Timestamp } from 'firebase/firestore';

// Organization & Role Management
export const Role = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface Organization {
  id: string;
  name: string; // e.g., "Green Valley Farm"
  type: 'farm' | 'collective' | 'cooperative';
  ownerId: string; // User ID of the owner
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    timezone: string;
    defaultUnits: 'imperial' | 'metric';
    fiscalYearStart: string; // "01-01" or "07-01"
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'trial' | 'expired';
    expiresAt?: Timestamp;
  };
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string; // Reference to User
  userEmail: string;
  userName: string;
  role: Role;
  permissions?: string[]; // Custom permissions if needed
  invitedBy: string; // User ID who invited them
  joinedAt: Timestamp;
  status: 'active' | 'invited' | 'suspended';
  inviteToken?: string; // For pending invitations
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  defaultOrganizationId?: string; // Last active organization
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Field {
  id: string;
  name: string; // e.g., "Field A", "North Plot"
  size: number; // in square feet or acres
  sizeUnit: 'sqft' | 'acres';
  soilType?: string;
  sunExposure?: 'full-sun' | 'partial-sun' | 'shade';
  irrigationType?: 'drip' | 'sprinkler' | 'manual' | 'none';
  organizationId: string; // Organization this field belongs to
  userId: string; // Deprecated: kept for backwards compatibility
  createdBy: string; // User who created this field
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  sections: Section[];
}

export interface Section {
  id: string;
  name: string; // e.g., "Section 1", "North-East Corner"
  size: number; // in square feet
  currentCropId?: string; // What's currently planted here
  lastCropId?: string; // For rotation tracking
  status: 'available' | 'planted' | 'fallow' | 'preparing';
  notes?: string;
}

export interface Crop {
  id: string;
  name: string;
  variety: string;
  fieldId: string; // Reference to Field
  fieldName: string; // Denormalized for display
  sectionId: string; // Reference to Section within Field
  sectionName: string; // Denormalized for display
  plantedDate: Timestamp;
  harvestReadyDate: Timestamp;
  status: 'planning' | 'planted' | 'growing' | 'ready' | 'harvested' | 'completed';
  organizationId: string; // Organization this crop belongs to
  userId: string; // Deprecated: kept for backwards compatibility
  createdBy: string; // User who created this crop
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  area?: number; // in square feet
  expectedYield?: number; // in pounds
}

export interface Harvest {
  id: string;
  cropId: string;
  cropName: string;
  variety: string;
  quantity: number; // in pounds
  unit: 'lbs' | 'kg' | 'oz';
  harvestDate: Timestamp;
  fieldId: string; // Reference to Field
  fieldName: string; // Denormalized
  sectionId: string; // Reference to Section
  sectionName: string; // Denormalized
  quality: 'premium' | 'standard' | 'below-standard';
  organizationId: string; // Organization this harvest belongs to
  userId: string; // Deprecated: kept for backwards compatibility
  createdBy: string; // User who logged this harvest
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  price?: number; // price per unit
}

export interface Customer {
  id: string;
  name: string;
  type: 'restaurant' | 'farmers-market' | 'grocery' | 'asian-market' | 'wholesale' | 'individual';
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  status: 'active' | 'inactive' | 'prospect';
  organizationId: string; // Organization this customer belongs to
  userId: string; // Deprecated: kept for backwards compatibility
  createdBy: string; // User who created this customer
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  preferredProducts?: string[];
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: Timestamp;
  deliveryDate?: Timestamp;
  status: 'pending' | 'confirmed' | 'packed' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  total: number;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export interface OrderItem {
  harvestId?: string;
  productName: string;
  variety?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface DashboardStats {
  activeCrops: number;
  recentHarvests: number;
  monthlyRevenue: number;
  revenueChange: number;
  activeCustomers: number;
}

export interface CropResearch {
  id: string;
  name: string;
  category: string; // e.g., "Specialty Greens", "Mushrooms", "Berries"
  startupCostPerAcre: string; // e.g., "$2,000-$5,000"
  annualRevenuePerAcre: string;
  profitMargin: string; // e.g., "40-60%"
  growingTime: string; // e.g., "7-21 days"
  laborIntensity: 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High' | 'Very High';
  bayAreaSuitability: number; // 1-5 star rating
  marketDemand: 'Low' | 'Medium' | 'Medium-High' | 'High' | 'Very High';
  waterNeeds: 'Very Low' | 'Low' | 'Medium' | 'Medium-High' | 'High';
  soilType: string;
  commonPests: string;
  commonDiseases: string;
  nutrientRequirements: string;
  pricePerPound: string;
  harvestFrequency: string;
  notes: string;
  organizationId: string; // Organization this research belongs to
  userId: string; // Deprecated: kept for backwards compatibility
  createdBy: string; // User who created this research
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
