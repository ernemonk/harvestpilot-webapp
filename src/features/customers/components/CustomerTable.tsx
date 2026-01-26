import type { Customer } from '../../types';
import Table from '../ui/Table';
import CustomerTableRow from './CustomerTableRow';

interface CustomerTableProps {
  customers: Customer[];
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
}

export default function CustomerTable({ customers, onView, onEdit }: CustomerTableProps) {
  const headers = ['Customer', 'Type', 'Contact', 'Status', 'Actions'];

  return (
    <Table headers={headers}>
      {customers.length === 0 ? (
        <tr>
          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
            No customers yet. Click "Add New Customer" to get started.
          </td>
        </tr>
      ) : (
        customers.map((customer) => (
          <CustomerTableRow 
            key={customer.id} 
            customer={customer} 
            onView={onView} 
            onEdit={onEdit} 
          />
        ))
      )}
    </Table>
  );
}
