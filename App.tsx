
import React, { useState } from 'react';
import { City, CityProcess, ProcessStatus, LocationCoords } from './types';
import { FileUpload } from './components/FileUpload';
import { CityTile } from './components/CityTile';
import { useGeolocation } from './hooks/useGeolocation';

const App: React.FC = () => {
  const [cities, setCities] = useState<CityProcess[]>([]);
  const { location, error: geoError } = useGeolocation();
  
  const handleFileParsed = (parsedCities: City[]) => {
    const cityProcesses: CityProcess[] = parsedCities.map(city => ({
      ...city,
      id: city.name,
      status: ProcessStatus.IDLE,
      pincodes: [],
      centers: [],
      foundPincodesCount: 0,
      scannedPincodesCount: 0,
      errorMessage: null,
    }));
    setCities(cityProcesses);
  };
  
  const handleCityUpdate = (updatedCity: CityProcess) => {
    setCities(prevCities =>
      prevCities.map(c => (c.id === updatedCity.id ? updatedCity : c))
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
                <h1 className="text-2xl font-bold text-slate-800">India CT Scan Discovery</h1>
                <p className="text-sm text-slate-500">Discover scan centers in the top 100 cities of India.</p>
            </div>
        </header>

        <main className="container mx-auto p-4 md:p-6">
            {cities.length === 0 ? (
                <div className="mt-10">
                    <FileUpload onFileParsed={handleFileParsed} />
                </div>
            ) : (
                <div>
                  {geoError && <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg text-sm">{geoError}</div>}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {cities.map(city => (
                          <CityTile 
                              key={city.id} 
                              city={city} 
                              onUpdate={handleCityUpdate} 
                              location={location}
                          />
                      ))}
                  </div>
                </div>
            )}
        </main>
    </div>
  );
};

export default App;
