import type { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface DynamicTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => ReactNode;
  emptyMessage?: string;
}

export default function DynamicTable<T extends { id: string }>({ 
  data, 
  columns, 
  actions,
  emptyMessage = 'No data available'
}: DynamicTableProps<T>) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {column.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (actions ? 1 : 0)} 
                    className="px-3 sm:px-6 py-12 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {columns.map((column, index) => (
                      <td key={index} className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                        {column.render 
                          ? column.render(item) 
                          : String((item as any)[column.key] || '-')
                        }
                      </td>
                    ))}
                    {actions && (
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
