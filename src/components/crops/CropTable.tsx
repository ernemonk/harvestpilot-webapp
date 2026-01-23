import type { Crop } from '../../types';
import Table from '../ui/Table';
import CropTableRow from './CropTableRow';

interface CropTableProps {
  crops: Crop[];
  onView?: (crop: Crop) => void;
  onEdit?: (crop: Crop) => void;
}

export default function CropTable({ crops, onView, onEdit }: CropTableProps) {
  const headers = ['Crop', 'Variety', 'Location', 'Planted', 'Harvest Ready', 'Status', 'Actions'];

  return (
    <Table headers={headers}>
      {crops.length === 0 ? (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
            No crops found. Click "Add New Crop" to get started.
          </td>
        </tr>
      ) : (
        crops.map((crop) => (
          <CropTableRow 
            key={crop.id} 
            crop={crop} 
            onView={onView} 
            onEdit={onEdit} 
          />
        ))
      )}
    </Table>
  );
}
