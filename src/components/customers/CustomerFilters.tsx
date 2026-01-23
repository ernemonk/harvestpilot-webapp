interface CustomerFiltersProps {
  onSearch?: (value: string) => void;
  onTypeChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
}

export default function CustomerFilters({ 
  onSearch, 
  onTypeChange, 
  onStatusChange 
}: CustomerFiltersProps) {
  return (
    <div className="mb-6 flex space-x-4">
      <input
        type="text"
        placeholder="Search customers..."
        className="input w-64"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <select 
        className="input w-48"
        onChange={(e) => onTypeChange?.(e.target.value)}
      >
        <option value="">All Types</option>
        <option value="restaurant">Restaurant</option>
        <option value="farmers-market">Farmers Market</option>
        <option value="grocery">Grocery Store</option>
        <option value="asian-market">Asian Market</option>
      </select>
      <select 
        className="input w-48"
        onChange={(e) => onStatusChange?.(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="trial">Trial</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
