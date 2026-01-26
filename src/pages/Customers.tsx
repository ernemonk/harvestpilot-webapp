import { useState, useMemo } from 'react';
import { useFirestoreList } from '../hooks/useFirestore';
import { customerService } from '../services/customerService';
import type { Customer } from '../types';
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
  
  const fetchCustomers = useMemo(() => 
    currentOrganization 
      ? () => customerService.getOrganizationCustomers(currentOrganization.id) 
      : null,
    [currentOrganization?.id]
  );
    
  const { data: customers, loading, error, refetch } = useFirestoreList<Customer>(fetchCustomers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  if (!currentOrganization) return <NoOrganization />;
  if (loading) return <LoadingSpinner message="Loading customers..." />;
  if (error) return <ErrorMessage message={`Error loading customers: ${error}`} />;

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

  const handleViewCustomer = (customer: Customer) => {
    console.log('View customer:', customer);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('Edit customer:', customer);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <PageHeader 
        title="Customer Management" 
        actionLabel={canEdit() ? "+ Add New Customer" : undefined}
        onAction={canEdit() ? handleAddCustomer : undefined}
      />
      
      {isViewer() && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          You have read-only access. Contact an admin to make changes.
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-6">
        <StatCard 
          label="Total Customers" 
          value={customers.length} 
          subtitle={`${activeCustomers} active`} 
        />
        <StatCard 
          label="Restaurants" 
          value={restaurants} 
          subtitle="Fine dining & casual" 
        />
        <StatCard 
          label="Markets" 
          value={markets} 
          subtitle="Farmers markets" 
        />
        <StatCard 
          label="Grocery Stores" 
          value={retail} 
          subtitle="Retail partners" 
        />
      </div>
      
      <CustomerFilters />
      
      <Card className="overflow-hidden">
        <CustomerTable 
          customers={customers} 
          onView={handleViewCustomer} 
          onEdit={handleEditCustomer} 
        />
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        size="lg"
      >
        <AddCustomerForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
          userId={currentUser?.uid || ''}
          organizationId={currentOrganization.id}
        />
      </Modal>
    </div>
  );
}
