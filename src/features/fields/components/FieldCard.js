import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function FieldCard({ field, onEdit, onViewDetails }) {
    const plantedSections = field.sections.filter(s => s.status === 'planted').length;
    const availableSections = field.sections.filter(s => s.status === 'available').length;
    const getSectionStatusColor = (status) => {
        switch (status) {
            case 'planted':
                return 'bg-green-500';
            case 'available':
                return 'bg-blue-500';
            case 'fallow':
                return 'bg-yellow-500';
            case 'preparing':
                return 'bg-orange-500';
            default:
                return 'bg-gray-500';
        }
    };
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: field.name }), _jsxs("p", { className: "text-sm text-gray-500", children: [field.size, " ", field.sizeUnit, " \u2022 ", field.soilType || 'Unknown soil'] })] }), _jsx("div", { className: "flex space-x-2", children: onEdit && (_jsx("button", { onClick: () => onEdit(field), className: "text-gray-600 hover:text-gray-900", children: "Edit" })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Sun Exposure" }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: field.sunExposure ? field.sunExposure.replace('-', ' ') : 'Unknown' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Irrigation" }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: field.irrigationType ? field.irrigationType : 'None' })] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("p", { className: "text-xs font-medium text-gray-500", children: ["Sections (", field.sections.length, ")"] }), _jsxs("p", { className: "text-xs text-gray-600", children: [plantedSections, " planted \u2022 ", availableSections, " available"] })] }), _jsxs("div", { className: "flex gap-1 h-2", children: [field.sections.map((section) => (_jsx("div", { className: `flex-1 rounded-sm ${getSectionStatusColor(section.status)}`, title: `${section.name}: ${section.status}` }, section.id))), field.sections.length === 0 && (_jsx("div", { className: "flex-1 bg-gray-200 rounded-sm" }))] })] }), field.notes && (_jsxs("p", { className: "text-sm text-gray-600 italic mb-4", children: ["\"", field.notes, "\""] })), onViewDetails && (_jsx("button", { onClick: () => onViewDetails(field), className: "w-full text-center py-2 text-sm text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded", children: "View Sections & Details" }))] }));
}
