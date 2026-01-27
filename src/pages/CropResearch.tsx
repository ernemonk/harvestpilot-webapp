import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestoreList } from '../hooks/useFirestore';
import { cropResearchService } from '../services/cropResearchService';
import type { CropResearch } from '../types';
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
  const fetchCropResearch = useMemo(() => 
    currentOrganization 
      ? () => cropResearchService.getOrganizationCropResearch(currentOrganization.id, currentUser?.uid) 
      : null,
    [currentOrganization?.id, currentUser?.uid]
  );
    
  const { data: cropResearch, loading, error, refetch } = useFirestoreList<CropResearch>(fetchCropResearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingTestData, setLoadingTestData] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'single' | 'double'>('double');
  const [sortBy, setSortBy] = useState<'suitability' | 'revenue' | 'profit' | 'growingTime'>('suitability');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  
  // Advanced filters
  const [revenueRange, setRevenueRange] = useState<[number, number]>([0, 200000]);
  const [profitRange, setProfitRange] = useState<[number, number]>([0, 100]);
  const [growingTimeRange, setGrowingTimeRange] = useState<[number, number]>([0, 2555]);
  const [startupCostRange, setStartupCostRange] = useState<[number, number]>([0, 50000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLaborIntensities, setSelectedLaborIntensities] = useState<string[]>([]);
  const [selectedMarketDemands, setSelectedMarketDemands] = useState<string[]>([]);
  const [minSuitability, setMinSuitability] = useState<number>(0);
  const [quickFilters, setQuickFilters] = useState<{
    highRevenue: boolean;
    quickGrowing: boolean;
    lowStartup: boolean;
    highSuitability: boolean;
  }>({ highRevenue: false, quickGrowing: false, lowStartup: false, highSuitability: false });

  // Import/Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCard = (cropId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cropId)) {
        newSet.delete(cropId);
      } else {
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
    if (!currentUser) return;
    
    if (!confirm('This will add all crop research entries from the CSV (65 entries) to your database. Continue?')) {
      return;
    }

    setLoadingTestData(true);
    try {
      const count = await loadTestCropResearchData(currentUser.uid);
      alert(`Successfully added ${count} crop research entries!`);
      // Refetch data to show new entries
      refetch?.();
    } catch (error) {
      console.error('Error loading test data:', error);
      alert('Failed to load test data. Check console for details.');
    } finally {
      setLoadingTestData(false);
    }
  };

  // Export to CSV or Excel
  const handleExport = (format: 'csv' | 'xlsx') => {
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
    } else {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    }

    setShowExportMenu(false);
  };

  // Import from CSV or Excel
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || !currentOrganization) return;

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
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
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
        } catch (err: any) {
          errors.push(`Row ${i + 2}: ${err.message}`);
        }
      }

      if (importedCount > 0) {
        alert(`Successfully imported ${importedCount} entries!${errors.length > 0 ? `\n\n${errors.length} rows had errors.` : ''}`);
        refetch?.();
      } else {
        throw new Error('No entries could be imported. Check the file format.');
      }

      if (errors.length > 0) {
        console.error('Import errors:', errors);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setImportError(error.message || 'Failed to import file');
    } finally {
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

  if (!currentOrganization) return <NoOrganization />;
  if (loading) return <LoadingSpinner message="Loading crop research data..." />;
  if (error) return <ErrorMessage message={`Error loading crop research: ${error}`} />;

  // Get unique categories
  const categories = ['all', ...new Set(cropResearch.map(c => c.category))];

  // Extract numeric value from string for filtering
  const extractNumber = (str: string | undefined | null, pattern: RegExp = /([\d,]+)/) => {
    if (!str) return 0;
    const match = str.match(pattern);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  };

  // Convert growing time strings to days for filtering
  const getGrowingTimeDays = (timeStr: string | undefined | null): number => {
    if (!timeStr) return 0;
    
    const lowerStr = timeStr.toLowerCase();
    
    // Extract the first number from the string
    const numMatch = lowerStr.match(/(\d+)/);
    if (!numMatch) return 0;
    
    const num = parseInt(numMatch[1]);
    
    // Convert based on unit
    if (lowerStr.includes('year')) {
      return num * 365;
    } else if (lowerStr.includes('month')) {
      return num * 30;
    } else if (lowerStr.includes('week')) {
      return num * 7;
    } else if (lowerStr.includes('day')) {
      return num;
    } else if (lowerStr.includes('annual') || lowerStr.includes('perennial')) {
      return 365;
    }
    
    // Default to days if no unit specified
    return num;
  };

  // Count active filters
  const activeFilterCount = (
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedLaborIntensities.length > 0 ? 1 : 0) +
    (selectedMarketDemands.length > 0 ? 1 : 0) +
    (minSuitability > 0 ? 1 : 0) +
    (revenueRange[0] > 0 || revenueRange[1] < 200000 ? 1 : 0) +
    (profitRange[0] > 0 || profitRange[1] < 100 ? 1 : 0) +
    (growingTimeRange[0] > 0 || growingTimeRange[1] < 2555 ? 1 : 0) +
    (startupCostRange[0] > 0 || startupCostRange[1] < 50000 ? 1 : 0) +
    Object.values(quickFilters).filter(v => v).length
  );

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
  const toggleMultiSelect = (value: string, selected: string[], setter: (val: string[]) => void) => {
    if (selected.includes(value)) {
      setter(selected.filter(v => v !== value));
    } else {
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
    const matchesQuickFilters = (
      (!quickFilters.highRevenue || revenue >= 50000) &&
      (!quickFilters.quickGrowing || growingTime <= 30) &&
      (!quickFilters.lowStartup || startupCost <= 5000) &&
      (!quickFilters.highSuitability || crop.bayAreaSuitability >= 4)
    );
    
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
        const getRevenueValue = (str: string | undefined | null) => {
          if (!str) return 0;
          const match = str.match(/\$?([\d,]+)/);
          return match ? parseInt(match[1].replace(/,/g, '')) : 0;
        };
        return getRevenueValue(b.annualRevenuePerAcre) - getRevenueValue(a.annualRevenuePerAcre);
      }
      case 'profit': {
        // Extract first number from profit margin (e.g., "40-60%" -> 40)
        const getProfitValue = (str: string | undefined | null) => {
          if (!str) return 0;
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

  const getSuitabilityStars = (rating: number | undefined | null) => {
    return '⭐'.repeat(rating || 0);
  };

  const getSuitabilityColor = (rating: number | undefined | null) => {
    if (!rating) return 'text-gray-600';
    if (rating === 5) return 'text-green-600 font-semibold';
    if (rating === 4) return 'text-emerald-600';
    if (rating === 3) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getIntensityBadge = (intensity: string | undefined | null) => {
    if (!intensity) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      'Low': 'bg-green-100 text-green-800',
      'Low-Medium': 'bg-emerald-100 text-emerald-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Medium-High': 'bg-orange-100 text-orange-800',
      'High': 'bg-red-100 text-red-800',
      'Very High': 'bg-red-200 text-red-900'
    };
    return colors[intensity] || 'bg-gray-100 text-gray-800';
  };

  const getDemandBadge = (demand: string | undefined | null) => {
    if (!demand) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'Medium-High': 'bg-indigo-100 text-indigo-800',
      'High': 'bg-purple-100 text-purple-800',
      'Very High': 'bg-fuchsia-100 text-fuchsia-800'
    };
    return colors[demand] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crop Research Database</h1>
          <p className="mt-1 text-sm text-gray-600">Market research and profitability analysis for Bay Area crops</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {canEdit() && (
            <>
              <button
                onClick={handleAddCropResearch}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                + Add New Entry
              </button>
              
              {/* Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    📥 Import
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </>
          )}
          
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              📤 Export
              <svg className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📄 Download as CSV
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📊 Download as Excel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {isAdmin && (
            <button
              onClick={handleLoadTestData}
              disabled={loadingTestData || isViewer()}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  🧪 Test Data
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isViewer() && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          You have read-only access. Contact an admin to make changes.
        </div>
      )}

      {importError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center">
          <span>Import error: {importError}</span>
          <button onClick={() => setImportError('')} className="text-red-800 hover:text-red-900">
            ✕
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <Card className="mb-6">
        <div className="p-4">
          {/* Filter Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
              >
                <span className={`transform transition-transform duration-200 ${isFilterPanelOpen ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                Advanced Filters
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-emerald-600 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Collapsible Filter Content */}
          <div className={`transition-all duration-300 overflow-hidden ${isFilterPanelOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {/* Quick Filters */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
                <button
                  onClick={() => setQuickFilters(prev => ({ ...prev, highRevenue: !prev.highRevenue }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    quickFilters.highRevenue 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 High Revenue ($50k+)
                </button>
                <button
                  onClick={() => setQuickFilters(prev => ({ ...prev, quickGrowing: !prev.quickGrowing }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    quickFilters.quickGrowing 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚡ Quick Growing (≤30 days)
                </button>
                <button
                  onClick={() => setQuickFilters(prev => ({ ...prev, lowStartup: !prev.lowStartup }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    quickFilters.lowStartup 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💵 Low Startup (≤$5k)
                </button>
                <button
                  onClick={() => setQuickFilters(prev => ({ ...prev, highSuitability: !prev.highSuitability }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    quickFilters.highSuitability 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⭐ Bay Area Ideal (4-5 stars)
                </button>
              </div>
            </div>

            {/* Basic Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Crops
                </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="suitability">Bay Area Suitability</option>
                  <option value="revenue">Annual Revenue</option>
                  <option value="profit">Profit Margin</option>
                  <option value="growingTime">Growing Time</option>
                </select>
              </div>
            </div>

            {/* Range Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue per Acre: ${revenueRange[0].toLocaleString()} - ${revenueRange[1].toLocaleString()}
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="5000"
                    value={revenueRange[0]}
                    onChange={(e) => setRevenueRange([parseInt(e.target.value), revenueRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="5000"
                    value={revenueRange[1]}
                    onChange={(e) => setRevenueRange([revenueRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Profit Margin Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Margin: {profitRange[0]}% - {profitRange[1]}%
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={profitRange[0]}
                    onChange={(e) => setProfitRange([parseInt(e.target.value), profitRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={profitRange[1]}
                    onChange={(e) => setProfitRange([profitRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Growing Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Growing Time: {growingTimeRange[0]} - {growingTimeRange[1]} days ({Math.round(growingTimeRange[1] / 365 * 10) / 10} years max)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="0"
                    max="2555"
                    step="7"
                    value={growingTimeRange[0]}
                    onChange={(e) => setGrowingTimeRange([parseInt(e.target.value), growingTimeRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="2555"
                    step="7"
                    value={growingTimeRange[1]}
                    onChange={(e) => setGrowingTimeRange([growingTimeRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Startup Cost Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Startup Cost: ${startupCostRange[0].toLocaleString()} - ${startupCostRange[1].toLocaleString()}
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={startupCostRange[0]}
                    onChange={(e) => setStartupCostRange([parseInt(e.target.value), startupCostRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={startupCostRange[1]}
                    onChange={(e) => setStartupCostRange([startupCostRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Select Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Category Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {categories.filter(c => c !== 'all').map(category => (
                    <label key={category} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleMultiSelect(category, selectedCategories, setSelectedCategories)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Labor Intensity Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Intensity {selectedLaborIntensities.length > 0 && `(${selectedLaborIntensities.length})`}
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High', 'Very High'].map(intensity => (
                    <label key={intensity} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLaborIntensities.includes(intensity)}
                        onChange={() => toggleMultiSelect(intensity, selectedLaborIntensities, setSelectedLaborIntensities)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{intensity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Market Demand Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Demand {selectedMarketDemands.length > 0 && `(${selectedMarketDemands.length})`}
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {['Low', 'Medium', 'Medium-High', 'High', 'Very High'].map(demand => (
                    <label key={demand} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMarketDemands.includes(demand)}
                        onChange={() => toggleMultiSelect(demand, selectedMarketDemands, setSelectedMarketDemands)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{demand}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bay Area Suitability Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Bay Area Suitability: {minSuitability > 0 ? '⭐'.repeat(minSuitability) : 'Any'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setMinSuitability(rating)}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${
                      minSuitability === rating
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rating === 0 ? 'Any' : '⭐'.repeat(rating)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 border-l-4 border-emerald-600 px-4 py-3 rounded-md">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-semibold text-lg">
                    {sortedCrops.length}
                  </span>
                  <span className="text-gray-600 text-sm">
                    of {cropResearch.length} crops
                    {sortedCrops.length !== cropResearch.length && (
                      <span className="ml-1 text-emerald-600 font-medium">
                        (filtered)
                      </span>
                    )}
                  </span>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reset Filters
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'single' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📄 Single Column
              </button>
              <button
                onClick={() => setViewMode('double')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'double' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📋 Two Columns
              </button>
              <button
                onClick={() => setDisplayMode('cards')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  displayMode === 'cards' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎨 Cards
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  displayMode === 'table' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Table
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Crop Research Grid - Cards View */}
      {displayMode === 'cards' && (
        <div className={`grid gap-6 ${viewMode === 'double' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {sortedCrops.map(crop => {
            const isExpanded = expandedCards.has(crop.id);
            return (
              <Card 
                key={crop.id} 
                className="hover:shadow-lg transition-all duration-300"
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => navigate(`/crop-research/${crop.id}`)}
                >
                  {/* Header - Always Visible */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {crop.name}
                        <button
                          onClick={(e) => toggleCard(crop.id, e)}
                          className="transform transition-transform duration-300 text-emerald-600 hover:text-emerald-700 focus:outline-none"
                        >
                          <span className={`inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>
                      </h3>
                      <p className="text-sm text-gray-600">{crop.category}</p>
                    </div>
                    <div className={`text-right ${getSuitabilityColor(crop.bayAreaSuitability)}`}>
                      <div className="text-2xl">{getSuitabilityStars(crop.bayAreaSuitability)}</div>
                      <div className="text-xs whitespace-nowrap">Bay Area Fit</div>
                    </div>
                  </div>

                  {/* Compact View - Key Metrics Only */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Revenue/Acre</p>
                      <p className="font-bold text-emerald-700">{crop.annualRevenuePerAcre}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Profit Margin</p>
                      <p className="font-bold text-green-700">{crop.profitMargin}</p>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Startup Cost/Acre</p>
                        <p className="font-semibold text-gray-800">{crop.startupCostPerAcre}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Growing Time</p>
                        <p className="font-semibold text-blue-800">{crop.growingTime}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getIntensityBadge(crop.laborIntensity)}`}>
                        💪 Labor: {crop.laborIntensity}
                      </span>
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getDemandBadge(crop.marketDemand)}`}>
                        📈 Demand: {crop.marketDemand}
                      </span>
                      <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        💧 Water: {crop.waterNeeds}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Price per Pound</p>
                          <p className="font-bold text-xl text-emerald-700">{crop.pricePerPound}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-1">Harvest</p>
                          <p className="text-sm font-medium text-gray-800">{crop.harvestFrequency}</p>
                        </div>
                      </div>
                    </div>

                    {/* Growing Requirements */}
                    <div className="bg-amber-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        🌱 Growing Requirements
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="font-medium text-gray-700 w-24">Soil:</span>
                          <span className="text-gray-600 flex-1">{crop.soilType}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium text-gray-700 w-24">Nutrients:</span>
                          <span className="text-gray-600 flex-1">{crop.nutrientRequirements}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pests & Diseases */}
                    <div className="bg-red-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        ⚠️ Challenges
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">🐛 Common Pests:</span>
                          <p className="text-gray-600 mt-1">{crop.commonPests}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">🦠 Common Diseases:</span>
                          <p className="text-gray-600 mt-1">{crop.commonDiseases}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {crop.notes && (
                      <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          💡 Notes
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{crop.notes}</p>
                      </div>
                    )}
                    <button
                      onClick={(e) => toggleCard(crop.id, e)}
                      className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
                    >
                      {isExpanded ? '▲ Click to collapse' : '▼ Click to view full details'}
                    </button>
                  </div>
                  {/* Expand/Collapse Hint */}
                  <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      {isExpanded ? 'Click to collapse' : 'Click to view full details'}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Crop Research Table View */}
      {displayMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Crop Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Bay Area Fit</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Revenue/Acre</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Profit Margin</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Growing Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Labor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Market Demand</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedCrops.map((crop, idx) => (
                  <tr key={crop.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{crop.name}</td>
                    <td className="px-4 py-3 text-gray-600">{crop.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-lg ${getSuitabilityColor(crop.bayAreaSuitability)}`}>
                        {getSuitabilityStars(crop.bayAreaSuitability)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-semibold">{crop.annualRevenuePerAcre}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">{crop.profitMargin}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{crop.growingTime}</td>
                    <td className="px-4 py-3 text-gray-600">{crop.laborIntensity}</td>
                    <td className="px-4 py-3 text-gray-600">{crop.marketDemand}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/crop-research/${crop.id}`)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {sortedCrops.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500">No crops found matching your search criteria.</p>
        </Card>
      )}

      {/* Add Crop Research Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Crop Research Entry"
      >
        {currentUser && currentOrganization && (
          <AddCropResearchForm
            userId={currentUser.uid}
            organizationId={currentOrganization.id}
            onSuccess={handleAddSuccess}
            onCancel={() => setIsAddModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
