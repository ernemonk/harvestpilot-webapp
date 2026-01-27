import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
export default function Login() {
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    async function handleSubmit(email, password) {
        try {
            setError('');
            await login(email, password);
            navigate('/');
        }
        catch (err) {
            setError(err.message || 'Failed to log in');
            throw err;
        }
    }
    return (_jsxs(AuthLayout, { title: "Farm Intelligence", subtitle: "Sign in to your account", children: [_jsx(LoginForm, { onSubmit: handleSubmit, error: error }), _jsxs("div", { className: "mt-8", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-200" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-3 bg-white text-gray-500 font-medium", children: "Don't have an account?" }) })] }), _jsx("div", { className: "mt-6", children: _jsx(Link, { to: "/signup", className: "w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-lg shadow-sm bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-primary-300 transition-all", children: "Create new account" }) })] })] }));
}
