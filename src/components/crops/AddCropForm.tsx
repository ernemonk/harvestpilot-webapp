import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { cropService } from '../../services/cropService';
import type { Crop } from '../../types';

interface AddCropFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  userId: string;
  organizationId: string;
}

export default function AddCropForm({ onSuccess, onCancel, userId, organizationId }: AddCropFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    fieldId: '',
    fieldName: '',
    sectionId: '',
    sectionName: '',
    plantedDate: new Date().toISOString().split('T')[0],
    harvestReadyDate: '',
    status: 'planted' as Crop['status'],
    notes: '',
    area: '',
    expectedYield: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const plantedDate = Timestamp.fromDate(new Date(formData.plantedDate));
      const harvestReadyDate = formData.harvestReadyDate 
        ? Timestamp.fromDate(new Date(formData.harvestReadyDate))
        : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days

      const cropData: Omit<Crop, 'id'> = {
        name: formData.name,
        variety: formData.variety,
        fieldId: formData.fieldId || 'default-field',
        fieldName: formData.fieldName || 'Main Field',
        sectionId: formData.sectionId || 'default-section',
        sectionName: formData.sectionName || 'Section 1',
        plantedDate,
        harvestReadyDate,
        status: formData.status,
        userId,
        organizationId,
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        notes: formData.notes || undefined,
        area: formData.area ? Number(formData.area) : undefined,
        expectedYield: formData.expectedYield ? Number(formData.expectedYield) : undefined
      };

      await cropService.createCrop(cropData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create crop');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Tomatoes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variety *
          </label>
          <input
            type="text"
            required
            value={formData.variety}
            onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Cherry"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Name
          </label>
          <input
            type="text"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., North Field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section Name
          </label>
          <input
            type="text"
            value={formData.sectionName}
            onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Row 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Planted Date *
          </label>
          <input
            type="date"
            required
            value={formData.plantedDate}
            onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Harvest Date
          </label>
          <input
            type="date"
            value={formData.harvestReadyDate}
            onChange={(e) => setFormData({ ...formData, harvestReadyDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Crop['status'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="planning">Planning</option>
            <option value="planted">Planted</option>
            <option value="growing">Growing</option>
            <option value="ready">Ready to Harvest</option>
            <option value="harvested">Harvested</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area (sq ft)
          </label>
          <input
            type="number"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Yield (lbs)
          </label>
          <input
            type="number"
            value={formData.expectedYield}
            onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Any additional information..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Crop'}
        </button>
      </div>
    </form>
  );
}
