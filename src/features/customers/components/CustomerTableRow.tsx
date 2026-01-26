import type { Customer } from '../../types';

interface CustomerTableRowProps {
  customer: Customer;
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
}

export default function CustomerTableRow({ customer, onView, onEdit }: CustomerTableRowProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'bg-purple-100 text-purple-800';
      case 'farmers-market':
        return 'bg-green-100 text-green-800';
      case 'grocery':
      case 'asian-market':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
        <div className="text-xs text-gray-500">{customer.contactName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(customer.type)}`}>
          {customer.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{customer.email}</div>
        <div className="text-xs text-gray-500">{customer.phone}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(customer.status)}`}>
          {customer.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {onView && (
          <button onClick={() => onView(customer)} className="text-primary-600 hover:text-primary-900 mr-4">
            View
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(customer)} className="text-gray-600 hover:text-gray-900">
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}
