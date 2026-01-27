import { jsx as _jsx } from "react/jsx-runtime";
import Table from '../ui/Table';
import CustomerTableRow from './CustomerTableRow';
export default function CustomerTable({ customers, onView, onEdit }) {
    const headers = ['Customer', 'Type', 'Contact', 'Status', 'Actions'];
    return (_jsx(Table, { headers: headers, children: customers.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-12 text-center text-gray-500", children: "No customers yet. Click \"Add New Customer\" to get started." }) })) : (customers.map((customer) => (_jsx(CustomerTableRow, { customer: customer, onView: onView, onEdit: onEdit }, customer.id)))) }));
}
