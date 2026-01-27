import { jsx as _jsx } from "react/jsx-runtime";
export default function LoadingSpinner({ message = 'Loading...' }) {
    return (_jsx("div", { className: "px-4 py-6 sm:px-0 flex justify-center items-center min-h-screen", children: _jsx("div", { className: "text-lg text-gray-600", children: message }) }));
}
