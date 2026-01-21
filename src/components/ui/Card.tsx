import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-800 bg-gray-900 p-6 ${className}`}>
      {children}
    </div>
  );
}
