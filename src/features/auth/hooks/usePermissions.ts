import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import type { Role as RoleType } from '../types';

// Helper function to check if role is in a list
const hasRole = (userRole: RoleType | null, roles: readonly RoleType[]): boolean => {
  if (!userRole) return false;
  return (roles as readonly string[]).includes(userRole);
};

export function usePermissions() {
  const { userRole } = useAuth();

  const canEdit = (): boolean => {
    return hasRole(userRole, [Role.OWNER, Role.ADMIN, Role.MEMBER]);
  };

  const canManageTeam = (): boolean => {
    return hasRole(userRole, [Role.OWNER, Role.ADMIN]);
  };

  const canDelete = (): boolean => {
    return hasRole(userRole, [Role.OWNER, Role.ADMIN]);
  };

  const canManageOrganization = (): boolean => {
    if (!userRole) return false;
    return userRole === Role.OWNER;
  };

  const canViewFinancials = (): boolean => {
    return hasRole(userRole, [Role.OWNER, Role.ADMIN, Role.VIEWER]);
  };

  const isViewer = (): boolean => {
    return userRole === Role.VIEWER;
  };

  const isOwner = (): boolean => {
    return userRole === Role.OWNER;
  };

  const isAdmin = (): boolean => {
    return userRole === Role.ADMIN;
  };

  const isMember = (): boolean => {
    return userRole === Role.MEMBER;
  };

  const getRoleName = (role: Role): string => {
    const roleNames = {
      [Role.OWNER]: 'Owner',
      [Role.ADMIN]: 'Admin',
      [Role.MEMBER]: 'Member',
      [Role.VIEWER]: 'Viewer'
    };
    return roleNames[role];
  };

  const getRoleBadgeColor = (role: Role): string => {
    const colors = {
      [Role.OWNER]: 'bg-purple-100 text-purple-800',
      [Role.ADMIN]: 'bg-blue-100 text-blue-800',
      [Role.MEMBER]: 'bg-green-100 text-green-800',
      [Role.VIEWER]: 'bg-gray-100 text-gray-800'
    };
    return colors[role];
  };

  return {
    userRole,
    canEdit,
    canManageTeam,
    canDelete,
    canManageOrganization,
    canViewFinancials,
    isViewer,
    isOwner,
    isAdmin,
    isMember,
    getRoleName,
    getRoleBadgeColor
  };
}
