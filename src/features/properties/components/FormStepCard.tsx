interface FormStepCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormStepCard({ title, description, children }: FormStepCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
