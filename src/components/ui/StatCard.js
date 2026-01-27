import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function StatCard({ label, value, subtitle }) {
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { className: "text-xs sm:text-sm font-medium text-gray-500", children: label }), _jsx("p", { className: "mt-2 text-2xl sm:text-3xl font-semibold text-gray-900", children: value }), _jsx("p", { className: "mt-1 text-xs sm:text-sm text-gray-600", children: subtitle })] }));
}
