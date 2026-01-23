import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { organizationService } from '../services/organizationService';
import type { OrganizationMember, Role } from '../types';
import Card from '../components/ui/Card';
import ErrorMessage from '../components/ui/ErrorMessage';
import { Role as RoleEnum } from '../types';

export default function Team() {
  const { currentOrganization, currentUser, refreshOrganization } = useAuth();
  const { canManageTeam, isOwner, getRoleName, getRoleBadgeColor } = usePermissions();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(RoleEnum.MEMBER);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [currentOrganization]);

  async function loadMembers() {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const orgMembers = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(orgMembers);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrganization || !currentUser) return;

    try {
      setInviteLoading(true);
      setError('');
      setInviteSuccess('');
      setInviteLink('');
      setLinkCopied(false);
      
      const token = await organizationService.inviteMember(
        currentOrganization.id,
        inviteEmail,
        inviteRole,
        currentUser.uid
      );
      
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const link = `${appUrl}/accept-invite?token=${token}`;
      
      setInviteLink(link);
      setInviteSuccess(`Invite created for ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole(RoleEnum.MEMBER);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to create invitation');
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
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

  async function handleRoleChange(member: OrganizationMember, newRole: Role) {
    if (!currentOrganization) return;
    
    try {
      await organizationService.updateMemberRole(member.userId, currentOrganization.id, newRole);
      await loadMembers();
      await refreshOrganization();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  }

  async function handleRemoveMember(member: OrganizationMember) {
    if (!currentOrganization) return;
    if (!confirm(`Remove ${member.userName} from the team?`)) return;

    try {
      await organizationService.removeMember(member.userId, currentOrganization.id);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  }

  if (!canManageTeam()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have permission to manage the team.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="mt-2 text-gray-600">
          Manage your {currentOrganization?.name} team members and their roles
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      
      {/* Invite Link Display */}
      {inviteLink && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-green-800 font-medium mb-2">✅ {inviteSuccess}</p>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Send this link</strong> to them via text, email, or however you like. 
                When they click it and sign up, they'll automatically join your team.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-sm bg-white border border-green-300 rounded px-3 py-2 text-gray-700"
                />
                <button
                  onClick={copyInviteLink}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    linkCopied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {linkCopied ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => { setInviteLink(''); setInviteSuccess(''); }} 
              className="text-green-800 hover:text-green-900 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Invite New Member */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Team Member</h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="input"
                placeholder="farmer@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="input"
              >
                <option value={RoleEnum.MEMBER}>Member</option>
                <option value={RoleEnum.ADMIN}>Admin</option>
                <option value={RoleEnum.VIEWER}>Viewer</option>
                {isOwner() && <option value={RoleEnum.OWNER}>Owner</option>}
              </select>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={inviteLoading}
              className="btn-primary disabled:opacity-50"
            >
              {inviteLoading ? 'Creating...' : 'Generate Invite Link'}
            </button>
          </div>
        </form>
      </Card>

      {/* Team Members List */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Team Members ({members.filter(m => m.status === 'active').length})
        </h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No team members yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {member.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isOwner() && member.userId !== currentUser?.uid ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${getRoleBadgeColor(member.role)}`}
                        >
                          <option value={RoleEnum.MEMBER}>Member</option>
                          <option value={RoleEnum.ADMIN}>Admin</option>
                          <option value={RoleEnum.VIEWER}>Viewer</option>
                          <option value={RoleEnum.OWNER}>Owner</option>
                        </select>
                      ) : (
                        <span className={`inline-flex text-xs px-2 py-1 rounded-full font-semibold ${getRoleBadgeColor(member.role)}`}>
                          {getRoleName(member.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full font-semibold ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.joinedAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.userId !== currentUser?.uid && member.role !== RoleEnum.OWNER && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Role Descriptions */}
      <Card className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Descriptions</h3>
        <dl className="space-y-4">
          <div>
            <dt className="font-medium text-gray-900">👑 Owner</dt>
            <dd className="text-sm text-gray-600 mt-1">
              Full control over the organization. Can manage all data, team members, and settings.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">⚡ Admin</dt>
            <dd className="text-sm text-gray-600 mt-1">
              Can manage farm data and invite team members. Cannot remove the owner or change organization settings.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">✏️ Member</dt>
            <dd className="text-sm text-gray-600 mt-1">
              Can create, edit, and delete crops, harvests, customers, and fields. Cannot manage team members.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">👁️ Viewer</dt>
            <dd className="text-sm text-gray-600 mt-1">
              Read-only access to all farm data. Cannot make any changes. Ideal for consultants, accountants, or clients.
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
