import type { Harvest } from '../../types';
import { format } from 'date-fns';

interface HarvestTableRowProps {
  harvest: Harvest;
  onView?: (harvest: Harvest) => void;
  onEdit?: (harvest: Harvest) => void;
}

export default function HarvestTableRow({ harvest, onView, onEdit }: HarvestTableRowProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium':
        return 'bg-green-100 text-green-800';
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'seconds':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {format(harvest.harvestDate.toDate(), 'MMM d, yyyy')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{harvest.cropName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{harvest.quantity} {harvest.unit}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getQualityColor(harvest.quality)}`}>
          {harvest.quality}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {onView && (
          <button onClick={() => onView(harvest)} className="text-primary-600 hover:text-primary-900 mr-4">
            View
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(harvest)} className="text-gray-600 hover:text-gray-900">
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}
