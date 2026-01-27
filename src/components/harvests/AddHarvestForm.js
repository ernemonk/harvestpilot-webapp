import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { harvestService } from '../../services/harvestService';
export default function AddHarvestForm({ onSuccess, onCancel, userId, organizationId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        cropName: '',
        variety: '',
        quantity: '',
        unit: 'lbs',
        harvestDate: new Date().toISOString().split('T')[0],
        fieldName: '',
        sectionName: '',
        quality: 'standard',
        notes: '',
        price: ''
    });
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const harvestDate = Timestamp.fromDate(new Date(formData.harvestDate));
            const harvestData = {
                cropId: 'manual-entry',
                cropName: formData.cropName,
                variety: formData.variety,
                quantity: Number(formData.quantity),
                unit: formData.unit,
                harvestDate,
                fieldId: 'default-field',
                fieldName: formData.fieldName || 'Main Field',
                sectionId: 'default-section',
                sectionName: formData.sectionName || 'Section 1',
                quality: formData.quality,
                userId,
                organizationId,
                createdBy: userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                notes: formData.notes || undefined,
                price: formData.price ? Number(formData.price) : undefined
            };
            await harvestService.createHarvest(harvestData);
            onSuccess();
        }
        catch (err) {
            setError(err.message || 'Failed to create harvest');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded", children: error })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Crop Name *" }), _jsx("input", { type: "text", required: true, value: formData.cropName, onChange: (e) => setFormData({ ...formData, cropName: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., Tomatoes" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Variety *" }), _jsx("input", { type: "text", required: true, value: formData.variety, onChange: (e) => setFormData({ ...formData, variety: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., Cherry" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Quantity *" }), _jsx("input", { type: "number", step: "0.1", required: true, value: formData.quantity, onChange: (e) => setFormData({ ...formData, quantity: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "25" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Unit *" }), _jsxs("select", { required: true, value: formData.unit, onChange: (e) => setFormData({ ...formData, unit: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", children: [_jsx("option", { value: "lbs", children: "Pounds (lbs)" }), _jsx("option", { value: "kg", children: "Kilograms (kg)" }), _jsx("option", { value: "oz", children: "Ounces (oz)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Harvest Date *" }), _jsx("input", { type: "date", required: true, value: formData.harvestDate, onChange: (e) => setFormData({ ...formData, harvestDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Quality *" }), _jsxs("select", { required: true, value: formData.quality, onChange: (e) => setFormData({ ...formData, quality: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", children: [_jsx("option", { value: "premium", children: "Premium" }), _jsx("option", { value: "standard", children: "Standard" }), _jsx("option", { value: "below-standard", children: "Below Standard" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Field Name" }), _jsx("input", { type: "text", value: formData.fieldName, onChange: (e) => setFormData({ ...formData, fieldName: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., North Field" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Section Name" }), _jsx("input", { type: "text", value: formData.sectionName, onChange: (e) => setFormData({ ...formData, sectionName: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., Row 1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Price per Unit" }), _jsx("input", { type: "number", step: "0.01", value: formData.price, onChange: (e) => setFormData({ ...formData, price: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "5.00" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "Any additional information..." })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50", children: loading ? 'Recording...' : 'Record Harvest' })] })] }));
}
