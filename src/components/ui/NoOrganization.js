import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../../contexts/AuthContext';
export default function NoOrganization() {
    const { currentUser, logout } = useAuth();
    const handleLogout = async () => {
        try {
            await logout();
        }
        catch (error) {
            console.error('Failed to log out:', error);
        }
    };
    return (_jsx("div", { className: "px-4 py-6 sm:px-0", children: _jsxs("div", { className: "text-center py-12 max-w-md mx-auto", children: [_jsx("div", { className: "mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4", children: _jsx("span", { className: "text-4xl", children: "\u26A0\uFE0F" }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "No Organization Found" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Your account is not associated with any organization. This can happen if:" }), _jsxs("ul", { className: "text-sm text-gray-500 mb-6 text-left list-disc pl-6 space-y-1", children: [_jsx("li", { children: "Your account was created without an organization" }), _jsx("li", { children: "Your organization membership was removed" }), _jsx("li", { children: "There was an error during signup" })] }), currentUser && (_jsxs("div", { className: "mb-4", children: [_jsxs("p", { className: "text-sm text-gray-400 mb-4", children: ["Logged in as: ", _jsx("strong", { children: currentUser.email })] }), _jsxs("div", { className: "space-x-3", children: [_jsx("button", { onClick: handleLogout, className: "btn btn-secondary", children: "Sign Out" }), _jsx("a", { href: "/signup", className: "btn btn-primary", children: "Create New Account" })] })] })), _jsx("p", { className: "text-xs text-gray-400 mt-6", children: "If you believe this is an error, please contact support." })] }) }));
}
