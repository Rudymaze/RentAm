'use client';

interface AuthFormWrapperProps {
  children: React.ReactNode;
  title?: string;
}

export function AuthFormWrapper({ children, title }: AuthFormWrapperProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-6">
        {title && (
          <h1 className="text-2xl font-bold text-center text-gray-900">{title}</h1>
        )}
        {children}
      </div>
    </div>
  );
}
