import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import FarmDashboard from './pages/FarmDashboard';
import FarmModule from './pages/FarmModule';
import Dashboard from './pages/Dashboard';
import Device from './pages/Device';
import DeviceSetup from './pages/DeviceSetup';
import Alerts from './pages/Alerts';
import Crops from './pages/Crops';
import Harvests from './pages/Harvests';
import Customers from './pages/Customers';
import Fields from './pages/Fields';
import CropResearch from './pages/CropResearch';
import CropResearchDetail from './pages/CropResearchDetail';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import AcceptInvite from './pages/AcceptInvite';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import { usePermissions } from './hooks/usePermissions';
function App() {
    const { currentUser, logout, currentOrganization, allOrganizations, switchOrganization } = useAuth();
    const { getRoleName, getRoleBadgeColor, userRole } = usePermissions();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef(null);
    // Close user menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);
    async function handleLogout() {
        try {
            await logout();
            setShowUserMenu(false);
            navigate('/login');
        }
        catch (error) {
            console.error('Failed to log out', error);
        }
    }
    const navLinkClass = ({ isActive }) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive
        ? 'border-primary-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`;
    const mobileNavLinkClass = ({ isActive }) => `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${isActive
        ? 'bg-primary-50 border-primary-500 text-primary-700'
        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("nav", { className: "bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50", children: [_jsx("div", { className: "px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0 flex items-center", children: _jsxs(NavLink, { to: "/", className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-2xl sm:text-3xl", children: "\uD83C\uDF31" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h1", { className: "text-sm sm:text-xl font-bold text-primary-600 leading-tight", children: "Farm Intelligence" }), _jsx("p", { className: "text-xs text-gray-500 leading-tight hidden sm:block", children: "Harvest Hub" })] })] }) }), currentUser && (_jsxs("div", { className: "hidden md:ml-8 md:flex md:space-x-8", children: [_jsx(NavLink, { to: "/", end: true, className: navLinkClass, children: "Farm" }), _jsx(NavLink, { to: "/crops", className: navLinkClass, children: "Crops" }), _jsx(NavLink, { to: "/harvests", className: navLinkClass, children: "Harvests" }), _jsx(NavLink, { to: "/crop-research", className: navLinkClass, children: "Research" }), _jsx(NavLink, { to: "/alerts", className: navLinkClass, children: "Alerts" })] }))] }), _jsx("div", { className: "flex items-center", children: currentUser ? (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => setMobileMenuOpen(!mobileMenuOpen), className: "md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500", children: [_jsx("span", { className: "sr-only", children: "Open main menu" }), mobileMenuOpen ? (_jsx("svg", { className: "block h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })) : (_jsx("svg", { className: "block h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }))] }), _jsxs("div", { className: "hidden md:block relative ml-3", ref: menuRef, children: [_jsxs("button", { onClick: () => setShowUserMenu(!showUserMenu), className: "flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-3 py-2 transition-colors", children: [_jsx("div", { className: "flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-semibold", children: (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase() }), _jsxs("div", { className: "hidden md:flex flex-col items-start", children: [_jsx("span", { className: "max-w-[150px] truncate", children: currentUser.displayName || currentUser.email }), userRole && (_jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userRole)}`, children: getRoleName(userRole) }))] }), _jsx("svg", { className: `h-5 w-5 transition-transform ${showUserMenu ? 'rotate-180' : ''}`, fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }) })] }), showUserMenu && (_jsxs("div", { className: "absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50", children: [_jsxs("div", { className: "px-4 py-3", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Signed in as" }), _jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: currentUser.email })] }), allOrganizations.length > 0 && (_jsxs("div", { className: "py-2", children: [_jsx("p", { className: "px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: allOrganizations.length > 1 ? 'Your Teams' : 'Current Team' }), allOrganizations.map((org) => (_jsxs("button", { onClick: () => {
                                                                            switchOrganization(org.id);
                                                                            setShowUserMenu(false);
                                                                        }, className: `flex items-center w-full text-left px-4 py-2 text-sm transition-colors ${currentOrganization?.id === org.id
                                                                            ? 'bg-primary-50 text-primary-700'
                                                                            : 'text-gray-700 hover:bg-gray-50'}`, children: [_jsx("span", { className: "flex items-center justify-center h-6 w-6 rounded bg-primary-100 text-primary-700 text-xs font-semibold mr-3", children: org.name.charAt(0).toUpperCase() }), _jsx("span", { className: "truncate flex-1", children: org.name }), currentOrganization?.id === org.id && (_jsx("svg", { className: "h-4 w-4 text-primary-600", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }))] }, org.id)))] })), _jsx("div", { className: "py-1", children: _jsxs("button", { onClick: handleLogout, className: "flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors", children: [_jsx("svg", { className: "mr-3 h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), "Sign out"] }) })] }))] })] })) : (_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(NavLink, { to: "/login", className: "text-sm font-medium text-gray-700 hover:text-gray-900", children: "Sign In" }), _jsx(NavLink, { to: "/signup", className: "btn-primary", children: "Sign Up" })] })) })] }) }), currentUser && mobileMenuOpen && (_jsxs("div", { className: "md:hidden border-t border-gray-200", children: [_jsxs("div", { className: "pt-2 pb-3 space-y-1", children: [_jsx(NavLink, { to: "/", end: true, className: mobileNavLinkClass, children: "Farm Dashboard" }), _jsx(NavLink, { to: "/crops", className: mobileNavLinkClass, children: "Crops" }), _jsx(NavLink, { to: "/harvests", className: mobileNavLinkClass, children: "Harvests" }), _jsx(NavLink, { to: "/crop-research", className: mobileNavLinkClass, children: "Research" }), _jsx(NavLink, { to: "/alerts", className: mobileNavLinkClass, children: "Alerts" })] }), _jsxs("div", { className: "pt-4 pb-3 border-t border-gray-200", children: [_jsx("div", { className: "flex items-center px-4", children: _jsxs("div", { className: "ml-3", children: [_jsx("div", { className: "text-sm font-medium text-gray-500 truncate", children: currentUser.email }), userRole && (_jsx("span", { className: `inline-flex text-xs px-2 py-1 rounded-full mt-1 ${getRoleBadgeColor(userRole)}`, children: getRoleName(userRole) }))] }) }), _jsx("div", { className: "mt-3 space-y-1", children: _jsx("button", { onClick: handleLogout, className: "block w-full text-left px-4 py-2 text-base font-medium text-red-700 hover:bg-red-50", children: "Sign out" }) })] })] }))] }), _jsx("main", { className: "pt-16 py-6 px-4 sm:px-6 lg:px-8", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/signup", element: _jsx(SignUp, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "/accept-invite", element: _jsx(AcceptInvite, {}) }), _jsx(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(FarmDashboard, {}) }) }), _jsx(Route, { path: "/farm-module/:moduleId", element: _jsx(PrivateRoute, { children: _jsx(FarmModule, {}) }) }), _jsx(Route, { path: "/device", element: _jsx(PrivateRoute, { children: _jsx(Device, {}) }) }), _jsx(Route, { path: "/device/setup", element: _jsx(PrivateRoute, { children: _jsx(DeviceSetup, {}) }) }), _jsx(Route, { path: "/alerts", element: _jsx(PrivateRoute, { children: _jsx(Alerts, {}) }) }), _jsx(Route, { path: "/crops", element: _jsx(PrivateRoute, { children: _jsx(Crops, {}) }) }), _jsx(Route, { path: "/harvests", element: _jsx(PrivateRoute, { children: _jsx(Harvests, {}) }) }), _jsx(Route, { path: "/crop-research", element: _jsx(PrivateRoute, { children: _jsx(CropResearch, {}) }) }), _jsx(Route, { path: "/crop-research/:id", element: _jsx(PrivateRoute, { children: _jsx(CropResearchDetail, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(PrivateRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/customers", element: _jsx(PrivateRoute, { children: _jsx(Customers, {}) }) }), _jsx(Route, { path: "/fields", element: _jsx(PrivateRoute, { children: _jsx(Fields, {}) }) })] }) })] }));
}
export default App;
