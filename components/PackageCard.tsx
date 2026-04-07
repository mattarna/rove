'use client';

import { AGENT_COLORS } from '@/lib/agents';

export interface PackageData {
  name: string;
  destination: string;
  price: string;
  duration: string;
  highlights: string[];
  cta: string;
}

export default function PackageCard({ pkg }: { pkg: PackageData }) {
  const accentColor = AGENT_COLORS.sales;

  return (
    <div className="bg-white border-2 rounded-2xl overflow-hidden shadow-md my-4 transition-transform hover:scale-[1.02] duration-300" 
         style={{ borderColor: accentColor }}>
      <div className="p-4" style={{ backgroundColor: `${accentColor}10` }}>
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-white border border-gray-100" style={{ color: accentColor }}>
            {pkg.destination}
          </span>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 leading-none">€{pkg.price}</div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Prezzo a persona</div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{pkg.name}</h3>
      </div>
      
      <div className="p-4 bg-white">
        <div className="flex items-center text-sm text-gray-500 mb-4 pb-3 border-b border-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {pkg.duration}
        </div>
        
        <div className="space-y-2 mb-5">
          {pkg.highlights.map((h, i) => (
            <div key={i} className="flex items-center text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {h}
            </div>
          ))}
        </div>
        
        <button 
          className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          {pkg.cta || 'Scopri disponibilità'}
        </button>
      </div>
    </div>
  );
}
