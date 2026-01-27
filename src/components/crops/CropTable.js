import { jsx as _jsx } from "react/jsx-runtime";
import Table from '../ui/Table';
import CropTableRow from './CropTableRow';
export default function CropTable({ crops, onView, onEdit }) {
    const headers = ['Crop', 'Variety', 'Location', 'Planted', 'Harvest Ready', 'Status', 'Actions'];
    return (_jsx(Table, { headers: headers, children: crops.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-12 text-center text-gray-500", children: "No crops found. Click \"Add New Crop\" to get started." }) })) : (crops.map((crop) => (_jsx(CropTableRow, { crop: crop, onView: onView, onEdit: onEdit }, crop.id)))) }));
}
