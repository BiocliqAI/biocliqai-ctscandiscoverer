import React, { useState, useCallback } from 'react';
import { City } from '../types';
// Fix: Imported SpinnerIcon to be used in the component.
import { SpinnerIcon } from './icons';

interface FileUploadProps {
  onFileParsed: (cities: City[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileParsed }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          throw new Error("CSV file must have a header and at least one data row.");
        }
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const cityIndex = header.indexOf('city');
        const populationIndex = header.indexOf('population');

        if (cityIndex === -1 || populationIndex === -1) {
          throw new Error("CSV must contain 'city' and 'population' columns.");
        }

        const cities: City[] = lines.slice(1).map(line => {
          const data = line.split(',');
          const name = data[cityIndex]?.trim();
          const population = parseInt(data[populationIndex]?.trim(), 10);
          
          if (!name || isNaN(population)) {
              return null;
          }
          return { name, population };
        }).filter((c): c is City => c !== null);

        if (cities.length === 0) {
            throw new Error("No valid city data could be parsed from the file.");
        }

        const sortedCities = cities.sort((a, b) => b.population - a.population);
        onFileParsed(sortedCities.slice(0, 100));

      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred during parsing.");
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
        setError("Failed to read the file.");
        setLoading(false);
    }

    reader.readAsText(file);
  }, [onFileParsed]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border border-slate-200 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Upload City Data</h2>
          <p className="mt-2 text-sm text-slate-600">
            Please upload a CSV file with 'city' and 'population' columns.
          </p>
        </div>
        <div className="flex flex-col items-center">
            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-sky-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2 hover:text-sky-500">
                <div className="w-full px-4 py-2 text-center text-white bg-sky-600 rounded-lg shadow-md hover:bg-sky-700 transition-colors">
                  {loading ? <SpinnerIcon className="w-5 h-5 mx-auto" /> : 'Select CSV File'}
                </div>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} disabled={loading} />
            </label>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};
