import { useState, useEffect, useMemo } from 'react';
import { useFirestoreList } from '../hooks/useFirestore';
import { cropService } from '../services/cropService';
import type { Crop } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getUserProfile } from '../services/userService';
import { loadTestCropsData } from '../utils/loadTestData';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import NoOrganization from '../components/ui/NoOrganization';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import CropFilters from '../components/crops/CropFilters';
import CropTable from '../components/crops/CropTable';
import AddCropForm from '../components/crops/AddCropForm';

export default function Crops() {
  const { currentUser, currentOrganization } = useAuth();
  const { canEdit, isViewer } = usePermissions();
  
  const fetchCrops = useMemo(() => 
    currentOrganization 
      ? () => cropService.getOrganizationCrops(currentOrganization.id) 
      : null,
    [currentOrganization?.id]
  );
    
  const { data: crops, loading, error, refetch } = useFirestoreList<Crop>(fetchCrops);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingTestData, setLoadingTestData] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setIsAdmin(profile?.role === 'admin');
      }
    }
    checkAdminStatus();
  }, [currentUser]);

  const handleLoadTestData = async () => {
    if (!currentUser || !currentOrganization) return;
    
    if (!confirm('This will add all crops from the CSV (83 crops) to your database. Continue?')) {
      return;
    }

    setLoadingTestData(true);
    try {
      const count = await loadTestCropsData(currentUser.uid);
      alert(`Successfully added ${count} crops!`);
      refetch();
    } catch (error) {
      console.error('Error loading test data:', error);
      alert('Failed to load test data. Check console for details.');
    } finally {
      setLoadingTestData(false);
    }
  };
  
  if (!currentOrganization) {
    return <NoOrganization />;
  }
  
  if (loading) return <LoadingSpinner message="Loading crops..." />;
  if (error) return <ErrorMessage message={`Error loading crops: ${error}`} />;

  const handleAddCrop = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    refetch();
  };

  const handleViewCrop = (crop: Crop) => {
    console.log('View crop:', crop);
  };

  const handleEditCrop = (crop: Crop) => {
    console.log('Edit crop:', crop);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-start mb-6">
        <PageHeader 
          title="Crop Management" 
          actionLabel={canEdit() ? "+ Add New Crop" : undefined}
          onAction={canEdit() ? handleAddCrop : undefined}
        />
        {isAdmin && (
          <button
            onClick={handleLoadTestData}
            disabled={loadingTestData || isViewer()}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingTestData ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                🧪 Add Test Data
              </>
            )}
          </button>
        )}
      </div>
      
      {isViewer() && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          You have read-only access. Contact an admin to make changes.
        </div>
      )}
      
      <CropFilters />
      
      <Card className="overflow-hidden">
        <CropTable 
          crops={crops} 
          onView={handleViewCrop} 
          onEdit={handleEditCrop} 
        />
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Crop"
        size="lg"
      >
        <AddCropForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
          userId={currentUser?.uid || ''}
          organizationId={currentOrganization.id}
        />
      </Modal>
    </div>
  );
}
