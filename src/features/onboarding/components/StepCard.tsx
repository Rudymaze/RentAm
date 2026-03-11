'use client';

interface StepCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function StepCard({ title, description, children }: StepCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
