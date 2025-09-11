import AppError from '../utils/AppError';

export interface GoogleMapsLocation {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
    html_attributions: string[];
  }>;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  vicinity?: string;
}

export interface SearchBusinessResult {
  id: string;
  name: string | null;
  username: string;
  logo_url?: string | null;
  about?: string | null;
  email?: string | null;
  website?: string | null;
  rating: number | null;
  ratingCount: number;
  categories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
  locations: Array<{
    id: string;
    address: string;
    latitude: number;
    longitude: number;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  }>;
  _count: {
    businessReviews: number;
    followers: number;
  };
  source: 'local' | 'google';
  place_id?: string;
  google_rating?: number;
  google_rating_count?: number;
}

export class GoogleMapsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured');
    }
  }

  /**
   * Check if Google Maps API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search businesses using Google Places API with location
   */
  async searchNearbyBusinesses(
    query: string,
    location: GoogleMapsLocation,
  ): Promise<SearchBusinessResult[]> {
    if (!this.isConfigured()) {
      console.warn('Google Maps API key not configured, returning empty results');
      return [];
    }

    try {
      const url = new URL(`${this.baseUrl}/nearbysearch/json`);
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('location', `${location.latitude},${location.longitude}`);
      url.searchParams.set('radius', (location.radius || 5000).toString());
      url.searchParams.set('keyword', query);
      url.searchParams.set('type', 'establishment');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Maps API error:', data.error_message);
        return [];
      }

      return this.formatSearchResults(data.results || []);
    } catch (error) {
      console.error('Google Maps nearby search error:', error);
      return [];
    }
  }

  /**
   * Search businesses using Google Places Text Search API
   */
  async searchBusinessesByText(query: string): Promise<GooglePlaceResult[]> {
    if (!this.isConfigured()) {
      throw new AppError('Google Maps API key not configured', 500);
    }

    try {
      const url = new URL(`${this.baseUrl}/textsearch/json`);
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('query', query);
      url.searchParams.set('type', 'establishment');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.error_message);
        throw new AppError('Google Places API error', 500, { details: data.error_message });
      }

      return data.results?.map(this.formatPlaceResult) || [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Google Places text search error:', error);
      throw new AppError('Failed to search Google Places', 500, { originalError: error });
    }
  }

  /**
   * Get photo URL from Google Places photo reference
   */
  getPhotoUrl(photoReference: string, maxWidth = 400): string {
    if (!this.isConfigured()) {
      throw new AppError('Google Maps API key not configured', 500);
    }

    const url = new URL(`${this.baseUrl}/photo`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('photoreference', photoReference);
    url.searchParams.set('maxwidth', maxWidth.toString());

    return url.toString();
  }

  /**
   * Format Google Places result for consistent API response
   */
  private formatPlaceResult = (place: any): GooglePlaceResult => ({
    place_id: place.place_id || '',
    name: place.name || '',
    formatted_address: place.formatted_address,
    rating: place.rating || null,
    user_ratings_total: place.user_ratings_total || 0,
    price_level: place.price_level || null,
    types: place.types || [],
    geometry: place.geometry,
    photos:
      place.photos?.map((photo: any) => ({
        photo_reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        html_attributions: photo.html_attributions,
      })) || [],
    opening_hours: place.opening_hours
      ? {
          open_now: place.opening_hours.open_now,
          weekday_text: place.opening_hours.weekday_text,
        }
      : undefined,
    vicinity: place.vicinity,
  });

  /**
   * Format Google Places results to match local business format for search
   */
  private formatSearchResults(places: any[]): SearchBusinessResult[] {
    return places.slice(0, 10).map((place) => ({
      id: `google_${place.place_id}`,
      name: place.name,
      username: (place.name as string)?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
      logo_url: (place.photos as any[])?.[0]
        ? this.getPhotoUrl((place.photos as any[])[0].photo_reference, 400)
        : null,
      about: null,
      email: null,
      website: null,
      rating: place.rating || null,
      ratingCount: place.user_ratings_total || 0,
      categories:
        place.types?.slice(0, 3).map((type: string) => ({
          category: {
            id: type,
            name: type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          },
        })) || [],
      locations: [
        {
          id: `google_location_${place.place_id}`,
          address: place.vicinity || place.formatted_address || '',
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0,
          city: null,
          state: null,
          country: null,
        },
      ],
      _count: {
        businessReviews: place.user_ratings_total || 0,
        followers: 0,
      },
      source: 'google' as const,
      place_id: place.place_id,
      google_rating: place.rating,
      google_rating_count: place.user_ratings_total,
    }));
  }

  /**
   * Search businesses with combined text and location search
   */
  async searchBusinesses(
    query: string,
    location?: GoogleMapsLocation,
  ): Promise<SearchBusinessResult[]> {
    if (!this.isConfigured()) {
      console.warn('Google Maps API key not configured, returning empty results');
      return [];
    }

    try {
      if (location) {
        // Use nearby search when location is provided
        return await this.searchNearbyBusinesses(query, location);
      } else {
        // Use text search when no location is provided
        const results = await this.searchBusinessesByText(query);
        return this.formatSearchResults(results as any);
      }
    } catch (error) {
      console.error('Google Maps search error:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance); // Return distance in meters
  }
}
