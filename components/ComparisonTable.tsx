'use client';

import { AGENT_COLORS } from '@/lib/agents';

export interface ComparisonData {
  destinations: {
    name: string;
    match: string;
    priceRange: string;
    bestFor: string;
    season: string;
    whyForYou: string;
  }[];
}

export default function ComparisonTable({ data }: { data: ComparisonData }) {
  const accentColor = AGENT_COLORS.discovery;

  return (
    <div className="bg-white border overflow-hidden rounded-2xl shadow-lg my-6 border-gray-100">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between" style={{ backgroundColor: `${accentColor}05` }}>
        <h3 className="font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Proposed destination comparison
        </h3>
        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Discovery tool</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Detail</th>
              {data.destinations.map((d, i) => (
                <th key={i} className="px-4 py-3 text-sm font-bold text-gray-800 border-b border-gray-50 min-w-[140px]">
                  {i === 0 && (
                    <span className="block text-[8px] text-green-500 uppercase tracking-[0.2em] mb-0.5">Top match</span>
                  )}
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs">
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-500 border-b border-gray-50">Match</td>
              {data.destinations.map((d, i) => (
                <td key={i} className="px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: d.match || '50%' }}></div>
                    </div>
                    <span className="font-bold text-gray-700">{d.match}</span>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-500 border-b border-gray-50">Price</td>
              {data.destinations.map((d, i) => (
                <td key={i} className="px-4 py-3 border-b border-gray-50 font-medium text-gray-800">
                  €{d.priceRange}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-500 border-b border-gray-50">Highlight</td>
              {data.destinations.map((d, i) => (
                <td key={i} className="px-4 py-3 border-b border-gray-50 text-gray-600 leading-relaxed italic">
                  "{d.bestFor}"
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-500 border-b border-gray-50">Season</td>
              {data.destinations.map((d, i) => (
                <td key={i} className="px-4 py-3 border-b border-gray-50 text-gray-700">
                  {d.season}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50/20">
              <td className="px-4 py-4 font-semibold text-gray-500 flex flex-col items-start h-full">Why for you</td>
              {data.destinations.map((d, i) => (
                <td key={i} className="px-4 py-4 text-gray-800 font-medium leading-relaxed align-top">
                  {d.whyForYou}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
