import { useState, type FormEvent } from 'react';
import { fieldService } from '../../services/fieldService';
import { Timestamp } from 'firebase/firestore';
import type { Section } from '../../types';

interface AddFieldFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  userId: string;
  organizationId: string;
}

const sizeUnits = [
  { value: 'sqft', label: 'Square Feet' },
  { value: 'acres', label: 'Acres' },
];

const sunExposureOptions = [
  { value: 'full-sun', label: 'Full Sun' },
  { value: 'partial-sun', label: 'Partial Sun' },
  { value: 'shade', label: 'Shade' },
];

const irrigationTypes = [
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler System' },
  { value: 'manual', label: 'Manual Watering' },
  { value: 'none', label: 'None' },
];

const sectionStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'planted', label: 'Planted' },
  { value: 'fallow', label: 'Fallow' },
  { value: 'preparing', label: 'Preparing' },
];

export default function AddFieldForm({ onSuccess, onCancel, userId, organizationId }: AddFieldFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    sizeUnit: 'sqft' as 'sqft' | 'acres',
    soilType: '',
    sunExposure: 'full-sun' as 'full-sun' | 'partial-sun' | 'shade' | undefined,
    irrigationType: 'drip' as 'drip' | 'sprinkler' | 'manual' | 'none' | undefined,
    notes: '',
  });

  const [sections, setSections] = useState<Array<{
    name: string;
    size: string;
    status: 'available' | 'planted' | 'fallow' | 'preparing';
    notes: string;
  }>>([
    { name: 'Section 1', size: '', status: 'available', notes: '' }
  ]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.size) {
      setError('Please fill in all required fields');
      return;
    }

    const size = parseFloat(formData.size);
    if (isNaN(size) || size <= 0) {
      setError('Please enter a valid size');
      return;
    }

    // Validate sections
    for (const section of sections) {
      if (!section.name.trim()) {
        setError('All sections must have a name');
        return;
      }
      if (!section.size) {
        setError('All sections must have a size');
        return;
      }
      const sectionSize = parseFloat(section.size);
      if (isNaN(sectionSize) || sectionSize <= 0) {
        setError('All sections must have a valid size');
        return;
      }
    }

    try {
      setLoading(true);

      const fieldSections: Section[] = sections.map((section, index) => ({
        id: `section-${Date.now()}-${index}`,
        name: section.name.trim(),
        size: parseFloat(section.size),
        status: section.status,
        notes: section.notes.trim() || undefined,
      }));

      const fieldData = {
        name: formData.name.trim(),
        size,
        sizeUnit: formData.sizeUnit,
        soilType: formData.soilType.trim() || undefined,
        sunExposure: formData.sunExposure,
        irrigationType: formData.irrigationType,
        userId,
        organizationId,
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        notes: formData.notes.trim() || undefined,
        sections: fieldSections,
      };

      await fieldService.createField(fieldData);
      onSuccess();
    } catch (err) {
      console.error('Error creating field:', err);
      setError(err instanceof Error ? err.message : 'Failed to create field');
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setSections([
      ...sections,
      { name: `Section ${sections.length + 1}`, size: '', status: 'available', notes: '' }
    ]);
  };

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index));
    }
  };

  const updateSection = (index: number, field: string, value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Field Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Field Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Field Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., North Field, Field A"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                Size <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label htmlFor="sizeUnit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                id="sizeUnit"
                value={formData.sizeUnit}
                onChange={(e) => setFormData({ ...formData, sizeUnit: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sizeUnits.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 mb-1">
              Soil Type
            </label>
            <input
              type="text"
              id="soilType"
              value={formData.soilType}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Clay, Loam, Sandy"
            />
          </div>

          <div>
            <label htmlFor="sunExposure" className="block text-sm font-medium text-gray-700 mb-1">
              Sun Exposure
            </label>
            <select
              id="sunExposure"
              value={formData.sunExposure || ''}
              onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value as any || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select...</option>
              {sunExposureOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="irrigationType" className="block text-sm font-medium text-gray-700 mb-1">
              Irrigation Type
            </label>
            <select
              id="irrigationType"
              value={formData.irrigationType || ''}
              onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value as any || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select...</option>
              {irrigationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Additional information about this field..."
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Sections</h3>
          <button
            type="button"
            onClick={addSection}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            + Add Section
          </button>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => updateSection(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size (sqft) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={section.size}
                    onChange={(e) => updateSection(index, 'size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={section.status}
                    onChange={(e) => updateSection(index, 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {sectionStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Notes
                </label>
                <input
                  type="text"
                  value={section.notes}
                  onChange={(e) => updateSection(index, 'notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  placeholder="Optional notes for this section..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Field'}
        </button>
      </div>
    </form>
  );
}
