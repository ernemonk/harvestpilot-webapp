import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { cropResearchService } from '../../services/cropResearchService';
export default function AddCropResearchForm({ onSuccess, onCancel, userId, organizationId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        startupCostPerAcre: '',
        annualRevenuePerAcre: '',
        profitMargin: '',
        growingTime: '',
        laborIntensity: 'Medium',
        bayAreaSuitability: 3,
        marketDemand: 'Medium',
        waterNeeds: 'Medium',
        soilType: '',
        commonPests: '',
        commonDiseases: '',
        nutrientRequirements: '',
        pricePerPound: '',
        harvestFrequency: '',
        notes: ''
    });
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const cropResearchData = {
                name: formData.name,
                category: formData.category,
                startupCostPerAcre: formData.startupCostPerAcre,
                annualRevenuePerAcre: formData.annualRevenuePerAcre,
                profitMargin: formData.profitMargin,
                growingTime: formData.growingTime,
                laborIntensity: formData.laborIntensity,
                bayAreaSuitability: formData.bayAreaSuitability,
                marketDemand: formData.marketDemand,
                waterNeeds: formData.waterNeeds,
                soilType: formData.soilType,
                commonPests: formData.commonPests,
                commonDiseases: formData.commonDiseases,
                nutrientRequirements: formData.nutrientRequirements,
                pricePerPound: formData.pricePerPound,
                harvestFrequency: formData.harvestFrequency,
                notes: formData.notes,
                userId,
                organizationId,
                createdBy: userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            await cropResearchService.createCropResearch(cropResearchData);
            onSuccess();
        }
        catch (err) {
            setError(err.message || 'Failed to create crop research entry');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded", children: error })), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: "Basic Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Crop Name *" }), _jsx("input", { type: "text", required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., Microgreens" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Category *" }), _jsx("input", { type: "text", required: true, value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., Specialty Greens, Herbs, Berries" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: "Financial Metrics" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Startup Cost/Acre *" }), _jsx("input", { type: "text", required: true, value: formData.startupCostPerAcre, onChange: (e) => setFormData({ ...formData, startupCostPerAcre: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., $5,000-$10,000" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Annual Revenue/Acre *" }), _jsx("input", { type: "text", required: true, value: formData.annualRevenuePerAcre, onChange: (e) => setFormData({ ...formData, annualRevenuePerAcre: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., $25,000-$45,000" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Profit Margin *" }), _jsx("input", { type: "text", required: true, value: formData.profitMargin, onChange: (e) => setFormData({ ...formData, profitMargin: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., 50-70%" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: "Growing Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Growing Time *" }), _jsx("input", { type: "text", required: true, value: formData.growingTime, onChange: (e) => setFormData({ ...formData, growingTime: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., 6-8 weeks" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Labor Intensity *" }), _jsxs("select", { required: true, value: formData.laborIntensity, onChange: (e) => setFormData({ ...formData, laborIntensity: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Low-Medium", children: "Low-Medium" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "Medium-High", children: "Medium-High" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Very High", children: "Very High" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Bay Area Suitability (1-5 stars) *" }), _jsxs("select", { required: true, value: formData.bayAreaSuitability, onChange: (e) => setFormData({ ...formData, bayAreaSuitability: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", children: [_jsx("option", { value: 1, children: "\u2B50 1 - Poor" }), _jsx("option", { value: 2, children: "\u2B50\u2B50 2 - Fair" }), _jsx("option", { value: 3, children: "\u2B50\u2B50\u2B50 3 - Good" }), _jsx("option", { value: 4, children: "\u2B50\u2B50\u2B50\u2B50 4 - Very Good" }), _jsx("option", { value: 5, children: "\u2B50\u2B50\u2B50\u2B50\u2B50 5 - Excellent" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Market Demand *" }), _jsxs("select", { required: true, value: formData.marketDemand, onChange: (e) => setFormData({ ...formData, marketDemand: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "Medium-High", children: "Medium-High" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Very High", children: "Very High" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Water Needs *" }), _jsxs("select", { required: true, value: formData.waterNeeds, onChange: (e) => setFormData({ ...formData, waterNeeds: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", children: [_jsx("option", { value: "Very Low", children: "Very Low" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "Medium-High", children: "Medium-High" }), _jsx("option", { value: "High", children: "High" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Soil Type *" }), _jsx("input", { type: "text", required: true, value: formData.soilType, onChange: (e) => setFormData({ ...formData, soilType: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., Well-drained loam, pH 6.0-7.0" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: "Pricing & Harvest" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Price per Pound *" }), _jsx("input", { type: "text", required: true, value: formData.pricePerPound, onChange: (e) => setFormData({ ...formData, pricePerPound: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., $12-$20" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Harvest Frequency *" }), _jsx("input", { type: "text", required: true, value: formData.harvestFrequency, onChange: (e) => setFormData({ ...formData, harvestFrequency: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., Weekly during season" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: "Challenges & Requirements" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Common Pests *" }), _jsx("input", { type: "text", required: true, value: formData.commonPests, onChange: (e) => setFormData({ ...formData, commonPests: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., Aphids, Japanese beetles" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Common Diseases *" }), _jsx("input", { type: "text", required: true, value: formData.commonDiseases, onChange: (e) => setFormData({ ...formData, commonDiseases: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., Downy mildew, fusarium wilt" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nutrient Requirements *" }), _jsx("input", { type: "text", required: true, value: formData.nutrientRequirements, onChange: (e) => setFormData({ ...formData, nutrientRequirements: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "e.g., Nitrogen-rich fertilizer" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent", placeholder: "Additional notes about profitability, market opportunities, etc." })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed", children: loading ? 'Creating...' : 'Create Crop Research' })] })] }));
}
