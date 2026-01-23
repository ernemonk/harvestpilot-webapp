import type { Section } from '../../types';

interface SectionListProps {
  sections: Section[];
  onEditSection?: (section: Section) => void;
}

export default function SectionList({ sections, onEditSection }: SectionListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planted':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'fallow':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No sections defined for this field.</p>
        <button className="mt-4 text-primary-600 hover:text-primary-900">
          + Add Section
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div 
          key={section.id} 
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h4 className="font-medium text-gray-900">{section.name}</h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(section.status)}`}>
                {section.status}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {section.size} sqft
              {section.currentCropId && (
                <span className="ml-3 text-primary-600">
                  • Currently growing crop
                </span>
              )}
            </div>
            {section.notes && (
              <p className="mt-2 text-sm text-gray-500 italic">"{section.notes}"</p>
            )}
          </div>
          {onEditSection && (
            <button 
              onClick={() => onEditSection(section)}
              className="ml-4 text-gray-600 hover:text-gray-900"
            >
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
