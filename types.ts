
export interface City {
  name: string;
  population: number;
}

export interface ScanCenter {
  name: string;
  address: string;
  pincode: string;
  contactNumber: string;
  googleRating: number;
  mapLink: string;
  website: string;
  ctAvailable: boolean;
}

export enum ProcessStatus {
  IDLE = 'idle',
  SCANNING_PINCODES = 'scanning_pincodes',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  SCANNING_CENTERS = 'scanning_centers',
  COMPLETED = 'completed',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export interface CityProcess extends City {
  id: string;
  status: ProcessStatus;
  pincodes: string[];
  centers: ScanCenter[];
  foundPincodesCount: number;
  scannedPincodesCount: number;
  errorMessage: string | null;
}

export interface LocationCoords {
    latitude: number;
    longitude: number;
}
