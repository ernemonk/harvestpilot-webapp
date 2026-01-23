import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

export function usePermissions() {
  const { userRole } = useAuth();

  const canEdit = (): boolean => {
    if (!userRole) return false;
    return [Role.OWNER, Role.ADMIN, Role.MEMBER].includes(userRole);
  };

  const canManageTeam = (): boolean => {
    if (!userRole) return false;
    return [Role.OWNER, Role.ADMIN].includes(userRole);
  };

  const canDelete = (): boolean => {
    if (!userRole) return false;
    return [Role.OWNER, Role.ADMIN].includes(userRole);
  };

  const canManageOrganization = (): boolean => {
    if (!userRole) return false;
    return userRole === Role.OWNER;
  };

  const canViewFinancials = (): boolean => {
    if (!userRole) return false;
    return [Role.OWNER, Role.ADMIN, Role.VIEWER].includes(userRole);
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
