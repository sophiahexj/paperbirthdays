interface FieldNavigationProps {
  fields: string[];
}

export default function FieldNavigation({ fields }: FieldNavigationProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Browse by Field</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {fields.map((field) => (
          <a
            key={field}
            href={`/${encodeURIComponent(field.toLowerCase())}`}
            className="px-4 py-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-md text-sm font-medium text-gray-700 hover:from-blue-100 hover:to-purple-100 transition text-center border border-gray-200 hover:border-blue-300"
          >
            {field}
          </a>
        ))}
      </div>
    </div>
  );
}
