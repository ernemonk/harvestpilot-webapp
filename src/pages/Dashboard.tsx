import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cropService } from '../services/cropService';
import { harvestService } from '../services/harvestService';
import { customerService } from '../services/customerService';
import NoOrganization from '../components/ui/NoOrganization';

export default function Dashboard() {
  const { currentOrganization } = useAuth();
  const [stats, setStats] = useState({
    activeCrops: 0,
    recentHarvests: 0,
    activeCustomers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      loadStats();
    }
  }, [currentOrganization]);

  async function loadStats() {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const [activeCrops, monthlyHarvests, activeCustomers] = await Promise.all([
        cropService.getActiveCropsCount(currentOrganization.id),
        harvestService.getMonthlyHarvestCount(currentOrganization.id),
        customerService.getActiveCustomersCount(currentOrganization.id)
      ]);
      
      setStats({
        activeCrops,
        recentHarvests: monthlyHarvests,
        activeCustomers
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!currentOrganization) {
    return <NoOrganization />;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        {currentOrganization.name} Dashboard
      </h2>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="card">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Active Crops</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
            {loading ? '...' : stats.activeCrops}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">Currently growing</p>
        </div>
        
        <div className="card">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Recent Harvests</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
            {loading ? '...' : stats.recentHarvests}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">This month</p>
        </div>
        
        <div className="card">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Revenue</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">$0</p>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">Coming soon</p>
        </div>
        
        <div className="card">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Customers</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
            {loading ? '...' : stats.activeCustomers}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">Active accounts</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:flex sm:space-x-4 gap-3 sm:gap-0">
          <button className="btn-primary w-full sm:w-auto">Log Harvest</button>
          <button className="btn-secondary w-full sm:w-auto">Add Crop</button>
          <button className="btn-secondary w-full sm:w-auto">New Customer</button>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="card">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900 text-sm sm:text-base">Microgreens harvested</p>
                <p className="text-sm text-gray-600">Field A, Section 2</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900 text-sm sm:text-base">New strawberry planting</p>
                <p className="text-sm text-gray-600">Field B, Section 1</p>
              </div>
              <span className="text-sm text-gray-500">Yesterday</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900 text-sm sm:text-base">Customer order shipped</p>
                <p className="text-sm text-gray-600">Bay Leaf Restaurant - $450</p>
              </div>
              <span className="text-sm text-gray-500">2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
