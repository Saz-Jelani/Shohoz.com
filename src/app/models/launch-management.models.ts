export interface DestinationPricing {
  to: string;
  acFare: number;
  nonAcFare: number;
}

export interface LaunchScheduleEntry {
  id?: number;
  from: string;
  operatorName: string;
  operatorImage?: string;
  busName: string; 
  busNumber: string;
  to: string;
  serviceType: 'AC' | 'Non AC';
  price: number;
  discountPrice?: number | null;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  boardingPoints: string[];
  boardingPointTimes?: string[];
  unavailableSeats: string[];
  cabinUnavailableSeats?: string[];
  cabinPriceEconomy?: number;
  cabinPricePremium?: number;
  createdByUserId: number;
}
