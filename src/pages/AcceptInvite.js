import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/organizationService';
export default function AcceptInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUser, refreshOrganization } = useAuth();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const [orgName, setOrgName] = useState('');
    const token = searchParams.get('token');
    const acceptInvitation = async () => {
        if (!token || !currentUser)
            return;
        try {
            setStatus('loading');
            const organizationId = await organizationService.acceptInvitation(token, currentUser.uid, currentUser.displayName || currentUser.email || 'User');
            if (organizationId) {
                const org = await organizationService.getOrganization(organizationId);
                setOrgName(org?.name || 'the organization');
                await refreshOrganization();
                setStatus('success');
                setMessage(`You've successfully joined ${org?.name || 'the organization'}!`);
            }
            else {
                setStatus('error');
                setMessage('This invitation is invalid or has already been used.');
            }
        }
        catch (error) {
            console.error('Error accepting invitation:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to accept invitation. Please try again.');
        }
    };
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid invitation link. No token provided.');
            return;
        }
        if (!currentUser) {
            setStatus('login-required');
            setMessage('Please log in or create an account to accept this invitation.');
            return;
        }
        acceptInvitation();
    }, [token, currentUser]);
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-primary-600", children: "\uD83C\uDF31 Farm Intelligence" }), _jsx("h2", { className: "mt-6 text-2xl font-bold text-gray-900", children: "Team Invitation" })] }), _jsxs("div", { className: "mt-8 bg-white py-8 px-6 shadow rounded-lg", children: [status === 'loading' && (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" }), _jsx("p", { className: "text-gray-600", children: "Processing your invitation..." })] })), status === 'success' && (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4", children: _jsx("svg", { className: "h-6 w-6 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsxs("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: ["Welcome to ", orgName, "!"] }), _jsx("p", { className: "text-gray-600 mb-6", children: message }), _jsx("button", { onClick: () => navigate('/dashboard'), className: "btn-primary w-full", children: "Go to Dashboard" })] })), status === 'error' && (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4", children: _jsx("svg", { className: "h-6 w-6 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Invitation Error" }), _jsx("p", { className: "text-gray-600 mb-6", children: message }), _jsx(Link, { to: "/dashboard", className: "btn-secondary w-full inline-block text-center", children: "Go to Dashboard" })] })), status === 'login-required' && (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4", children: _jsx("svg", { className: "h-6 w-6 text-yellow-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Login Required" }), _jsx("p", { className: "text-gray-600 mb-6", children: message }), _jsxs("div", { className: "space-y-3", children: [_jsx(Link, { to: `/login?redirect=/accept-invite?token=${token}`, className: "btn-primary w-full inline-block text-center", children: "Log In" }), _jsx(Link, { to: `/signup?redirect=/accept-invite?token=${token}`, className: "btn-secondary w-full inline-block text-center", children: "Create Account" })] })] }))] })] }) }));
}
