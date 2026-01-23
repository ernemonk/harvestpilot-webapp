import { useState, useMemo } from 'react';
import { useFirestoreList } from '../hooks/useFirestore';
import { harvestService } from '../services/harvestService';
import type { Harvest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import HarvestTable from '../components/harvests/HarvestTable';
import AddHarvestForm from '../components/harvests/AddHarvestForm';

export default function Harvests() {
  const { currentUser, currentOrganization } = useAuth();
  const { canEdit, isViewer } = usePermissions();
  
  const fetchHarvests = useMemo(() => 
    currentOrganization 
      ? () => harvestService.getOrganizationHarvests(currentOrganization.id) 
      : null,
    [currentOrganization?.id]
  );
    
  const { data: harvests, loading, error, refetch } = useFirestoreList<Harvest>(fetchHarvests);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  if (!currentOrganization) return <LoadingSpinner message="Loading organization..." />;
  if (loading) return <LoadingSpinner message="Loading harvests..." />;
  if (error) return <ErrorMessage message={`Error loading harvests: ${error}`} />;

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

  const handleViewHarvest = (harvest: Harvest) => {
    console.log('View harvest:', harvest);
  };

  const handleEditHarvest = (harvest: Harvest) => {
    console.log('Edit harvest:', harvest);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <PageHeader 
        title="Harvest Log" 
        actionLabel={canEdit() ? "+ Log New Harvest" : undefined}
        onAction={canEdit() ? handleAddHarvest : undefined}
      />
      
      {isViewer() && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          You have read-only access. Contact an admin to make changes.
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
        <StatCard 
          label="Total Harvests" 
          value={harvests.length} 
          subtitle="All time" 
        />
        <StatCard 
          label="Total Quantity" 
          value={`${totalQuantity} lbs`} 
          subtitle="All harvests" 
        />
        <StatCard 
          label="Premium Quality" 
          value={`${premiumPercentage}%`} 
          subtitle={`${premiumCount} premium grade`} 
        />
      </div>
      
      <div className="mb-6 flex space-x-4">
        <input type="date" className="input w-48" placeholder="Start date" />
        <input type="date" className="input w-48" placeholder="End date" />
        <select className="input w-48">
          <option>All Crops</option>
          <option>Microgreens</option>
          <option>Medicinal Herbs</option>
          <option>Strawberries</option>
        </select>
        <select className="input w-48">
          <option>All Quality</option>
          <option>Premium</option>
          <option>Standard</option>
          <option>Below Standard</option>
        </select>
      </div>
      
      <Card className="overflow-hidden">
        <HarvestTable 
          harvests={harvests} 
          onView={handleViewHarvest} 
          onEdit={handleEditHarvest} 
        />
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log New Harvest"
        size="lg"
      >
        <AddHarvestForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
          userId={currentUser?.uid || ''}
          organizationId={currentOrganization.id}
        />
      </Modal>
    </div>
  );
}
