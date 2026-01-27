import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== passwordConfirm) {
            return setError('Passwords do not match');
        }
        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }
        if (!organizationName.trim()) {
            return setError('Farm/Organization name is required');
        }
        try {
            setError('');
            setLoading(true);
            await signup(email, password, displayName, organizationName);
            navigate('/');
        }
        catch (err) {
            setError(err.message || 'Failed to create an account');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "sm:mx-auto sm:w-full sm:max-w-md", children: [_jsx("h2", { className: "mt-6 text-center text-3xl font-bold text-gray-900", children: "\uD83C\uDF31 Farm Intelligence" }), _jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Create your farm account" })] }), _jsx("div", { className: "mt-8 sm:mx-auto sm:w-full sm:max-w-md", children: _jsxs("div", { className: "bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10", children: [error && (_jsx("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded", children: error })), _jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "displayName", className: "block text-sm font-medium text-gray-700", children: "Full Name" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "displayName", name: "displayName", type: "text", required: true, value: displayName, onChange: (e) => setDisplayName(e.target.value), className: "input", placeholder: "John Doe" }) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "organizationName", className: "block text-sm font-medium text-gray-700", children: "Farm/Organization Name" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "organizationName", name: "organizationName", type: "text", required: true, value: organizationName, onChange: (e) => setOrganizationName(e.target.value), className: "input", placeholder: "Green Valley Farm" }) }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "You'll be the owner of this organization" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "input" }) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "password", name: "password", type: "password", autoComplete: "new-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "input" }) }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Must be at least 6 characters" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "passwordConfirm", className: "block text-sm font-medium text-gray-700", children: "Confirm Password" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "passwordConfirm", name: "passwordConfirm", type: "password", autoComplete: "new-password", required: true, value: passwordConfirm, onChange: (e) => setPasswordConfirm(e.target.value), className: "input" }) })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: loading, className: "w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? 'Creating account...' : 'Create account' }) })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-gray-500", children: "Already have an account?" }) })] }), _jsx("div", { className: "mt-6", children: _jsx(Link, { to: "/login", className: "w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50", children: "Sign in instead" }) })] })] }) })] }));
}
