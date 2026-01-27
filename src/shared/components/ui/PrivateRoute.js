import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
export default function PrivateRoute({ children }) {
    const { currentUser } = useAuth();
    return currentUser ? _jsx(_Fragment, { children: children }) : _jsx(Navigate, { to: "/login" });
}
