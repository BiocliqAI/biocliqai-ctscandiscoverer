
import React from 'react';
import { ScanCenter } from '../types';
import { MapPinIcon, GlobeIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface CenterTileProps {
  center: ScanCenter;
}

export const CenterTile: React.FC<CenterTileProps> = ({ center }) => {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-slate-800 text-base mb-2 pr-4">{center.name}</h4>
        {center.googleRating > 0 && (
          <div className="flex-shrink-0 flex items-center bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {center.googleRating.toFixed(1)}
          </div>
        )}
      </div>
      
      <p className="text-sm text-slate-600 flex items-start mb-2">
        <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
        <span>{center.address}</span>
      </p>

      {center.contactNumber && <p className="text-sm text-slate-600 mb-2"><strong>Contact:</strong> {center.contactNumber}</p>}
      
      <div className="flex items-center justify-between mt-3 text-sm">
        <div className="flex items-center gap-4">
          <a href={center.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sky-600 hover:text-sky-800 transition-colors font-medium">
            <MapPinIcon className="w-4 h-4 mr-1.5" />
            View on Map
          </a>
          {center.website && center.website !== "N/A" && (
            <a href={center.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sky-600 hover:text-sky-800 transition-colors font-medium">
                <GlobeIcon className="w-4 h-4 mr-1.5" />
                Website
            </a>
          )}
        </div>

        <div className="flex items-center" title={`CT Scan Available: ${center.ctAvailable ? 'Yes' : 'No'}`}>
            {center.ctAvailable ? <CheckCircleIcon /> : <XCircleIcon />}
            <span className={`ml-1.5 text-xs font-semibold ${center.ctAvailable ? 'text-green-700' : 'text-red-700'}`}>
                CT Scan
            </span>
        </div>
      </div>
    </div>
  );
};
