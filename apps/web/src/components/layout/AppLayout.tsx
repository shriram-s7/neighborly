import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-slate-800">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-amber-100/80 bg-white/70 py-6 text-center text-xs text-slate-700">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Neighborly</span>
            <span>— Hyperlocal Community Services Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-amber-800 font-medium">📍 Ramapuram • Porur • Valasaravakkam • KK Nagar</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
              Offline Demo Mode
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
