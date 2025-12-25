interface FieldNavigationProps {
  fields: string[];
}

export default function FieldNavigation({ fields }: FieldNavigationProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
      <p className="text-sm font-medium text-gray-700 mb-3">Browse by field:</p>
      <div className="flex flex-wrap gap-2">
        {fields.map((field) => (
          <a
            key={field}
            href={`/${encodeURIComponent(field.toLowerCase())}`}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition"
          >
            {field}
          </a>
        ))}
      </div>
    </div>
  );
}
