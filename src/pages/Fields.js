import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useFirestoreList } from '../hooks/useFirestore';
import { fieldService } from '../services/fieldService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import NoOrganization from '../components/ui/NoOrganization';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import FieldGrid from '../components/fields/FieldGrid';
import AddFieldForm from '../components/fields/AddFieldForm';
export default function Fields() {
    const { currentUser, currentOrganization } = useAuth();
    const { canEdit, isViewer } = usePermissions();
    const fetchFields = useMemo(() => currentOrganization
        ? () => fieldService.getOrganizationFields(currentOrganization.id)
        : null, [currentOrganization?.id]);
    const { data: fields, loading, error, refetch } = useFirestoreList(fetchFields);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    if (!currentOrganization)
        return _jsx(NoOrganization, {});
    if (loading)
        return _jsx(LoadingSpinner, { message: "Loading fields..." });
    if (error)
        return _jsx(ErrorMessage, { message: `Error loading fields: ${error}` });
    const totalAcreage = fields.reduce((sum, field) => {
        return sum + (field.sizeUnit === 'acres' ? field.size : field.size / 43560);
    }, 0);
    const totalSections = fields.reduce((sum, field) => sum + field.sections.length, 0);
    const plantedSections = fields.reduce((sum, field) => sum + field.sections.filter(s => s.status === 'planted').length, 0);
    const handleAddField = () => {
        setIsAddModalOpen(true);
    };
    const handleAddSuccess = () => {
        setIsAddModalOpen(false);
        refetch();
    };
    const handleEditField = (field) => {
        console.log('Edit field:', field);
    };
    const handleViewDetails = (field) => {
        console.log('View field details:', field);
    };
    return (_jsxs("div", { className: "px-4 py-6 sm:px-0", children: [_jsx(PageHeader, { title: "Field & Parcel Management", actionLabel: canEdit() ? "+ Add New Field" : undefined, onAction: canEdit() ? handleAddField : undefined }), isViewer() && (_jsx("div", { className: "mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded", children: "You have read-only access. Contact an admin to make changes." })), _jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-4 mb-6", children: [_jsx(StatCard, { label: "Total Fields", value: fields.length, subtitle: `${totalAcreage.toFixed(2)} acres` }), _jsx(StatCard, { label: "Total Sections", value: totalSections, subtitle: "Parcels defined" }), _jsx(StatCard, { label: "Currently Planted", value: plantedSections, subtitle: "Active sections" }), _jsx(StatCard, { label: "Available", value: totalSections - plantedSections, subtitle: "Ready to plant" })] }), fields.length === 0 ? (_jsxs("div", { className: "card text-center py-12", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No fields defined yet" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Start by defining your fields and sections to organize your farm" }), canEdit() && (_jsx("button", { onClick: handleAddField, className: "btn-primary", children: "Create Your First Field" }))] })) : (_jsx(FieldGrid, { fields: fields, onEdit: handleEditField, onViewDetails: handleViewDetails })), _jsx(Modal, { isOpen: isAddModalOpen, onClose: () => setIsAddModalOpen(false), title: "Add New Field", size: "xl", children: _jsx(AddFieldForm, { onSuccess: handleAddSuccess, onCancel: () => setIsAddModalOpen(false), userId: currentUser?.uid || '', organizationId: currentOrganization.id }) })] }));
}
