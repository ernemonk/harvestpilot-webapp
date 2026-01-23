import type { Field } from '../../types';
import FieldCard from './FieldCard';

interface FieldGridProps {
  fields: Field[];
  onEdit?: (field: Field) => void;
  onViewDetails?: (field: Field) => void;
}

export default function FieldGrid({ fields, onEdit, onViewDetails }: FieldGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fields.map((field) => (
        <FieldCard
          key={field.id}
          field={field}
          onEdit={onEdit}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
