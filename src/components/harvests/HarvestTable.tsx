import type { Harvest } from '../../types';
import Table from '../ui/Table';
import HarvestTableRow from './HarvestTableRow';

interface HarvestTableProps {
  harvests: Harvest[];
  onView?: (harvest: Harvest) => void;
  onEdit?: (harvest: Harvest) => void;
}

export default function HarvestTable({ harvests, onView, onEdit }: HarvestTableProps) {
  const headers = ['Date', 'Crop', 'Quantity', 'Quality', 'Actions'];

  return (
    <Table headers={headers}>
      {harvests.length === 0 ? (
        <tr>
          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
            No harvests recorded yet. Click "Log New Harvest" to get started.
          </td>
        </tr>
      ) : (
        harvests.map((harvest) => (
          <HarvestTableRow 
            key={harvest.id} 
            harvest={harvest} 
            onView={onView} 
            onEdit={onEdit} 
          />
        ))
      )}
    </Table>
  );
}
