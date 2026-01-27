import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useFirestoreList } from '../hooks/useFirestore';
import { customerService } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import NoOrganization from '../components/ui/NoOrganization';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import CustomerFilters from '../components/customers/CustomerFilters';
import CustomerTable from '../components/customers/CustomerTable';
import AddCustomerForm from '../components/customers/AddCustomerForm';
export default function Customers() {
    const { currentUser, currentOrganization } = useAuth();
    const { canEdit, isViewer } = usePermissions();
    const fetchCustomers = useMemo(() => currentOrganization
        ? () => customerService.getOrganizationCustomers(currentOrganization.id)
        : null, [currentOrganization?.id]);
    const { data: customers, loading, error, refetch } = useFirestoreList(fetchCustomers);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    if (!currentOrganization)
        return _jsx(NoOrganization, {});
    if (loading)
        return _jsx(LoadingSpinner, { message: "Loading customers..." });
    if (error)
        return _jsx(ErrorMessage, { message: `Error loading customers: ${error}` });
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const restaurants = customers.filter(c => c.type === 'restaurant').length;
    const markets = customers.filter(c => c.type === 'farmers-market').length;
    const retail = customers.filter(c => c.type === 'grocery' || c.type === 'asian-market').length;
    const handleAddCustomer = () => {
        setIsAddModalOpen(true);
    };
    const handleAddSuccess = () => {
        setIsAddModalOpen(false);
        refetch();
    };
    const handleViewCustomer = (customer) => {
        console.log('View customer:', customer);
    };
    const handleEditCustomer = (customer) => {
        console.log('Edit customer:', customer);
    };
    return (_jsxs("div", { className: "px-4 py-6 sm:px-0", children: [_jsx(PageHeader, { title: "Customer Management", actionLabel: canEdit() ? "+ Add New Customer" : undefined, onAction: canEdit() ? handleAddCustomer : undefined }), isViewer() && (_jsx("div", { className: "mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded", children: "You have read-only access. Contact an admin to make changes." })), _jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-4 mb-6", children: [_jsx(StatCard, { label: "Total Customers", value: customers.length, subtitle: `${activeCustomers} active` }), _jsx(StatCard, { label: "Restaurants", value: restaurants, subtitle: "Fine dining & casual" }), _jsx(StatCard, { label: "Markets", value: markets, subtitle: "Farmers markets" }), _jsx(StatCard, { label: "Grocery Stores", value: retail, subtitle: "Retail partners" })] }), _jsx(CustomerFilters, {}), _jsx(Card, { className: "overflow-hidden", children: _jsx(CustomerTable, { customers: customers, onView: handleViewCustomer, onEdit: handleEditCustomer }) }), _jsx(Modal, { isOpen: isAddModalOpen, onClose: () => setIsAddModalOpen(false), title: "Add New Customer", size: "lg", children: _jsx(AddCustomerForm, { onSuccess: handleAddSuccess, onCancel: () => setIsAddModalOpen(false), userId: currentUser?.uid || '', organizationId: currentOrganization.id }) })] }));
}
