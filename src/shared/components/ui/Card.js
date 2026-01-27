import { jsx as _jsx } from "react/jsx-runtime";
export default function Card({ children, className = '' }) {
    return (_jsx("div", { className: `card ${className}`, children: children }));
}
