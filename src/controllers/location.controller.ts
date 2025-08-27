import { NextFunction, Response } from 'express';

import * as locationService from '../services/location.service';
import { AuthRequest } from '../types/express';

export const createLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.unauthorized('User not authenticated');
    }

    const { location, latitude, longitude, location_type, city, state, country } = req.body;

    // Validate required fields
    if (!location || !latitude || !longitude || !location_type) {
      return res.fail('Missing required fields: location, latitude, longitude, location_type', 400);
    }

    // Validate location_type enum
    if (!['HOME', 'WORK', 'OTHER'].includes(location_type)) {
      return res.fail('Invalid location_type. Must be HOME, WORK, or OTHER', 400);
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return res.fail('Invalid latitude. Must be between -90 and 90', 400);
    }
    if (longitude < -180 || longitude > 180) {
      return res.fail('Invalid longitude. Must be between -180 and 180', 400);
    }

    const newLocation = await locationService.createLocationForUser(userId, {
      location,
      latitude,
      longitude,
      location_type,
      city,
      state,
      country,
    });

    return res.created(newLocation, 'Location created successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserLocations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.unauthorized('User not authenticated');
    }

    const locations = await locationService.getUserLocations(userId);
    return res.success(locations, 'User locations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.unauthorized('User not authenticated');
    }

    const { locationId } = req.params;
    if (!locationId) {
      return res.fail('Location ID is required', 400);
    }

    const location = await locationService.getLocationById(locationId, userId);
    return res.success(location, 'Location retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.unauthorized('User not authenticated');
    }

    const { locationId } = req.params;
    if (!locationId) {
      return res.fail('Location ID is required', 400);
    }

    const { location, latitude, longitude, location_type, city, state, country } = req.body;

    // Validate location_type if provided
    if (location_type && !['HOME', 'WORK', 'OTHER'].includes(location_type)) {
      return res.fail('Invalid location_type. Must be HOME, WORK, or OTHER', 400);
    }

    // Validate coordinates if provided
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return res.fail('Invalid latitude. Must be between -90 and 90', 400);
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return res.fail('Invalid longitude. Must be between -180 and 180', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (location !== undefined) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (location_type !== undefined) updateData.location_type = location_type;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;

    if (Object.keys(updateData).length === 0) {
      return res.fail('No valid fields to update', 400);
    }

    const updatedLocation = await locationService.updateLocation(locationId, userId, updateData);
    return res.success(updatedLocation, 'Location updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.unauthorized('User not authenticated');
    }

    const { locationId } = req.params;
    if (!locationId) {
      return res.fail('Location ID is required', 400);
    }

    const result = await locationService.deleteLocation(locationId, userId);
    return res.success(result, 'Location deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getNearbyLocations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.fail('Latitude and longitude are required', 400);
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusKm = radius ? parseFloat(radius as string) : 10;

    // Validate coordinates
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.fail('Invalid latitude. Must be between -90 and 90', 400);
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.fail('Invalid longitude. Must be between -180 and 180', 400);
    }
    if (isNaN(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
      return res.fail('Invalid radius. Must be between 0 and 100 km', 400);
    }

    const nearbyLocations = await locationService.getNearbyLocations(lat, lng, radiusKm);
    return res.success(nearbyLocations, 'Nearby locations retrieved successfully');
  } catch (error) {
    next(error);
  }
};
