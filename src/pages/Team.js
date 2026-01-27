import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { organizationService } from '../services/organizationService';
import Card from '../components/ui/Card';
import ErrorMessage from '../components/ui/ErrorMessage';
import { Role as RoleEnum } from '../types';
export default function Team() {
    const { currentOrganization, currentUser, refreshOrganization } = useAuth();
    const { canManageTeam, isOwner, getRoleName, getRoleBadgeColor } = usePermissions();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState(RoleEnum.MEMBER);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    useEffect(() => {
        loadMembers();
    }, [currentOrganization]);
    async function loadMembers() {
        if (!currentOrganization)
            return;
        try {
            setLoading(true);
            const orgMembers = await organizationService.getOrganizationMembers(currentOrganization.id);
            setMembers(orgMembers);
        }
        catch (err) {
            setError(err.message || 'Failed to load team members');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleInvite(e) {
        e.preventDefault();
        if (!currentOrganization || !currentUser)
            return;
        try {
            setInviteLoading(true);
            setError('');
            setInviteSuccess('');
            setInviteLink('');
            setLinkCopied(false);
            const token = await organizationService.inviteMember(currentOrganization.id, inviteEmail, inviteRole, currentUser.uid);
            const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
            const link = `${appUrl}/accept-invite?token=${token}`;
            setInviteLink(link);
            setInviteSuccess(`Invite created for ${inviteEmail}`);
            setInviteEmail('');
            setInviteRole(RoleEnum.MEMBER);
            await loadMembers();
        }
        catch (err) {
            setError(err.message || 'Failed to create invitation');
        }
        finally {
            setInviteLoading(false);
        }
    }
    async function copyInviteLink() {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
        }
        catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = inviteLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
        }
    }
    async function handleRoleChange(member, newRole) {
        if (!currentOrganization)
            return;
        try {
            await organizationService.updateMemberRole(member.userId, currentOrganization.id, newRole);
            await loadMembers();
            await refreshOrganization();
        }
        catch (err) {
            setError(err.message || 'Failed to update role');
        }
    }
    async function handleRemoveMember(member) {
        if (!currentOrganization)
            return;
        if (!confirm(`Remove ${member.userName} from the team?`))
            return;
        try {
            await organizationService.removeMember(member.userId, currentOrganization.id);
            await loadMembers();
        }
        catch (err) {
            setError(err.message || 'Failed to remove member');
        }
    }
    if (!canManageTeam()) {
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsx(Card, { children: _jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-500", children: "You don't have permission to manage the team." }) }) }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Team Management" }), _jsxs("p", { className: "mt-2 text-gray-600", children: ["Manage your ", currentOrganization?.name, " team members and their roles"] })] }), error && _jsx(ErrorMessage, { message: error, onClose: () => setError('') }), inviteLink && (_jsx("div", { className: "mb-4 bg-green-50 border border-green-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "text-green-800 font-medium mb-2", children: ["\u2705 ", inviteSuccess] }), _jsxs("p", { className: "text-sm text-gray-700 mb-3", children: [_jsx("strong", { children: "Send this link" }), " to them via text, email, or however you like. When they click it and sign up, they'll automatically join your team."] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "text", readOnly: true, value: inviteLink, className: "flex-1 text-sm bg-white border border-green-300 rounded px-3 py-2 text-gray-700" }), _jsx("button", { onClick: copyInviteLink, className: `px-4 py-2 rounded font-medium transition-colors ${linkCopied
                                                ? 'bg-green-600 text-white'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'}`, children: linkCopied ? '✓ Copied!' : 'Copy Link' })] })] }), _jsx("button", { onClick: () => { setInviteLink(''); setInviteSuccess(''); }, className: "text-green-800 hover:text-green-900 ml-4", children: "\u2715" })] }) })), _jsxs(Card, { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Invite Team Member" }), _jsxs("form", { onSubmit: handleInvite, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email Address" }), _jsx("input", { type: "email", id: "email", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), className: "input", placeholder: "farmer@example.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "role", className: "block text-sm font-medium text-gray-700 mb-1", children: "Role" }), _jsxs("select", { id: "role", value: inviteRole, onChange: (e) => setInviteRole(e.target.value), className: "input", children: [_jsx("option", { value: RoleEnum.MEMBER, children: "Member" }), _jsx("option", { value: RoleEnum.ADMIN, children: "Admin" }), _jsx("option", { value: RoleEnum.VIEWER, children: "Viewer" }), isOwner() && _jsx("option", { value: RoleEnum.OWNER, children: "Owner" })] })] })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: inviteLoading, className: "btn-primary disabled:opacity-50", children: inviteLoading ? 'Creating...' : 'Generate Invite Link' }) })] })] }), _jsxs(Card, { children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: ["Team Members (", members.filter(m => m.status === 'active').length, ")"] }), loading ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "Loading team members..." })) : members.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No team members yet" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Member" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Joined" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: members.map((member) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-primary-700 font-semibold", children: member.userName.charAt(0).toUpperCase() }) }), _jsx("div", { className: "ml-4", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: member.userName }) })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-500", children: member.userEmail }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: isOwner() && member.userId !== currentUser?.uid ? (_jsxs("select", { value: member.role, onChange: (e) => handleRoleChange(member, e.target.value), className: `text-xs px-2 py-1 rounded-full font-semibold ${getRoleBadgeColor(member.role)}`, children: [_jsx("option", { value: RoleEnum.MEMBER, children: "Member" }), _jsx("option", { value: RoleEnum.ADMIN, children: "Admin" }), _jsx("option", { value: RoleEnum.VIEWER, children: "Viewer" }), _jsx("option", { value: RoleEnum.OWNER, children: "Owner" })] })) : (_jsx("span", { className: `inline-flex text-xs px-2 py-1 rounded-full font-semibold ${getRoleBadgeColor(member.role)}`, children: getRoleName(member.role) })) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex text-xs px-2 py-1 rounded-full font-semibold ${member.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        member.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'}`, children: member.status.charAt(0).toUpperCase() + member.status.slice(1) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: member.joinedAt?.toDate().toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: member.userId !== currentUser?.uid && member.role !== RoleEnum.OWNER && (_jsx("button", { onClick: () => handleRemoveMember(member), className: "text-red-600 hover:text-red-900", children: "Remove" })) })] }, member.id))) })] }) }))] }), _jsxs(Card, { className: "mt-8", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Role Descriptions" }), _jsxs("dl", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-medium text-gray-900", children: "\uD83D\uDC51 Owner" }), _jsx("dd", { className: "text-sm text-gray-600 mt-1", children: "Full control over the organization. Can manage all data, team members, and settings." })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-gray-900", children: "\u26A1 Admin" }), _jsx("dd", { className: "text-sm text-gray-600 mt-1", children: "Can manage farm data and invite team members. Cannot remove the owner or change organization settings." })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-gray-900", children: "\u270F\uFE0F Member" }), _jsx("dd", { className: "text-sm text-gray-600 mt-1", children: "Can create, edit, and delete crops, harvests, customers, and fields. Cannot manage team members." })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-gray-900", children: "\uD83D\uDC41\uFE0F Viewer" }), _jsx("dd", { className: "text-sm text-gray-600 mt-1", children: "Read-only access to all farm data. Cannot make any changes. Ideal for consultants, accountants, or clients." })] })] })] })] }));
}
