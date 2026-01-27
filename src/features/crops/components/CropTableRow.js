import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
export default function CropTableRow({ crop, onView, onEdit }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'ready':
                return 'bg-green-100 text-green-800';
            case 'growing':
                return 'bg-blue-100 text-blue-800';
            case 'planted':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: crop.name }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-500", children: crop.variety }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-gray-900", children: crop.fieldName }), _jsx("div", { className: "text-xs text-gray-500", children: crop.sectionName })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-500", children: format(crop.plantedDate.toDate(), 'MMM d, yyyy') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-500", children: format(crop.harvestReadyDate.toDate(), 'MMM d, yyyy') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(crop.status)}`, children: crop.status }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [onView && (_jsx("button", { onClick: () => onView(crop), className: "text-primary-600 hover:text-primary-900 mr-4", children: "View" })), onEdit && (_jsx("button", { onClick: () => onEdit(crop), className: "text-gray-600 hover:text-gray-900", children: "Edit" }))] })] }));
}
