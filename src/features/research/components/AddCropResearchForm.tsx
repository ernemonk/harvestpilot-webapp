import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { cropResearchService } from '../../services/cropResearchService';
import type { CropResearch } from '../../types';

interface AddCropResearchFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  userId: string;
  organizationId: string;
}

export default function AddCropResearchForm({ onSuccess, onCancel, userId, organizationId }: AddCropResearchFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    startupCostPerAcre: '',
    annualRevenuePerAcre: '',
    profitMargin: '',
    growingTime: '',
    laborIntensity: 'Medium' as CropResearch['laborIntensity'],
    bayAreaSuitability: 3,
    marketDemand: 'Medium' as CropResearch['marketDemand'],
    waterNeeds: 'Medium' as CropResearch['waterNeeds'],
    soilType: '',
    commonPests: '',
    commonDiseases: '',
    nutrientRequirements: '',
    pricePerPound: '',
    harvestFrequency: '',
    notes: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cropResearchData: Omit<CropResearch, 'id'> = {
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
    } catch (err: any) {
      setError(err.message || 'Failed to create crop research entry');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Microgreens"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Specialty Greens, Herbs, Berries"
            />
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Startup Cost/Acre *
            </label>
            <input
              type="text"
              required
              value={formData.startupCostPerAcre}
              onChange={(e) => setFormData({ ...formData, startupCostPerAcre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., $5,000-$10,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Revenue/Acre *
            </label>
            <input
              type="text"
              required
              value={formData.annualRevenuePerAcre}
              onChange={(e) => setFormData({ ...formData, annualRevenuePerAcre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., $25,000-$45,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profit Margin *
            </label>
            <input
              type="text"
              required
              value={formData.profitMargin}
              onChange={(e) => setFormData({ ...formData, profitMargin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 50-70%"
            />
          </div>
        </div>
      </div>

      {/* Growing Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Growing Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Growing Time *
            </label>
            <input
              type="text"
              required
              value={formData.growingTime}
              onChange={(e) => setFormData({ ...formData, growingTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 6-8 weeks"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labor Intensity *
            </label>
            <select
              required
              value={formData.laborIntensity}
              onChange={(e) => setFormData({ ...formData, laborIntensity: e.target.value as CropResearch['laborIntensity'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Low-Medium">Low-Medium</option>
              <option value="Medium">Medium</option>
              <option value="Medium-High">Medium-High</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bay Area Suitability (1-5 stars) *
            </label>
            <select
              required
              value={formData.bayAreaSuitability}
              onChange={(e) => setFormData({ ...formData, bayAreaSuitability: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={1}>⭐ 1 - Poor</option>
              <option value={2}>⭐⭐ 2 - Fair</option>
              <option value={3}>⭐⭐⭐ 3 - Good</option>
              <option value={4}>⭐⭐⭐⭐ 4 - Very Good</option>
              <option value={5}>⭐⭐⭐⭐⭐ 5 - Excellent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Market Demand *
            </label>
            <select
              required
              value={formData.marketDemand}
              onChange={(e) => setFormData({ ...formData, marketDemand: e.target.value as CropResearch['marketDemand'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="Medium-High">Medium-High</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Water Needs *
            </label>
            <select
              required
              value={formData.waterNeeds}
              onChange={(e) => setFormData({ ...formData, waterNeeds: e.target.value as CropResearch['waterNeeds'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="Medium-High">Medium-High</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soil Type *
            </label>
            <input
              type="text"
              required
              value={formData.soilType}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Well-drained loam, pH 6.0-7.0"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Harvest */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing & Harvest</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Pound *
            </label>
            <input
              type="text"
              required
              value={formData.pricePerPound}
              onChange={(e) => setFormData({ ...formData, pricePerPound: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., $12-$20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harvest Frequency *
            </label>
            <input
              type="text"
              required
              value={formData.harvestFrequency}
              onChange={(e) => setFormData({ ...formData, harvestFrequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Weekly during season"
            />
          </div>
        </div>
      </div>

      {/* Pests, Diseases & Nutrients */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Challenges & Requirements</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Common Pests *
            </label>
            <input
              type="text"
              required
              value={formData.commonPests}
              onChange={(e) => setFormData({ ...formData, commonPests: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Aphids, Japanese beetles"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Common Diseases *
            </label>
            <input
              type="text"
              required
              value={formData.commonDiseases}
              onChange={(e) => setFormData({ ...formData, commonDiseases: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Downy mildew, fusarium wilt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nutrient Requirements *
            </label>
            <input
              type="text"
              required
              value={formData.nutrientRequirements}
              onChange={(e) => setFormData({ ...formData, nutrientRequirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Nitrogen-rich fertilizer"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Additional notes about profitability, market opportunities, etc."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Crop Research'}
        </button>
      </div>
    </form>
  );
}
