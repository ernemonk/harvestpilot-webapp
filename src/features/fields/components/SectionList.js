import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function SectionList({ sections, onEditSection }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'planted':
                return 'bg-green-100 text-green-800';
            case 'available':
                return 'bg-blue-100 text-blue-800';
            case 'fallow':
                return 'bg-yellow-100 text-yellow-800';
            case 'preparing':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    if (sections.length === 0) {
        return (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx("p", { children: "No sections defined for this field." }), _jsx("button", { className: "mt-4 text-primary-600 hover:text-primary-900", children: "+ Add Section" })] }));
    }
    return (_jsx("div", { className: "space-y-3", children: sections.map((section) => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h4", { className: "font-medium text-gray-900", children: section.name }), _jsx("span", { className: `px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(section.status)}`, children: section.status })] }), _jsxs("div", { className: "mt-1 text-sm text-gray-600", children: [section.size, " sqft", section.currentCropId && (_jsx("span", { className: "ml-3 text-primary-600", children: "\u2022 Currently growing crop" }))] }), section.notes && (_jsxs("p", { className: "mt-2 text-sm text-gray-500 italic", children: ["\"", section.notes, "\""] }))] }), onEditSection && (_jsx("button", { onClick: () => onEditSection(section), className: "ml-4 text-gray-600 hover:text-gray-900", children: "Edit" }))] }, section.id))) }));
}
