import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { fieldService } from '../../services/fieldService';
import { Timestamp } from 'firebase/firestore';
const sizeUnits = [
    { value: 'sqft', label: 'Square Feet' },
    { value: 'acres', label: 'Acres' },
];
const sunExposureOptions = [
    { value: 'full-sun', label: 'Full Sun' },
    { value: 'partial-sun', label: 'Partial Sun' },
    { value: 'shade', label: 'Shade' },
];
const irrigationTypes = [
    { value: 'drip', label: 'Drip Irrigation' },
    { value: 'sprinkler', label: 'Sprinkler System' },
    { value: 'manual', label: 'Manual Watering' },
    { value: 'none', label: 'None' },
];
const sectionStatuses = [
    { value: 'available', label: 'Available' },
    { value: 'planted', label: 'Planted' },
    { value: 'fallow', label: 'Fallow' },
    { value: 'preparing', label: 'Preparing' },
];
export default function AddFieldForm({ onSuccess, onCancel, userId, organizationId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        size: '',
        sizeUnit: 'sqft',
        soilType: '',
        sunExposure: 'full-sun',
        irrigationType: 'drip',
        notes: '',
    });
    const [sections, setSections] = useState([
        { name: 'Section 1', size: '', status: 'available', notes: '' }
    ]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!formData.name.trim() || !formData.size) {
            setError('Please fill in all required fields');
            return;
        }
        const size = parseFloat(formData.size);
        if (isNaN(size) || size <= 0) {
            setError('Please enter a valid size');
            return;
        }
        // Validate sections
        for (const section of sections) {
            if (!section.name.trim()) {
                setError('All sections must have a name');
                return;
            }
            if (!section.size) {
                setError('All sections must have a size');
                return;
            }
            const sectionSize = parseFloat(section.size);
            if (isNaN(sectionSize) || sectionSize <= 0) {
                setError('All sections must have a valid size');
                return;
            }
        }
        try {
            setLoading(true);
            const fieldSections = sections.map((section, index) => ({
                id: `section-${Date.now()}-${index}`,
                name: section.name.trim(),
                size: parseFloat(section.size),
                status: section.status,
                notes: section.notes.trim() || undefined,
            }));
            const fieldData = {
                name: formData.name.trim(),
                size,
                sizeUnit: formData.sizeUnit,
                soilType: formData.soilType.trim() || undefined,
                sunExposure: formData.sunExposure,
                irrigationType: formData.irrigationType,
                userId,
                organizationId,
                createdBy: userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                notes: formData.notes.trim() || undefined,
                sections: fieldSections,
            };
            await fieldService.createField(fieldData);
            onSuccess();
        }
        catch (err) {
            console.error('Error creating field:', err);
            setError(err instanceof Error ? err.message : 'Failed to create field');
        }
        finally {
            setLoading(false);
        }
    };
    const addSection = () => {
        setSections([
            ...sections,
            { name: `Section ${sections.length + 1}`, size: '', status: 'available', notes: '' }
        ]);
    };
    const removeSection = (index) => {
        if (sections.length > 1) {
            setSections(sections.filter((_, i) => i !== index));
        }
    };
    const updateSection = (index, field, value) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], [field]: value };
        setSections(updated);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [error && (_jsx("div", { className: "bg-red-50 text-red-800 p-3 rounded-md text-sm", children: error })), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Field Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-1", children: ["Field Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", id: "name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", placeholder: "e.g., North Field, Field A", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "size", className: "block text-sm font-medium text-gray-700 mb-1", children: ["Size ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "number", id: "size", value: formData.size, onChange: (e) => setFormData({ ...formData, size: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", step: "0.01", min: "0", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "sizeUnit", className: "block text-sm font-medium text-gray-700 mb-1", children: "Unit" }), _jsx("select", { id: "sizeUnit", value: formData.sizeUnit, onChange: (e) => setFormData({ ...formData, sizeUnit: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", children: sizeUnits.map((unit) => (_jsx("option", { value: unit.value, children: unit.label }, unit.value))) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "soilType", className: "block text-sm font-medium text-gray-700 mb-1", children: "Soil Type" }), _jsx("input", { type: "text", id: "soilType", value: formData.soilType, onChange: (e) => setFormData({ ...formData, soilType: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", placeholder: "e.g., Clay, Loam, Sandy" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "sunExposure", className: "block text-sm font-medium text-gray-700 mb-1", children: "Sun Exposure" }), _jsxs("select", { id: "sunExposure", value: formData.sunExposure || '', onChange: (e) => setFormData({ ...formData, sunExposure: e.target.value || undefined }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", children: [_jsx("option", { value: "", children: "Select..." }), sunExposureOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "irrigationType", className: "block text-sm font-medium text-gray-700 mb-1", children: "Irrigation Type" }), _jsxs("select", { id: "irrigationType", value: formData.irrigationType || '', onChange: (e) => setFormData({ ...formData, irrigationType: e.target.value || undefined }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", children: [_jsx("option", { value: "", children: "Select..." }), irrigationTypes.map((type) => (_jsx("option", { value: type.value, children: type.label }, type.value)))] })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-gray-700 mb-1", children: "Notes" }), _jsx("textarea", { id: "notes", value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), rows: 2, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", placeholder: "Additional information about this field..." })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Sections" }), _jsx("button", { type: "button", onClick: addSection, className: "text-sm text-emerald-600 hover:text-emerald-700 font-medium", children: "+ Add Section" })] }), _jsx("div", { className: "space-y-3", children: sections.map((section, index) => (_jsxs("div", { className: "border border-gray-200 rounded-md p-4 bg-gray-50", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Section Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: section.name, onChange: (e) => updateSection(index, 'name', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white", required: true })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Size (sqft) ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "number", value: section.size, onChange: (e) => updateSection(index, 'size', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white", step: "0.01", min: "0", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsx("select", { value: section.status, onChange: (e) => updateSection(index, 'status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white", children: sectionStatuses.map((status) => (_jsx("option", { value: status.value, children: status.label }, status.value))) })] }), _jsx("div", { className: "flex items-end", children: sections.length > 1 && (_jsx("button", { type: "button", onClick: () => removeSection(index), className: "w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50", children: "Remove" })) })] }), _jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Section Notes" }), _jsx("input", { type: "text", value: section.notes, onChange: (e) => updateSection(index, 'notes', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white", placeholder: "Optional notes for this section..." })] })] }, index))) })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed", disabled: loading, children: loading ? 'Adding...' : 'Add Field' })] })] }));
}
