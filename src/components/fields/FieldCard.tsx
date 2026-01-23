import type { Field } from '../../types';

interface FieldCardProps {
  field: Field;
  onEdit?: (field: Field) => void;
  onViewDetails?: (field: Field) => void;
}

export default function FieldCard({ field, onEdit, onViewDetails }: FieldCardProps) {
  const plantedSections = field.sections.filter(s => s.status === 'planted').length;
  const availableSections = field.sections.filter(s => s.status === 'available').length;

  const getSectionStatusColor = (status: string) => {
    switch (status) {
      case 'planted':
        return 'bg-green-500';
      case 'available':
        return 'bg-blue-500';
      case 'fallow':
        return 'bg-yellow-500';
      case 'preparing':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{field.name}</h3>
          <p className="text-sm text-gray-500">
            {field.size} {field.sizeUnit} • {field.soilType || 'Unknown soil'}
          </p>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button 
              onClick={() => onEdit(field)}
              className="text-gray-600 hover:text-gray-900"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Field Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Sun Exposure</p>
          <p className="text-sm font-medium text-gray-900">
            {field.sunExposure ? field.sunExposure.replace('-', ' ') : 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Irrigation</p>
          <p className="text-sm font-medium text-gray-900">
            {field.irrigationType ? field.irrigationType : 'None'}
          </p>
        </div>
      </div>

      {/* Section Status */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-medium text-gray-500">Sections ({field.sections.length})</p>
          <p className="text-xs text-gray-600">
            {plantedSections} planted • {availableSections} available
          </p>
        </div>
        <div className="flex gap-1 h-2">
          {field.sections.map((section) => (
            <div
              key={section.id}
              className={`flex-1 rounded-sm ${getSectionStatusColor(section.status)}`}
              title={`${section.name}: ${section.status}`}
            />
          ))}
          {field.sections.length === 0 && (
            <div className="flex-1 bg-gray-200 rounded-sm" />
          )}
        </div>
      </div>

      {/* Notes */}
      {field.notes && (
        <p className="text-sm text-gray-600 italic mb-4">"{field.notes}"</p>
      )}

      {onViewDetails && (
        <button
          onClick={() => onViewDetails(field)}
          className="w-full text-center py-2 text-sm text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded"
        >
          View Sections & Details
        </button>
      )}
    </div>
  );
}
