export interface Shop {
  id: string;
  name: string;
  rating: number;
  review_count?: number;
  price?: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  image_url?: string;
  url: string;  
  phone?: string;
  distance?: number;
  categories?: any[];
  is_closed?: boolean;
  photos?: string[];
}