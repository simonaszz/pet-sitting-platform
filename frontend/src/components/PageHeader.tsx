import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  subtitle,
  right,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{title}</h1>
            {subtitle && <p className="text-lg opacity-90 mt-2">{subtitle}</p>}
          </div>
          {right}
        </div>
        {children}
      </div>
    </div>
  );
}
