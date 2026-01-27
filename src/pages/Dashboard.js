import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        if (!currentOrganization)
            return;
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
        }
        catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
        finally {
            setLoading(false);
        }
    }
    if (!currentOrganization) {
        return _jsx(NoOrganization, {});
    }
    return (_jsxs("div", { className: "px-4 py-6 sm:px-0", children: [_jsxs("h2", { className: "text-2xl sm:text-3xl font-bold text-gray-900 mb-6", children: [currentOrganization.name, " Dashboard"] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("div", { className: "card", children: [_jsx("h3", { className: "text-xs sm:text-sm font-medium text-gray-500", children: "Active Crops" }), _jsx("p", { className: "mt-2 text-2xl sm:text-3xl font-semibold text-gray-900", children: loading ? '...' : stats.activeCrops }), _jsx("p", { className: "mt-1 text-xs sm:text-sm text-gray-600", children: "Currently growing" })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "text-xs sm:text-sm font-medium text-gray-500", children: "Recent Harvests" }), _jsx("p", { className: "mt-2 text-2xl sm:text-3xl font-semibold text-gray-900", children: loading ? '...' : stats.recentHarvests }), _jsx("p", { className: "mt-1 text-xs sm:text-sm text-gray-600", children: "This month" })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "text-xs sm:text-sm font-medium text-gray-500", children: "Revenue" }), _jsx("p", { className: "mt-2 text-2xl sm:text-3xl font-semibold text-gray-900", children: "$0" }), _jsx("p", { className: "mt-1 text-xs sm:text-sm text-gray-600", children: "Coming soon" })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "text-xs sm:text-sm font-medium text-gray-500", children: "Customers" }), _jsx("p", { className: "mt-2 text-2xl sm:text-3xl font-semibold text-gray-900", children: loading ? '...' : stats.activeCustomers }), _jsx("p", { className: "mt-1 text-xs sm:text-sm text-gray-600", children: "Active accounts" })] })] }), _jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-base sm:text-lg font-medium text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 sm:flex sm:space-x-4 gap-3 sm:gap-0", children: [_jsx("button", { className: "btn-primary w-full sm:w-auto", children: "Log Harvest" }), _jsx("button", { className: "btn-secondary w-full sm:w-auto", children: "Add Crop" }), _jsx("button", { className: "btn-secondary w-full sm:w-auto", children: "New Customer" })] })] }), _jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-base sm:text-lg font-medium text-gray-900 mb-4", children: "Recent Activity" }), _jsx("div", { className: "card", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm sm:text-base", children: "Microgreens harvested" }), _jsx("p", { className: "text-sm text-gray-600", children: "Field A, Section 2" })] }), _jsx("span", { className: "text-sm text-gray-500", children: "2 hours ago" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm sm:text-base", children: "New strawberry planting" }), _jsx("p", { className: "text-sm text-gray-600", children: "Field B, Section 1" })] }), _jsx("span", { className: "text-sm text-gray-500", children: "Yesterday" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm sm:text-base", children: "Customer order shipped" }), _jsx("p", { className: "text-sm text-gray-600", children: "Bay Leaf Restaurant - $450" })] }), _jsx("span", { className: "text-sm text-gray-500", children: "2 days ago" })] })] }) })] })] }));
}
