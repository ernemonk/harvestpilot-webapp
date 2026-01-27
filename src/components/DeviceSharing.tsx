/**
 * Device Sharing & Access Control
 * 
 * First owner can:
 * - Switch between open access and whitelist mode
 * - Manage allowed users
 * - View all users with access
 * - Remove user access
 */

import { useState } from 'react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DeviceSharingProps {
  deviceId: string;
  firstOwnerId: string;
  currentUserId: string;
  accessControl?: {
    mode: 'open' | 'whitelist';
    allowedUsers: string[];
    lockedAt?: number;
  };
  users?: string[];
}

export default function DeviceSharing({
  deviceId,
  firstOwnerId,
  currentUserId,
  accessControl,
  users = [],
}: DeviceSharingProps) {
  const isFirstOwner = currentUserId === firstOwnerId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isFirstOwner) {
    return null; // Only show to first owner
  }

  const toggleAccessMode = async () => {
    setLoading(true);
    setError('');
    try {
      const newMode = accessControl?.mode === 'open' ? 'whitelist' : 'open';
      
      await updateDoc(doc(db, 'devices', deviceId), {
        'accessControl.mode': newMode,
        'accessControl.lockedAt': newMode === 'whitelist' ? Date.now() : null,
      });

      setSuccess(`Device access switched to ${newMode} mode`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeUserAccess = async (userId: string) => {
    if (userId === firstOwnerId) {
      setError('Cannot remove first owner access');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, 'devices', deviceId), {
        users: arrayRemove(userId),
        'accessControl.allowedUsers': arrayRemove(userId),
      });

      setSuccess('User access removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Device Access Control</h3>

      {/* Access Mode */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium text-gray-700">Access Mode</p>
            <p className="text-sm text-gray-500">
              {accessControl?.mode === 'open'
                ? '🔓 Open - Any user can access this device'
                : '🔒 Locked - Only whitelisted users can access'}
            </p>
          </div>
          <button
            onClick={toggleAccessMode}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: accessControl?.mode === 'open' ? '#dc2626' : '#16a34a',
              color: 'white',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Updating...' : `Switch to ${accessControl?.mode === 'open' ? 'Locked' : 'Open'}`}
          </button>
        </div>
      </div>

      {/* Users with Access */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Users with Access ({users.length})</h4>
        <div className="space-y-2">
          {users.map((userId) => (
            <div key={userId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{userId}</p>
                {userId === firstOwnerId && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    First Owner
                  </span>
                )}
              </div>
              {userId !== firstOwnerId && (
                <button
                  onClick={() => removeUserAccess(userId)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Access Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium">💡 How it works:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>Open Mode:</strong> Any user who enters your device ID can access and monitor it
          </li>
          <li>
            <strong>Locked Mode:</strong> Only users you explicitly allow can access the device
          </li>
          <li>As first owner, you always have access</li>
        </ul>
      </div>
    </div>
  );
}
