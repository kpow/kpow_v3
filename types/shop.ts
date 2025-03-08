// Shared shop interfaces between frontend and backend
export interface Shop {
  id: string;
  name: string;
  rating: number;
  review_count?: number;
  price?: string;
  address: string;
  coordinates: Coordinates;
  image_url?: string;
  url: string;  
  phone?: string;
  distance?: number;
  categories?: any[];
  is_closed?: boolean;
  photos?: string[];
  isNearby?: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CityCenter {
  coordinates: Coordinates;
  display_name: string;
}

export interface YelpResponse {
  shops: Shop[];
  chainStores: Shop[];
  cityCenter: CityCenter | null;
  metrics: {
    donutResults: number;
    doughnutResults: number;
    totalUniqueShops: number;
    filteredShops: number;
    nearbyShops: number;
    chainStoresFiltered: number;
  };
}
