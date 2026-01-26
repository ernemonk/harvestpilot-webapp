interface CropFiltersProps {
  onCropTypeChange?: (value: string) => void;
  onFieldChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
}

export default function CropFilters({ 
  onCropTypeChange, 
  onFieldChange, 
  onStatusChange 
}: CropFiltersProps) {
  return (
    <div className="mb-6 flex space-x-4">
      <select 
        className="input w-48" 
        onChange={(e) => onCropTypeChange?.(e.target.value)}
      >
        <option value="">All Crops</option>
        <option value="microgreens">Microgreens</option>
        <option value="medicinal">Medicinal Herbs</option>
        <option value="strawberries">Strawberries</option>
      </select>
      <select 
        className="input w-48"
        onChange={(e) => onFieldChange?.(e.target.value)}
      >
        <option value="">All Fields</option>
        <option value="field-a">Field A</option>
        <option value="field-b">Field B</option>
        <option value="field-c">Field C</option>
      </select>
      <select 
        className="input w-48"
        onChange={(e) => onStatusChange?.(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="growing">Growing</option>
        <option value="ready">Ready to Harvest</option>
        <option value="harvested">Harvested</option>
      </select>
    </div>
  );
}
