import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export default function DeviceSharing({ deviceId, firstOwnerId, currentUserId, accessControl, users = [], }) {
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
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const removeUserAccess = async (userId) => {
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
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 mb-4", children: "Device Access Control" }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-700", children: "Access Mode" }), _jsx("p", { className: "text-sm text-gray-500", children: accessControl?.mode === 'open'
                                        ? '🔓 Open - Any user can access this device'
                                        : '🔒 Locked - Only whitelisted users can access' })] }), _jsx("button", { onClick: toggleAccessMode, disabled: loading, className: "px-4 py-2 rounded-lg font-medium transition-colors", style: {
                                backgroundColor: accessControl?.mode === 'open' ? '#dc2626' : '#16a34a',
                                color: 'white',
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }, children: loading ? 'Updating...' : `Switch to ${accessControl?.mode === 'open' ? 'Locked' : 'Open'}` })] }) }), _jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-700 mb-3", children: ["Users with Access (", users.length, ")"] }), _jsx("div", { className: "space-y-2", children: users.map((userId) => (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 p-3 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: userId }), userId === firstOwnerId && (_jsx("span", { className: "text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded", children: "First Owner" }))] }), userId !== firstOwnerId && (_jsx("button", { onClick: () => removeUserAccess(userId), disabled: loading, className: "text-red-600 hover:text-red-700 disabled:opacity-50 text-sm font-medium", children: "Remove" }))] }, userId))) })] }), error && (_jsx("div", { className: "mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm", children: error })), success && (_jsx("div", { className: "mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm", children: success })), _jsxs("div", { className: "mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800", children: [_jsx("p", { className: "font-medium", children: "\uD83D\uDCA1 How it works:" }), _jsxs("ul", { className: "list-disc list-inside mt-2 space-y-1", children: [_jsxs("li", { children: [_jsx("strong", { children: "Open Mode:" }), " Any user who enters your device ID can access and monitor it"] }), _jsxs("li", { children: [_jsx("strong", { children: "Locked Mode:" }), " Only users you explicitly allow can access the device"] }), _jsx("li", { children: "As first owner, you always have access" })] })] })] }));
}
