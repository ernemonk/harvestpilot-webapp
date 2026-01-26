import type { Crop } from '../../types';
import { format } from 'date-fns';

interface CropTableRowProps {
  crop: Crop;
  onView?: (crop: Crop) => void;
  onEdit?: (crop: Crop) => void;
}

export default function CropTableRow({ crop, onView, onEdit }: CropTableRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'growing':
        return 'bg-blue-100 text-blue-800';
      case 'planted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{crop.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{crop.variety}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{crop.fieldName}</div>
        <div className="text-xs text-gray-500">{crop.sectionName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {format(crop.plantedDate.toDate(), 'MMM d, yyyy')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {format(crop.harvestReadyDate.toDate(), 'MMM d, yyyy')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(crop.status)}`}>
          {crop.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {onView && (
          <button onClick={() => onView(crop)} className="text-primary-600 hover:text-primary-900 mr-4">
            View
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(crop)} className="text-gray-600 hover:text-gray-900">
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}
