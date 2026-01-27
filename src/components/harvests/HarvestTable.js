import { jsx as _jsx } from "react/jsx-runtime";
import Table from '../ui/Table';
import HarvestTableRow from './HarvestTableRow';
export default function HarvestTable({ harvests, onView, onEdit }) {
    const headers = ['Date', 'Crop', 'Quantity', 'Quality', 'Actions'];
    return (_jsx(Table, { headers: headers, children: harvests.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-12 text-center text-gray-500", children: "No harvests recorded yet. Click \"Log New Harvest\" to get started." }) })) : (harvests.map((harvest) => (_jsx(HarvestTableRow, { harvest: harvest, onView: onView, onEdit: onEdit }, harvest.id)))) }));
}
