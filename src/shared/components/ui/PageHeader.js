import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PageHeader({ title, actionLabel, onAction }) {
    return (_jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-bold text-gray-900", children: title }), actionLabel && onAction && (_jsx("button", { className: "btn-primary w-full sm:w-auto", onClick: onAction, children: actionLabel }))] }));
}
