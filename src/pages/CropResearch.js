import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestoreList } from '../hooks/useFirestore';
import { cropResearchService } from '../services/cropResearchService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getUserProfile } from '../services/userService';
import { loadTestCropResearchData } from '../utils/loadTestData';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import NoOrganization from '../components/ui/NoOrganization';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import AddCropResearchForm from '../components/cropResearch/AddCropResearchForm';
import * as XLSX from 'xlsx';
export default function CropResearchPage() {
    const { currentUser, currentOrganization } = useAuth();
    const { canEdit, isViewer } = usePermissions();
    const navigate = useNavigate();
    // Pass both organizationId and userId for backward compatibility
    const fetchCropResearch = useMemo(() => currentOrganization
        ? () => cropResearchService.getOrganizationCropResearch(currentOrganization.id, currentUser?.uid)
        : null, [currentOrganization?.id, currentUser?.uid]);
    const { data: cropResearch, loading, error, refetch } = useFirestoreList(fetchCropResearch);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loadingTestData, setLoadingTestData] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [viewMode, setViewMode] = useState('double');
    const [sortBy, setSortBy] = useState('suitability');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
    const [displayMode, setDisplayMode] = useState('cards');
    // Advanced filters
    const [revenueRange, setRevenueRange] = useState([0, 200000]);
    const [profitRange, setProfitRange] = useState([0, 100]);
    const [growingTimeRange, setGrowingTimeRange] = useState([0, 2555]);
    const [startupCostRange, setStartupCostRange] = useState([0, 50000]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedLaborIntensities, setSelectedLaborIntensities] = useState([]);
    const [selectedMarketDemands, setSelectedMarketDemands] = useState([]);
    const [minSuitability, setMinSuitability] = useState(0);
    const [quickFilters, setQuickFilters] = useState({ highRevenue: false, quickGrowing: false, lowStartup: false, highSuitability: false });
    // Import/Export state
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const fileInputRef = useRef(null);
    const exportMenuRef = useRef(null);
    // Close export menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const toggleCard = (cropId, e) => {
        e.stopPropagation();
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cropId)) {
                newSet.delete(cropId);
            }
            else {
                newSet.add(cropId);
            }
            return newSet;
        });
    };
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
        if (!currentUser)
            return;
        if (!confirm('This will add all crop research entries from the CSV (65 entries) to your database. Continue?')) {
            return;
        }
        setLoadingTestData(true);
        try {
            const count = await loadTestCropResearchData(currentUser.uid);
            alert(`Successfully added ${count} crop research entries!`);
            // Refetch data to show new entries
            refetch?.();
        }
        catch (error) {
            console.error('Error loading test data:', error);
            alert('Failed to load test data. Check console for details.');
        }
        finally {
            setLoadingTestData(false);
        }
    };
    // Export to CSV or Excel
    const handleExport = (format) => {
        if (cropResearch.length === 0) {
            alert('No data to export');
            return;
        }
        // Prepare data for export (remove internal fields)
        const exportData = cropResearch.map(crop => ({
            name: crop.name,
            category: crop.category,
            startupCostPerAcre: crop.startupCostPerAcre,
            annualRevenuePerAcre: crop.annualRevenuePerAcre,
            profitMargin: crop.profitMargin,
            growingTime: crop.growingTime,
            laborIntensity: crop.laborIntensity,
            bayAreaSuitability: crop.bayAreaSuitability,
            marketDemand: crop.marketDemand,
            waterNeeds: crop.waterNeeds,
            soilType: crop.soilType,
            commonPests: crop.commonPests,
            commonDiseases: crop.commonDiseases,
            nutrientRequirements: crop.nutrientRequirements,
            pricePerPound: crop.pricePerPound,
            harvestFrequency: crop.harvestFrequency,
            notes: crop.notes
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Crop Research');
        // Generate filename with date
        const date = new Date().toISOString().split('T')[0];
        const filename = `crop-research-${date}.${format}`;
        if (format === 'csv') {
            XLSX.writeFile(workbook, filename, { bookType: 'csv' });
        }
        else {
            XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
        }
        setShowExportMenu(false);
    };
    // Import from CSV or Excel
    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser || !currentOrganization)
            return;
        setImporting(true);
        setImportError('');
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            if (jsonData.length === 0) {
                throw new Error('No data found in file');
            }
            // Validate and import each row
            let importedCount = 0;
            const errors = [];
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                // Check required field
                if (!row.name) {
                    errors.push(`Row ${i + 2}: Missing name`);
                    continue;
                }
                try {
                    await cropResearchService.createCropResearch({
                        name: row.name || '',
                        category: row.category || 'Other',
                        startupCostPerAcre: row.startupCostPerAcre || '',
                        annualRevenuePerAcre: row.annualRevenuePerAcre || '',
                        profitMargin: row.profitMargin || '',
                        growingTime: row.growingTime || '',
                        laborIntensity: row.laborIntensity || 'Medium',
                        bayAreaSuitability: Number(row.bayAreaSuitability) || 3,
                        marketDemand: row.marketDemand || 'Medium',
                        waterNeeds: row.waterNeeds || 'Medium',
                        soilType: row.soilType || '',
                        commonPests: row.commonPests || '',
                        commonDiseases: row.commonDiseases || '',
                        nutrientRequirements: row.nutrientRequirements || '',
                        pricePerPound: row.pricePerPound || '',
                        harvestFrequency: row.harvestFrequency || '',
                        notes: row.notes || '',
                        organizationId: currentOrganization.id,
                        userId: currentUser.uid,
                        createdBy: currentUser.uid
                    });
                    importedCount++;
                }
                catch (err) {
                    errors.push(`Row ${i + 2}: ${err.message}`);
                }
            }
            if (importedCount > 0) {
                alert(`Successfully imported ${importedCount} entries!${errors.length > 0 ? `\n\n${errors.length} rows had errors.` : ''}`);
                refetch?.();
            }
            else {
                throw new Error('No entries could be imported. Check the file format.');
            }
            if (errors.length > 0) {
                console.error('Import errors:', errors);
            }
        }
        catch (error) {
            console.error('Import error:', error);
            setImportError(error.message || 'Failed to import file');
        }
        finally {
            setImporting(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    const handleAddCropResearch = () => {
        setIsAddModalOpen(true);
    };
    const handleAddSuccess = () => {
        setIsAddModalOpen(false);
        refetch();
    };
    if (!currentOrganization)
        return _jsx(NoOrganization, {});
    if (loading)
        return _jsx(LoadingSpinner, { message: "Loading crop research data..." });
    if (error)
        return _jsx(ErrorMessage, { message: `Error loading crop research: ${error}` });
    // Get unique categories
    const categories = ['all', ...new Set(cropResearch.map(c => c.category))];
    // Extract numeric value from string for filtering
    const extractNumber = (str, pattern = /([\d,]+)/) => {
        if (!str)
            return 0;
        const match = str.match(pattern);
        return match ? parseInt(match[1].replace(/,/g, '')) : 0;
    };
    // Convert growing time strings to days for filtering
    const getGrowingTimeDays = (timeStr) => {
        if (!timeStr)
            return 0;
        const lowerStr = timeStr.toLowerCase();
        // Extract the first number from the string
        const numMatch = lowerStr.match(/(\d+)/);
        if (!numMatch)
            return 0;
        const num = parseInt(numMatch[1]);
        // Convert based on unit
        if (lowerStr.includes('year')) {
            return num * 365;
        }
        else if (lowerStr.includes('month')) {
            return num * 30;
        }
        else if (lowerStr.includes('week')) {
            return num * 7;
        }
        else if (lowerStr.includes('day')) {
            return num;
        }
        else if (lowerStr.includes('annual') || lowerStr.includes('perennial')) {
            return 365;
        }
        // Default to days if no unit specified
        return num;
    };
    // Count active filters
    const activeFilterCount = ((selectedCategories.length > 0 ? 1 : 0) +
        (selectedLaborIntensities.length > 0 ? 1 : 0) +
        (selectedMarketDemands.length > 0 ? 1 : 0) +
        (minSuitability > 0 ? 1 : 0) +
        (revenueRange[0] > 0 || revenueRange[1] < 200000 ? 1 : 0) +
        (profitRange[0] > 0 || profitRange[1] < 100 ? 1 : 0) +
        (growingTimeRange[0] > 0 || growingTimeRange[1] < 2555 ? 1 : 0) +
        (startupCostRange[0] > 0 || startupCostRange[1] < 50000 ? 1 : 0) +
        Object.values(quickFilters).filter(v => v).length);
    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
        setSelectedCategories([]);
        setSelectedLaborIntensities([]);
        setSelectedMarketDemands([]);
        setMinSuitability(0);
        setRevenueRange([0, 200000]);
        setProfitRange([0, 100]);
        setGrowingTimeRange([0, 2555]);
        setStartupCostRange([0, 50000]);
        setQuickFilters({ highRevenue: false, quickGrowing: false, lowStartup: false, highSuitability: false });
    };
    // Toggle multi-select filter
    const toggleMultiSelect = (value, selected, setter) => {
        if (selected.includes(value)) {
            setter(selected.filter(v => v !== value));
        }
        else {
            setter([...selected, value]);
        }
    };
    // Filter crops with advanced filters
    const filteredCrops = cropResearch.filter(crop => {
        // Basic search and category
        const matchesCategory = selectedCategory === 'all' || crop.category === selectedCategory;
        const matchesSearch = searchTerm === '' ||
            crop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crop.category?.toLowerCase().includes(searchTerm.toLowerCase());
        // Multi-select categories
        const matchesCategories = selectedCategories.length === 0 || selectedCategories.includes(crop.category || '');
        // Labor intensity
        const matchesLabor = selectedLaborIntensities.length === 0 ||
            selectedLaborIntensities.includes(crop.laborIntensity || '');
        // Market demand
        const matchesDemand = selectedMarketDemands.length === 0 ||
            selectedMarketDemands.includes(crop.marketDemand || '');
        // Bay Area suitability
        const matchesSuitability = (crop.bayAreaSuitability || 0) >= minSuitability;
        // Revenue range
        const revenue = extractNumber(crop.annualRevenuePerAcre);
        const matchesRevenue = revenue >= revenueRange[0] && revenue <= revenueRange[1];
        // Profit range
        const profit = extractNumber(crop.profitMargin);
        const matchesProfit = profit >= profitRange[0] && profit <= profitRange[1];
        // Growing time range (convert to days)
        const growingTime = getGrowingTimeDays(crop.growingTime);
        const matchesGrowingTime = growingTime >= growingTimeRange[0] && growingTime <= growingTimeRange[1];
        // Startup cost range
        const startupCost = extractNumber(crop.startupCostPerAcre);
        const matchesStartupCost = startupCost >= startupCostRange[0] && startupCost <= startupCostRange[1];
        // Quick filters
        const matchesQuickFilters = ((!quickFilters.highRevenue || revenue >= 50000) &&
            (!quickFilters.quickGrowing || growingTime <= 30) &&
            (!quickFilters.lowStartup || startupCost <= 5000) &&
            (!quickFilters.highSuitability || crop.bayAreaSuitability >= 4));
        return matchesCategory && matchesSearch && matchesCategories && matchesLabor &&
            matchesDemand && matchesSuitability && matchesRevenue && matchesProfit &&
            matchesGrowingTime && matchesStartupCost && matchesQuickFilters;
    });
    // Sort crops based on selected criteria
    const sortedCrops = [...filteredCrops].sort((a, b) => {
        switch (sortBy) {
            case 'suitability':
                return (b.bayAreaSuitability || 0) - (a.bayAreaSuitability || 0);
            case 'revenue': {
                // Extract first number from revenue string (e.g., "$40,000-$100,000" -> 40000)
                const getRevenueValue = (str) => {
                    if (!str)
                        return 0;
                    const match = str.match(/\$?([\d,]+)/);
                    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
                };
                return getRevenueValue(b.annualRevenuePerAcre) - getRevenueValue(a.annualRevenuePerAcre);
            }
            case 'profit': {
                // Extract first number from profit margin (e.g., "40-60%" -> 40)
                const getProfitValue = (str) => {
                    if (!str)
                        return 0;
                    const match = str.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                };
                return getProfitValue(b.profitMargin) - getProfitValue(a.profitMargin);
            }
            case 'growingTime':
                // Convert to days for proper sorting
                return getGrowingTimeDays(a.growingTime) - getGrowingTimeDays(b.growingTime);
            default:
                return 0;
        }
    });
    const getSuitabilityStars = (rating) => {
        return '⭐'.repeat(rating || 0);
    };
    const getSuitabilityColor = (rating) => {
        if (!rating)
            return 'text-gray-600';
        if (rating === 5)
            return 'text-green-600 font-semibold';
        if (rating === 4)
            return 'text-emerald-600';
        if (rating === 3)
            return 'text-yellow-600';
        return 'text-orange-600';
    };
    const getIntensityBadge = (intensity) => {
        if (!intensity)
            return 'bg-gray-100 text-gray-800';
        const colors = {
            'Low': 'bg-green-100 text-green-800',
            'Low-Medium': 'bg-emerald-100 text-emerald-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'Medium-High': 'bg-orange-100 text-orange-800',
            'High': 'bg-red-100 text-red-800',
            'Very High': 'bg-red-200 text-red-900'
        };
        return colors[intensity] || 'bg-gray-100 text-gray-800';
    };
    const getDemandBadge = (demand) => {
        if (!demand)
            return 'bg-gray-100 text-gray-800';
        const colors = {
            'Low': 'bg-gray-100 text-gray-800',
            'Medium': 'bg-blue-100 text-blue-800',
            'Medium-High': 'bg-indigo-100 text-indigo-800',
            'High': 'bg-purple-100 text-purple-800',
            'Very High': 'bg-fuchsia-100 text-fuchsia-800'
        };
        return colors[demand] || 'bg-gray-100 text-gray-800';
    };
    return (_jsxs("div", { className: "px-4 py-6 sm:px-0", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-bold text-gray-900", children: "Crop Research Database" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Market research and profitability analysis for Bay Area crops" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2 sm:gap-3", children: [canEdit() && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: handleAddCropResearch, className: "w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center justify-center gap-2", children: "+ Add New Entry" }), _jsx("button", { onClick: () => fileInputRef.current?.click(), disabled: importing, className: "w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2", children: importing ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-4 w-4", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Importing..."] })) : (_jsx(_Fragment, { children: "\uD83D\uDCE5 Import" })) }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".csv,.xlsx,.xls", onChange: handleImport, className: "hidden" })] })), _jsxs("div", { className: "relative", ref: exportMenuRef, children: [_jsxs("button", { onClick: () => setShowExportMenu(!showExportMenu), className: "w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center gap-2", children: ["\uD83D\uDCE4 Export", _jsx("svg", { className: `h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`, fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }) })] }), showExportMenu && (_jsx("div", { className: "absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50", children: _jsxs("div", { className: "py-1", children: [_jsx("button", { onClick: () => handleExport('csv'), className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: "\uD83D\uDCC4 Download as CSV" }), _jsx("button", { onClick: () => handleExport('xlsx'), className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: "\uD83D\uDCCA Download as Excel" })] }) }))] }), isAdmin && (_jsx("button", { onClick: handleLoadTestData, disabled: loadingTestData || isViewer(), className: "w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: loadingTestData ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-4 w-4", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Loading..."] })) : (_jsx(_Fragment, { children: "\uD83E\uDDEA Test Data" })) }))] })] }), isViewer() && (_jsx("div", { className: "mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded", children: "You have read-only access. Contact an admin to make changes." })), importError && (_jsxs("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center", children: [_jsxs("span", { children: ["Import error: ", importError] }), _jsx("button", { onClick: () => setImportError(''), className: "text-red-800 hover:text-red-900", children: "\u2715" })] })), _jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsxs("button", { onClick: () => setIsFilterPanelOpen(!isFilterPanelOpen), className: "flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors", children: [_jsx("span", { className: `transform transition-transform duration-200 ${isFilterPanelOpen ? 'rotate-90' : ''}`, children: "\u25B6" }), "Advanced Filters", activeFilterCount > 0 && (_jsx("span", { className: "px-2 py-0.5 text-xs bg-emerald-600 text-white rounded-full", children: activeFilterCount }))] }) }), activeFilterCount > 0 && (_jsx("button", { onClick: clearAllFilters, className: "text-sm text-red-600 hover:text-red-700 font-medium", children: "Clear All Filters" }))] }), _jsxs("div", { className: `transition-all duration-300 overflow-hidden ${isFilterPanelOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`, children: [_jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Quick Filters" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2", children: [_jsx("button", { onClick: () => setQuickFilters(prev => ({ ...prev, highRevenue: !prev.highRevenue })), className: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${quickFilters.highRevenue
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\uD83D\uDCB0 High Revenue ($50k+)" }), _jsx("button", { onClick: () => setQuickFilters(prev => ({ ...prev, quickGrowing: !prev.quickGrowing })), className: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${quickFilters.quickGrowing
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\u26A1 Quick Growing (\u226430 days)" }), _jsx("button", { onClick: () => setQuickFilters(prev => ({ ...prev, lowStartup: !prev.lowStartup })), className: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${quickFilters.lowStartup
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\uD83D\uDCB5 Low Startup (\u2264$5k)" }), _jsx("button", { onClick: () => setQuickFilters(prev => ({ ...prev, highSuitability: !prev.highSuitability })), className: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${quickFilters.highSuitability
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\u2B50 Bay Area Ideal (4-5 stars)" })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "search", className: "block text-sm font-medium text-gray-700 mb-2", children: "Search Crops" }), _jsx("input", { type: "text", id: "search", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Search by name or category...", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter by Category" }), _jsx("select", { id: "category", value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", children: categories.map(cat => (_jsx("option", { value: cat, children: cat === 'all' ? 'All Categories' : cat }, cat))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "sort", className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort By" }), _jsxs("select", { id: "sort", value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500", children: [_jsx("option", { value: "suitability", children: "Bay Area Suitability" }), _jsx("option", { value: "revenue", children: "Annual Revenue" }), _jsx("option", { value: "profit", children: "Profit Margin" }), _jsx("option", { value: "growingTime", children: "Growing Time" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Annual Revenue per Acre: $", revenueRange[0].toLocaleString(), " - $", revenueRange[1].toLocaleString()] }), _jsxs("div", { className: "flex gap-3 items-center", children: [_jsx("input", { type: "range", min: "0", max: "200000", step: "5000", value: revenueRange[0], onChange: (e) => setRevenueRange([parseInt(e.target.value), revenueRange[1]]), className: "flex-1" }), _jsx("input", { type: "range", min: "0", max: "200000", step: "5000", value: revenueRange[1], onChange: (e) => setRevenueRange([revenueRange[0], parseInt(e.target.value)]), className: "flex-1" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Profit Margin: ", profitRange[0], "% - ", profitRange[1], "%"] }), _jsxs("div", { className: "flex gap-3 items-center", children: [_jsx("input", { type: "range", min: "0", max: "100", step: "5", value: profitRange[0], onChange: (e) => setProfitRange([parseInt(e.target.value), profitRange[1]]), className: "flex-1" }), _jsx("input", { type: "range", min: "0", max: "100", step: "5", value: profitRange[1], onChange: (e) => setProfitRange([profitRange[0], parseInt(e.target.value)]), className: "flex-1" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Growing Time: ", growingTimeRange[0], " - ", growingTimeRange[1], " days (", Math.round(growingTimeRange[1] / 365 * 10) / 10, " years max)"] }), _jsxs("div", { className: "flex gap-3 items-center", children: [_jsx("input", { type: "range", min: "0", max: "2555", step: "7", value: growingTimeRange[0], onChange: (e) => setGrowingTimeRange([parseInt(e.target.value), growingTimeRange[1]]), className: "flex-1" }), _jsx("input", { type: "range", min: "0", max: "2555", step: "7", value: growingTimeRange[1], onChange: (e) => setGrowingTimeRange([growingTimeRange[0], parseInt(e.target.value)]), className: "flex-1" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Startup Cost: $", startupCostRange[0].toLocaleString(), " - $", startupCostRange[1].toLocaleString()] }), _jsxs("div", { className: "flex gap-3 items-center", children: [_jsx("input", { type: "range", min: "0", max: "50000", step: "1000", value: startupCostRange[0], onChange: (e) => setStartupCostRange([parseInt(e.target.value), startupCostRange[1]]), className: "flex-1" }), _jsx("input", { type: "range", min: "0", max: "50000", step: "1000", value: startupCostRange[1], onChange: (e) => setStartupCostRange([startupCostRange[0], parseInt(e.target.value)]), className: "flex-1" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Categories ", selectedCategories.length > 0 && `(${selectedCategories.length})`] }), _jsx("div", { className: "max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white", children: categories.filter(c => c !== 'all').map(category => (_jsxs("label", { className: "flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedCategories.includes(category), onChange: () => toggleMultiSelect(category, selectedCategories, setSelectedCategories), className: "rounded text-emerald-600 focus:ring-emerald-500" }), _jsx("span", { className: "text-sm text-gray-700", children: category })] }, category))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Labor Intensity ", selectedLaborIntensities.length > 0 && `(${selectedLaborIntensities.length})`] }), _jsx("div", { className: "max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white", children: ['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High', 'Very High'].map(intensity => (_jsxs("label", { className: "flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedLaborIntensities.includes(intensity), onChange: () => toggleMultiSelect(intensity, selectedLaborIntensities, setSelectedLaborIntensities), className: "rounded text-emerald-600 focus:ring-emerald-500" }), _jsx("span", { className: "text-sm text-gray-700", children: intensity })] }, intensity))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Market Demand ", selectedMarketDemands.length > 0 && `(${selectedMarketDemands.length})`] }), _jsx("div", { className: "max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white", children: ['Low', 'Medium', 'Medium-High', 'High', 'Very High'].map(demand => (_jsxs("label", { className: "flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedMarketDemands.includes(demand), onChange: () => toggleMultiSelect(demand, selectedMarketDemands, setSelectedMarketDemands), className: "rounded text-emerald-600 focus:ring-emerald-500" }), _jsx("span", { className: "text-sm text-gray-700", children: demand })] }, demand))) })] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Minimum Bay Area Suitability: ", minSuitability > 0 ? '⭐'.repeat(minSuitability) : 'Any'] }), _jsx("div", { className: "flex flex-wrap gap-2", children: [0, 1, 2, 3, 4, 5].map(rating => (_jsx("button", { onClick: () => setMinSuitability(rating), className: `flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${minSuitability === rating
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: rating === 0 ? 'Any' : '⭐'.repeat(rating) }, rating))) })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 pt-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "bg-emerald-50 border-l-4 border-emerald-600 px-4 py-3 rounded-md", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-emerald-700 font-semibold text-lg", children: sortedCrops.length }), _jsxs("span", { className: "text-gray-600 text-sm", children: ["of ", cropResearch.length, " crops", sortedCrops.length !== cropResearch.length && (_jsx("span", { className: "ml-1 text-emerald-600 font-medium", children: "(filtered)" }))] })] }) }), activeFilterCount > 0 && (_jsxs("button", { onClick: clearAllFilters, className: "px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }), "Reset Filters"] }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setViewMode('single'), className: `px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'single'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: "\uD83D\uDCC4 Single Column" }), _jsx("button", { onClick: () => setViewMode('double'), className: `px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'double'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: "\uD83D\uDCCB Two Columns" }), _jsx("button", { onClick: () => setDisplayMode('cards'), className: `px-3 py-1.5 text-sm rounded-md transition-colors ${displayMode === 'cards'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: "\uD83C\uDFA8 Cards" }), _jsx("button", { onClick: () => setDisplayMode('table'), className: `px-3 py-1.5 text-sm rounded-md transition-colors ${displayMode === 'table'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: "\uD83D\uDCCA Table" })] })] })] }) }), displayMode === 'cards' && (_jsx("div", { className: `grid gap-6 ${viewMode === 'double' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`, children: sortedCrops.map(crop => {
                    const isExpanded = expandedCards.has(crop.id);
                    return (_jsx(Card, { className: "hover:shadow-lg transition-all duration-300", children: _jsxs("div", { className: "p-6 cursor-pointer", onClick: () => navigate(`/crop-research/${crop.id}`), children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h3", { className: "text-xl font-bold text-gray-900 flex items-center gap-2", children: [crop.name, _jsx("button", { onClick: (e) => toggleCard(crop.id, e), className: "transform transition-transform duration-300 text-emerald-600 hover:text-emerald-700 focus:outline-none", children: _jsx("span", { className: `inline-block ${isExpanded ? 'rotate-180' : ''}`, children: "\u25BC" }) })] }), _jsx("p", { className: "text-sm text-gray-600", children: crop.category })] }), _jsxs("div", { className: `text-right ${getSuitabilityColor(crop.bayAreaSuitability)}`, children: [_jsx("div", { className: "text-2xl", children: getSuitabilityStars(crop.bayAreaSuitability) }), _jsx("div", { className: "text-xs whitespace-nowrap", children: "Bay Area Fit" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "bg-emerald-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Revenue/Acre" }), _jsx("p", { className: "font-bold text-emerald-700", children: crop.annualRevenuePerAcre })] }), _jsxs("div", { className: "bg-green-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Profit Margin" }), _jsx("p", { className: "font-bold text-green-700", children: crop.profitMargin })] })] }), _jsxs("div", { className: `overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [_jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Startup Cost/Acre" }), _jsx("p", { className: "font-semibold text-gray-800", children: crop.startupCostPerAcre })] }), _jsxs("div", { className: "bg-blue-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Growing Time" }), _jsx("p", { className: "font-semibold text-blue-800", children: crop.growingTime })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [_jsxs("span", { className: `px-3 py-1.5 text-xs font-medium rounded-full ${getIntensityBadge(crop.laborIntensity)}`, children: ["\uD83D\uDCAA Labor: ", crop.laborIntensity] }), _jsxs("span", { className: `px-3 py-1.5 text-xs font-medium rounded-full ${getDemandBadge(crop.marketDemand)}`, children: ["\uD83D\uDCC8 Demand: ", crop.marketDemand] }), _jsxs("span", { className: "px-3 py-1.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800", children: ["\uD83D\uDCA7 Water: ", crop.waterNeeds] })] }), _jsx("div", { className: "bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg mb-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Price per Pound" }), _jsx("p", { className: "font-bold text-xl text-emerald-700", children: crop.pricePerPound })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Harvest" }), _jsx("p", { className: "text-sm font-medium text-gray-800", children: crop.harvestFrequency })] })] }) }), _jsxs("div", { className: "bg-amber-50 p-4 rounded-lg mb-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-3 flex items-center gap-2", children: "\uD83C\uDF31 Growing Requirements" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex", children: [_jsx("span", { className: "font-medium text-gray-700 w-24", children: "Soil:" }), _jsx("span", { className: "text-gray-600 flex-1", children: crop.soilType })] }), _jsxs("div", { className: "flex", children: [_jsx("span", { className: "font-medium text-gray-700 w-24", children: "Nutrients:" }), _jsx("span", { className: "text-gray-600 flex-1", children: crop.nutrientRequirements })] })] })] }), _jsxs("div", { className: "bg-red-50 p-4 rounded-lg mb-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-3 flex items-center gap-2", children: "\u26A0\uFE0F Challenges" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-700", children: "\uD83D\uDC1B Common Pests:" }), _jsx("p", { className: "text-gray-600 mt-1", children: crop.commonPests })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-700", children: "\uD83E\uDDA0 Common Diseases:" }), _jsx("p", { className: "text-gray-600 mt-1", children: crop.commonDiseases })] })] })] }), crop.notes && (_jsxs("div", { className: "bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2 flex items-center gap-2", children: "\uD83D\uDCA1 Notes" }), _jsx("p", { className: "text-sm text-gray-700 leading-relaxed", children: crop.notes })] })), _jsx("button", { onClick: (e) => toggleCard(crop.id, e), className: "text-xs text-gray-500 hover:text-emerald-600 transition-colors", children: isExpanded ? '▲ Click to collapse' : '▼ Click to view full details' })] }), _jsx("div", { className: "mt-4 pt-3 border-t border-gray-200 text-center", children: _jsx("p", { className: "text-xs text-gray-500", children: isExpanded ? 'Click to collapse' : 'Click to view full details' }) })] }) }, crop.id));
                }) })), displayMode === 'table' && (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100 border-b-2 border-gray-200", children: [_jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Crop Name" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Category" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-gray-900", children: "Bay Area Fit" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-gray-900", children: "Revenue/Acre" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-gray-900", children: "Profit Margin" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-gray-900", children: "Growing Time" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Labor" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Market Demand" }), _jsx("th", { className: "px-4 py-3 text-center font-semibold text-gray-900", children: "Action" })] }) }), _jsx("tbody", { children: sortedCrops.map((crop, idx) => (_jsxs("tr", { className: `border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`, children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: crop.name }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: crop.category }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx("span", { className: `text-lg ${getSuitabilityColor(crop.bayAreaSuitability)}`, children: getSuitabilityStars(crop.bayAreaSuitability) }) }), _jsx("td", { className: "px-4 py-3 text-right text-emerald-700 font-semibold", children: crop.annualRevenuePerAcre }), _jsx("td", { className: "px-4 py-3 text-right text-green-700 font-semibold", children: crop.profitMargin }), _jsx("td", { className: "px-4 py-3 text-right text-gray-600", children: crop.growingTime }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: crop.laborIntensity }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: crop.marketDemand }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsx("button", { onClick: () => navigate(`/crop-research/${crop.id}`), className: "text-emerald-600 hover:text-emerald-700 font-medium text-sm hover:underline", children: "View" }) })] }, crop.id))) })] }) }) })), sortedCrops.length === 0 && (_jsx(Card, { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "No crops found matching your search criteria." }) })), _jsx(Modal, { isOpen: isAddModalOpen, onClose: () => setIsAddModalOpen(false), title: "Add New Crop Research Entry", children: currentUser && currentOrganization && (_jsx(AddCropResearchForm, { userId: currentUser.uid, organizationId: currentOrganization.id, onSuccess: handleAddSuccess, onCancel: () => setIsAddModalOpen(false) })) })] }));
}
