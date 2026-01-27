import { jsx as _jsx } from "react/jsx-runtime";
import FieldCard from './FieldCard';
export default function FieldGrid({ fields, onEdit, onViewDetails }) {
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: fields.map((field) => (_jsx(FieldCard, { field: field, onEdit: onEdit, onViewDetails: onViewDetails }, field.id))) }));
}
