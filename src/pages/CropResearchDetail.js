import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useFirestoreDoc } from '../hooks/useFirestore';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
export default function CropResearchDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: crop, loading, error } = useFirestoreDoc('cropResearch', id || '');
    if (loading)
        return _jsx(LoadingSpinner, { message: "Loading crop details..." });
    if (error)
        return _jsx(ErrorMessage, { message: `Error loading crop: ${error}` });
    if (!crop)
        return _jsx(ErrorMessage, { message: "Crop not found" });
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
            'Very High': 'bg-red-200 text-red-900',
        };
        return colors[intensity] || 'bg-gray-100 text-gray-800';
    };
    const getDemandBadge = (demand) => {
        if (!demand)
            return 'bg-gray-100 text-gray-800';
        const colors = {
            'Very High': 'bg-purple-100 text-purple-800',
            'High': 'bg-blue-100 text-blue-800',
            'Medium-High': 'bg-cyan-100 text-cyan-800',
            'Medium': 'bg-teal-100 text-teal-800',
            'Low': 'bg-gray-100 text-gray-800',
            'Growing': 'bg-indigo-100 text-indigo-800',
        };
        return colors[demand] || 'bg-gray-100 text-gray-800';
    };
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("button", { onClick: () => navigate('/crop-research'), className: "mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }), "Back to Research"] }), _jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6 sm:p-8", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl sm:text-4xl font-bold text-gray-900 mb-2", children: crop.name }), _jsx("p", { className: "text-lg text-gray-600", children: crop.category })] }), _jsxs("div", { className: `text-right ${getSuitabilityColor(crop.bayAreaSuitability)}`, children: [_jsx("div", { className: "text-4xl mb-1", children: getSuitabilityStars(crop.bayAreaSuitability) }), _jsx("div", { className: "text-sm font-medium", children: "Bay Area Suitability" })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-600", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1 uppercase tracking-wider", children: "Revenue/Acre" }), _jsx("p", { className: "text-xl font-bold text-emerald-700", children: crop.annualRevenuePerAcre })] }), _jsxs("div", { className: "bg-green-50 p-4 rounded-lg border-l-4 border-green-600", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1 uppercase tracking-wider", children: "Profit Margin" }), _jsx("p", { className: "text-xl font-bold text-green-700", children: crop.profitMargin })] }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1 uppercase tracking-wider", children: "Growing Time" }), _jsx("p", { className: "text-xl font-bold text-blue-700", children: crop.growingTime })] }), _jsxs("div", { className: "bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1 uppercase tracking-wider", children: "Startup Cost/Acre" }), _jsx("p", { className: "text-xl font-bold text-purple-700", children: crop.startupCostPerAcre })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6", children: [_jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDCCA" }), " Market Information"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Market Demand" }), _jsxs("span", { className: `inline-block px-4 py-2 text-sm font-medium rounded-full ${getDemandBadge(crop.marketDemand)}`, children: ["\uD83D\uDCC8 ", crop.marketDemand] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Price Per Pound" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: crop.pricePerPound })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Harvest Frequency" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: crop.harvestFrequency })] })] })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx("span", { children: "\uD83C\uDF31" }), " Production Requirements"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Labor Intensity" }), _jsxs("span", { className: `inline-block px-4 py-2 text-sm font-medium rounded-full ${getIntensityBadge(crop.laborIntensity)}`, children: ["\uD83D\uDCAA ", crop.laborIntensity] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Water Needs" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: crop.waterNeeds })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Soil Type" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: crop.soilType })] })] })] }) })] }), _jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx("span", { children: "\uD83C\uDF3F" }), " Growing Details"] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-2", children: "Nutrient Requirements" }), _jsx("p", { className: "text-gray-900", children: crop.nutrientRequirements })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-2", children: "Common Pests" }), _jsx("p", { className: "text-gray-900", children: crop.commonPests })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-2", children: "Common Diseases" }), _jsx("p", { className: "text-gray-900", children: crop.commonDiseases })] })] })] }) }), crop.notes && (_jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDCDD" }), " Additional Notes"] }), _jsx("p", { className: "text-gray-700 leading-relaxed", children: crop.notes })] }) }))] }));
}
