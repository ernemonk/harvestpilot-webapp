import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function CustomerTableRow({ customer, onView, onEdit }) {
    const getTypeColor = (type) => {
        switch (type) {
            case 'restaurant':
                return 'bg-purple-100 text-purple-800';
            case 'farmers-market':
                return 'bg-green-100 text-green-800';
            case 'grocery':
            case 'asian-market':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'trial':
                return 'bg-yellow-100 text-yellow-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: customer.name }), _jsx("div", { className: "text-xs text-gray-500", children: customer.contactName })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(customer.type)}`, children: customer.type }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-gray-900", children: customer.email }), _jsx("div", { className: "text-xs text-gray-500", children: customer.phone })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(customer.status)}`, children: customer.status }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [onView && (_jsx("button", { onClick: () => onView(customer), className: "text-primary-600 hover:text-primary-900 mr-4", children: "View" })), onEdit && (_jsx("button", { onClick: () => onEdit(customer), className: "text-gray-600 hover:text-gray-900", children: "Edit" }))] })] }));
}
