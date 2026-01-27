import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useFirestoreList } from '../hooks/useFirestore';
import { harvestService } from '../services/harvestService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import NoOrganization from '../components/ui/NoOrganization';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import HarvestTable from '../components/harvests/HarvestTable';
import AddHarvestForm from '../components/harvests/AddHarvestForm';
export default function Harvests() {
    const { currentUser, currentOrganization } = useAuth();
    const { canEdit, isViewer } = usePermissions();
    const fetchHarvests = useMemo(() => currentOrganization
        ? () => harvestService.getOrganizationHarvests(currentOrganization.id)
        : null, [currentOrganization?.id]);
    const { data: harvests, loading, error, refetch } = useFirestoreList(fetchHarvests);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    if (!currentOrganization)
        return _jsx(NoOrganization, {});
    if (loading)
        return _jsx(LoadingSpinner, { message: "Loading harvests..." });
    if (error)
        return _jsx(ErrorMessage, { message: `Error loading harvests: ${error}` });
    const totalQuantity = harvests.reduce((sum, h) => sum + h.quantity, 0);
    const premiumCount = harvests.filter(h => h.quality === 'premium').length;
    const premiumPercentage = harvests.length > 0
        ? Math.round((premiumCount / harvests.length) * 100)
        : 0;
    const handleAddHarvest = () => {
        setIsAddModalOpen(true);
    };
    const handleAddSuccess = () => {
        setIsAddModalOpen(false);
        refetch();
    };
    const handleViewHarvest = (harvest) => {
        console.log('View harvest:', harvest);
    };
    const handleEditHarvest = (harvest) => {
        console.log('Edit harvest:', harvest);
    };
    return (_jsxs("div", { className: "px-4 py-6 sm:px-0", children: [_jsx(PageHeader, { title: "Harvest Log", actionLabel: canEdit() ? "+ Log New Harvest" : undefined, onAction: canEdit() ? handleAddHarvest : undefined }), isViewer() && (_jsx("div", { className: "mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded", children: "You have read-only access. Contact an admin to make changes." })), _jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6", children: [_jsx(StatCard, { label: "Total Harvests", value: harvests.length, subtitle: "All time" }), _jsx(StatCard, { label: "Total Quantity", value: `${totalQuantity} lbs`, subtitle: "All harvests" }), _jsx(StatCard, { label: "Premium Quality", value: `${premiumPercentage}%`, subtitle: `${premiumCount} premium grade` })] }), _jsxs("div", { className: "mb-6 flex space-x-4", children: [_jsx("input", { type: "date", className: "input w-48", placeholder: "Start date" }), _jsx("input", { type: "date", className: "input w-48", placeholder: "End date" }), _jsxs("select", { className: "input w-48", children: [_jsx("option", { children: "All Crops" }), _jsx("option", { children: "Microgreens" }), _jsx("option", { children: "Medicinal Herbs" }), _jsx("option", { children: "Strawberries" })] }), _jsxs("select", { className: "input w-48", children: [_jsx("option", { children: "All Quality" }), _jsx("option", { children: "Premium" }), _jsx("option", { children: "Standard" }), _jsx("option", { children: "Below Standard" })] })] }), _jsx(Card, { className: "overflow-hidden", children: _jsx(HarvestTable, { harvests: harvests, onView: handleViewHarvest, onEdit: handleEditHarvest }) }), _jsx(Modal, { isOpen: isAddModalOpen, onClose: () => setIsAddModalOpen(false), title: "Log New Harvest", size: "lg", children: _jsx(AddHarvestForm, { onSuccess: handleAddSuccess, onCancel: () => setIsAddModalOpen(false), userId: currentUser?.uid || '', organizationId: currentOrganization.id }) })] }));
}
