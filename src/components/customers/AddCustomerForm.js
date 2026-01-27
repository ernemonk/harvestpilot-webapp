import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { customerService } from '../../services/customerService';
import { Timestamp } from 'firebase/firestore';
const customerTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'farmers-market', label: 'Farmers Market' },
    { value: 'grocery', label: 'Grocery Store' },
    { value: 'asian-market', label: 'Asian Market' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'individual', label: 'Individual' },
];
const customerStatuses = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];
export default function AddCustomerForm({ onSuccess, onCancel, userId, organizationId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'restaurant',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        status: 'prospect',
        notes: '',
        preferredProducts: '',
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!formData.name.trim() || !formData.city.trim() || !formData.state.trim()) {
            setError('Please fill in all required fields');
            return;
        }
        try {
            setLoading(true);
            const customerData = {
                name: formData.name.trim(),
                type: formData.type,
                contactName: formData.contactName.trim() || undefined,
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                address: formData.address.trim() || undefined,
                city: formData.city.trim(),
                state: formData.state.trim(),
                zipCode: formData.zipCode.trim() || undefined,
                status: formData.status,
                userId,
                organizationId,
                createdBy: userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                notes: formData.notes.trim() || undefined,
                preferredProducts: formData.preferredProducts.trim()
                    ? formData.preferredProducts.split(',').map(p => p.trim()).filter(Boolean)
                    : undefined,
            };
            await customerService.createCustomer(customerData);
            onSuccess();
        }
        catch (err) {
            console.error('Error creating customer:', err);
            setError(err instanceof Error ? err.message : 'Failed to create customer');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 text-red-800 p-3 rounded-md text-sm", children: error })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-1", children: ["Business Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", id: "name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", required: true })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "type", className: "block text-sm font-medium text-gray-700 mb-1", children: ["Customer Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("select", { id: "type", value: formData.type, onChange: (e) => setFormData({ ...formData, type: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", required: true, children: customerTypes.map((type) => (_jsx("option", { value: type.value, children: type.label }, type.value))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "contactName", className: "block text-sm font-medium text-gray-700 mb-1", children: "Contact Name" }), _jsx("input", { type: "text", id: "contactName", value: formData.contactName, onChange: (e) => setFormData({ ...formData, contactName: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { type: "email", id: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700 mb-1", children: "Phone" }), _jsx("input", { type: "tel", id: "phone", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "status", className: "block text-sm font-medium text-gray-700 mb-1", children: ["Status ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("select", { id: "status", value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", required: true, children: customerStatuses.map((status) => (_jsx("option", { value: status.value, children: status.label }, status.value))) })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { htmlFor: "address", className: "block text-sm font-medium text-gray-700 mb-1", children: "Street Address" }), _jsx("input", { type: "text", id: "address", value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "city", className: "block text-sm font-medium text-gray-700 mb-1", children: ["City ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", id: "city", value: formData.city, onChange: (e) => setFormData({ ...formData, city: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", required: true })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "state", className: "block text-sm font-medium text-gray-700 mb-1", children: ["State ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", id: "state", value: formData.state, onChange: (e) => setFormData({ ...formData, state: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", placeholder: "CA", maxLength: 2, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "zipCode", className: "block text-sm font-medium text-gray-700 mb-1", children: "ZIP Code" }), _jsx("input", { type: "text", id: "zipCode", value: formData.zipCode, onChange: (e) => setFormData({ ...formData, zipCode: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { htmlFor: "preferredProducts", className: "block text-sm font-medium text-gray-700 mb-1", children: "Preferred Products" }), _jsx("input", { type: "text", id: "preferredProducts", value: formData.preferredProducts, onChange: (e) => setFormData({ ...formData, preferredProducts: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", placeholder: "Separate with commas (e.g., Microgreens, Herbs, Strawberries)" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-gray-700 mb-1", children: "Notes" }), _jsx("textarea", { id: "notes", value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", placeholder: "Additional information about this customer..." })] })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed", disabled: loading, children: loading ? 'Adding...' : 'Add Customer' })] })] }));
}
