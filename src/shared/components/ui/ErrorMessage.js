import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ErrorMessage({ message, onClose }) {
    return (_jsx("div", { className: "px-4 py-6 sm:px-0", children: _jsxs("div", { className: "bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex justify-between items-center", children: [_jsx("span", { children: message }), onClose && (_jsx("button", { onClick: onClose, className: "text-red-800 hover:text-red-900 ml-4", children: "\u2715" }))] }) }));
}
