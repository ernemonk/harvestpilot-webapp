import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
// Helper function to check if role is in a list
const hasRole = (userRole, roles) => {
    if (!userRole)
        return false;
    return roles.includes(userRole);
};
export function usePermissions() {
    const { userRole } = useAuth();
    const canEdit = () => {
        return hasRole(userRole, [Role.OWNER, Role.ADMIN, Role.MEMBER]);
    };
    const canManageTeam = () => {
        return hasRole(userRole, [Role.OWNER, Role.ADMIN]);
    };
    const canDelete = () => {
        return hasRole(userRole, [Role.OWNER, Role.ADMIN]);
    };
    const canManageOrganization = () => {
        if (!userRole)
            return false;
        return userRole === Role.OWNER;
    };
    const canViewFinancials = () => {
        return hasRole(userRole, [Role.OWNER, Role.ADMIN, Role.VIEWER]);
    };
    const isViewer = () => {
        return userRole === Role.VIEWER;
    };
    const isOwner = () => {
        return userRole === Role.OWNER;
    };
    const isAdmin = () => {
        return userRole === Role.ADMIN;
    };
    const isMember = () => {
        return userRole === Role.MEMBER;
    };
    const getRoleName = (role) => {
        const roleNames = {
            [Role.OWNER]: 'Owner',
            [Role.ADMIN]: 'Admin',
            [Role.MEMBER]: 'Member',
            [Role.VIEWER]: 'Viewer'
        };
        return roleNames[role];
    };
    const getRoleBadgeColor = (role) => {
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
