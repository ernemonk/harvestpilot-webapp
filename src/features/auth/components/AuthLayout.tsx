import type { ReactNode } from 'react';
import logo from '../../../assets/logo.png';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <img src={logo} alt="HarvestPilot logo" className="h-80 w-auto object-contain" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-base text-gray-600">
            {subtitle}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
