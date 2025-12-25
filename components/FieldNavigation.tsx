interface FieldNavigationProps {
  fields: string[];
}

export default function FieldNavigation({ fields }: FieldNavigationProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <p className="font-body text-xs text-text-muted mb-3 text-center">Browse by field:</p>
      <div className="flex flex-wrap gap-3 justify-center">
        {fields.map((field) => (
          <a
            key={field}
            href={`/${encodeURIComponent(field.toLowerCase())}`}
            className="font-body text-sm text-text-muted hover:text-accent transition-colors"
          >
            {field}
          </a>
        ))}
      </div>
    </div>
  );
}
