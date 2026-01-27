import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
export default function HarvestTableRow({ harvest, onView, onEdit }) {
    const getQualityColor = (quality) => {
        switch (quality) {
            case 'premium':
                return 'bg-green-100 text-green-800';
            case 'standard':
                return 'bg-blue-100 text-blue-800';
            case 'seconds':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-500", children: format(harvest.harvestDate.toDate(), 'MMM d, yyyy') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: harvest.cropName }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm text-gray-900", children: [harvest.quantity, " ", harvest.unit] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getQualityColor(harvest.quality)}`, children: harvest.quality }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [onView && (_jsx("button", { onClick: () => onView(harvest), className: "text-primary-600 hover:text-primary-900 mr-4", children: "View" })), onEdit && (_jsx("button", { onClick: () => onEdit(harvest), className: "text-gray-600 hover:text-gray-900", children: "Edit" }))] })] }));
}
