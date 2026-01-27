import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { cropService } from '../../services/cropService';
export default function AddCropForm({ onSuccess, onCancel, userId, organizationId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        variety: '',
        fieldId: '',
        fieldName: '',
        sectionId: '',
        sectionName: '',
        plantedDate: new Date().toISOString().split('T')[0],
        harvestReadyDate: '',
        status: 'planted',
        notes: '',
        area: '',
        expectedYield: ''
    });
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const plantedDate = Timestamp.fromDate(new Date(formData.plantedDate));
            const harvestReadyDate = formData.harvestReadyDate
                ? Timestamp.fromDate(new Date(formData.harvestReadyDate))
                : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days
            const cropData = {
                name: formData.name,
                variety: formData.variety,
                fieldId: formData.fieldId || 'default-field',
                fieldName: formData.fieldName || 'Main Field',
                sectionId: formData.sectionId || 'default-section',
                sectionName: formData.sectionName || 'Section 1',
                plantedDate,
                harvestReadyDate,
                status: formData.status,
                userId,
                organizationId,
                createdBy: userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                notes: formData.notes || undefined,
                area: formData.area ? Number(formData.area) : undefined,
                expectedYield: formData.expectedYield ? Number(formData.expectedYield) : undefined
            };
            await cropService.createCrop(cropData);
            onSuccess();
        }
        catch (err) {
            setError(err.message || 'Failed to create crop');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded", children: error })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Crop Name *" }), _jsx("input", { type: "text", required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., Tomatoes" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Variety *" }), _jsx("input", { type: "text", required: true, value: formData.variety, onChange: (e) => setFormData({ ...formData, variety: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., Cherry" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Field Name" }), _jsx("input", { type: "text", value: formData.fieldName, onChange: (e) => setFormData({ ...formData, fieldName: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., North Field" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Section Name" }), _jsx("input", { type: "text", value: formData.sectionName, onChange: (e) => setFormData({ ...formData, sectionName: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "e.g., Row 1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Planted Date *" }), _jsx("input", { type: "date", required: true, value: formData.plantedDate, onChange: (e) => setFormData({ ...formData, plantedDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Expected Harvest Date" }), _jsx("input", { type: "date", value: formData.harvestReadyDate, onChange: (e) => setFormData({ ...formData, harvestReadyDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status *" }), _jsxs("select", { required: true, value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", children: [_jsx("option", { value: "planning", children: "Planning" }), _jsx("option", { value: "planted", children: "Planted" }), _jsx("option", { value: "growing", children: "Growing" }), _jsx("option", { value: "ready", children: "Ready to Harvest" }), _jsx("option", { value: "harvested", children: "Harvested" }), _jsx("option", { value: "completed", children: "Completed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Area (sq ft)" }), _jsx("input", { type: "number", value: formData.area, onChange: (e) => setFormData({ ...formData, area: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Expected Yield (lbs)" }), _jsx("input", { type: "number", value: formData.expectedYield, onChange: (e) => setFormData({ ...formData, expectedYield: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "50" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", placeholder: "Any additional information..." })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50", children: loading ? 'Creating...' : 'Create Crop' })] })] }));
}
