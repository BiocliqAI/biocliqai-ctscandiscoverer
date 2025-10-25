
import React, { useState, useCallback, useRef } from 'react';
import { CityProcess, ProcessStatus, LocationCoords, ScanCenter } from '../types';
import { findPincodesForCity, findScanCentersInPincode } from '../services/geminiService';
import { PlayIcon, StopIcon, RescanIcon, SpinnerIcon, ChevronDownIcon } from './icons';
import { CenterTile } from './CenterTile';

interface CityTileProps {
  city: CityProcess;
  onUpdate: (updatedCity: CityProcess) => void;
  location: LocationCoords | null;
}

const getStatusInfo = (city: CityProcess): { text: string; color: string; showProgress: boolean } => {
    switch (city.status) {
        case ProcessStatus.IDLE: return { text: 'Ready to start', color: 'text-slate-500', showProgress: false };
        case ProcessStatus.SCANNING_PINCODES: return { text: 'Scanning pincodes...', color: 'text-sky-600', showProgress: true };
        case ProcessStatus.AWAITING_CONFIRMATION: return { text: `${city.foundPincodesCount} pincodes found`, color: 'text-amber-600', showProgress: false };
        case ProcessStatus.SCANNING_CENTERS: return { text: `Found ${city.centers.length} centers`, color: 'text-sky-600', showProgress: true };
        case ProcessStatus.COMPLETED: return { text: `Completed. Found ${city.centers.length} centers.`, color: 'text-green-600', showProgress: false };
        case ProcessStatus.STOPPED: return { text: 'Stopped by user', color: 'text-slate-500', showProgress: false };
        case ProcessStatus.ERROR: return { text: 'An error occurred', color: 'text-red-600', showProgress: false };
        default: return { text: '', color: 'text-slate-500', showProgress: false };
    }
};

export const CityTile: React.FC<CityTileProps> = ({ city, onUpdate, location }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isRunningRef = useRef(false);

    const startProcess = useCallback(async () => {
        isRunningRef.current = true;
        
        // Step 1: Find Pincodes
        onUpdate({ ...city, status: ProcessStatus.SCANNING_PINCODES, errorMessage: null, centers: [], scannedPincodesCount: 0 });
        try {
            const pincodes = await findPincodesForCity(city.name);
            if (!isRunningRef.current) { onUpdate({ ...city, status: ProcessStatus.STOPPED }); return; }

            if (pincodes.length === 0) {
                onUpdate({ ...city, status: ProcessStatus.ERROR, errorMessage: 'No pincodes found for this city.' });
                return;
            }
            onUpdate({ ...city, status: ProcessStatus.AWAITING_CONFIRMATION, pincodes, foundPincodesCount: pincodes.length });
        } catch (error) {
            onUpdate({ ...city, status: ProcessStatus.ERROR, errorMessage: error instanceof Error ? error.message : "Failed to get pincodes" });
        }
    }, [city, onUpdate]);

    const continueProcess = useCallback(async () => {
        isRunningRef.current = true;
        onUpdate({ ...city, status: ProcessStatus.SCANNING_CENTERS });

        let allCenters: ScanCenter[] = [];
        for (let i = 0; i < city.pincodes.length; i++) {
            if (!isRunningRef.current) { onUpdate({ ...city, status: ProcessStatus.STOPPED, centers: allCenters, scannedPincodesCount: i }); return; }
            
            const pincode = city.pincodes[i];
            const foundCenters = await findScanCentersInPincode(pincode, city.name, location);
            allCenters = [...allCenters, ...foundCenters];

            // Update progress without causing excessive re-renders
            onUpdate({ ...city, status: ProcessStatus.SCANNING_CENTERS, centers: allCenters, scannedPincodesCount: i + 1 });
        }
        
        onUpdate({ ...city, status: ProcessStatus.COMPLETED, centers: allCenters });
        setIsExpanded(true);
        isRunningRef.current = false;
    }, [city, onUpdate, location]);
    
    const stopProcess = () => {
        isRunningRef.current = false;
        onUpdate({ ...city, status: ProcessStatus.STOPPED });
    };

    const resetProcess = () => {
        setIsExpanded(false);
        stopProcess();
        onUpdate({
            ...city,
            status: ProcessStatus.IDLE,
            pincodes: [],
            centers: [],
            errorMessage: null,
            foundPincodesCount: 0,
            scannedPincodesCount: 0,
        });
    };

    const isProcessing = city.status === ProcessStatus.SCANNING_PINCODES || city.status === ProcessStatus.SCANNING_CENTERS;
    const { text: statusText, color: statusColor, showProgress } = getStatusInfo(city);
    const progress = city.foundPincodesCount > 0 ? (city.scannedPincodesCount / city.foundPincodesCount) * 100 : 0;

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-300">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{city.name}</h3>
                    <p className={`text-sm ${statusColor}`}>{statusText}</p>
                    {city.errorMessage && <p className="text-xs text-red-500 mt-1">{city.errorMessage}</p>}
                    {showProgress && city.status === ProcessStatus.SCANNING_CENTERS && (
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                            <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                    {city.status === ProcessStatus.IDLE && <button onClick={startProcess} className="p-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200"><PlayIcon className="w-5 h-5" /></button>}
                    {isProcessing && <button onClick={stopProcess} className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200"><StopIcon className="w-5 h-5" /></button>}
                    {isProcessing && <SpinnerIcon className="text-sky-600" />}

                    {city.status === ProcessStatus.AWAITING_CONFIRMATION && (
                        <div className="flex gap-2">
                             <button onClick={() => onUpdate({ ...city, status: ProcessStatus.IDLE })} className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                            <button onClick={continueProcess} className="px-3 py-1 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700">Proceed</button>
                        </div>
                    )}
                    {(city.status === ProcessStatus.COMPLETED || city.status === ProcessStatus.ERROR || city.status === ProcessStatus.STOPPED) && (
                        <button onClick={resetProcess} className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><RescanIcon className="w-5 h-5" /></button>
                    )}
                    
                    {city.centers.length > 0 && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon className="w-5 h-5 text-slate-600" />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && city.centers.length > 0 && (
                <div className="border-t border-slate-200 p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {city.centers.map((center, index) => (
                            <CenterTile key={`${center.name}-${index}`} center={center} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
