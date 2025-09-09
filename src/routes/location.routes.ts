import { Router } from 'express';

import * as locationController from '../controllers/location.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique location identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this location
 *         address:
 *           type: string
 *           nullable: true
 *           description: Street address
 *         zip_code:
 *           type: string
 *           nullable: true
 *           description: Postal/ZIP code
 *         latitude:
 *           type: number
 *           description: GPS latitude coordinate
 *         longitude:
 *           type: number
 *           description: GPS longitude coordinate
 *         location:
 *           type: string
 *           description: General location description
 *         location_type:
 *           type: string
 *           enum: [HOME, WORK, OTHER]
 *           description: Type of location
 *         city:
 *           type: string
 *           nullable: true
 *           description: City name
 *         state:
 *           type: string
 *           nullable: true
 *           description: State/Province
 *         country:
 *           type: string
 *           nullable: true
 *           description: Country name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the location was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the location was last updated
 *       required:
 *         - userId
 *         - latitude
 *         - longitude
 *         - location
 *
 *     CreateLocationRequest:
 *       type: object
 *       required: [location, latitude, longitude]
 *       properties:
 *         address:
 *           type: string
 *           description: Street address (optional)
 *         zip_code:
 *           type: string
 *           description: Postal/ZIP code (optional)
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           description: GPS latitude coordinate
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           description: GPS longitude coordinate
 *         location:
 *           type: string
 *           description: General location description
 *         location_type:
 *           type: string
 *           enum: [HOME, WORK, OTHER]
 *           nullable: true
 *           description: Type of location (optional)
 *         city:
 *           type: string
 *           description: City name (optional)
 *         state:
 *           type: string
 *           description: State/Province (optional)
 *         country:
 *           type: string
 *           description: Country name (optional)
 *
 *     UpdateLocationRequest:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *           description: Street address
 *         zip_code:
 *           type: string
 *           description: Postal/ZIP code
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           description: GPS latitude coordinate
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           description: GPS longitude coordinate
 *         location:
 *           type: string
 *           description: General location description
 *         location_type:
 *           type: string
 *           enum: [HOME, WORK, OTHER]
 *           nullable: true
 *           description: Type of location (optional)
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State/Province
 *         country:
 *           type: string
 *           description: Country name
 */

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location for the authenticated user
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [location, latitude, longitude]
 *             properties:
 *               address:
 *                 type: string
 *                 description: Street address (optional)
 *               zip_code:
 *                 type: string
 *                 description: Postal/ZIP code (optional)
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: GPS latitude coordinate
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: GPS longitude coordinate
 *               location:
 *                 type: string
 *                 description: General location description
 *               location_type:
 *                 type: string
 *                 enum: [HOME, WORK, OTHER]
 *                 nullable: true
 *                 description: Type of location (optional)
 *               city:
 *                 type: string
 *                 description: City name (optional)
 *               state:
 *                 type: string
 *                 description: State/Province (optional)
 *               country:
 *                 type: string
 *                 description: Country name (optional)
 *           example:
 *             address: "123 Main Street"
 *             zip_code: "12345"
 *             latitude: 40.7128
 *             longitude: -74.0060
 *             location: "Downtown Office Building"
 *             location_type: "WORK"
 *             city: "New York"
 *             state: "NY"
 *             country: "USA"
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Location'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', requireAuth(), locationController.createLocation);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations for the authenticated user
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Location'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', requireAuth(), locationController.getUserLocations);

/**
 * @swagger
 * /api/locations/nearby:
 *   get:
 *     summary: Get nearby locations within a specified radius
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Center point latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Center point longitude
 *       - in: query
 *         name: radius
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 10
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: Nearby locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           address:
 *                             type: string
 *                           zip_code:
 *                             type: string
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           location:
 *                             type: string
 *                           location_type:
 *                             type: string
 *                             enum: [HOME, WORK, OTHER]
 *                           city:
 *                             type: string
 *                           state:
 *                             type: string
 *                           country:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               user_type:
 *                                 type: string
 *                                 enum: [INDIVIDUAL, BUSINESS]
 *                               logo_url:
 *                                 type: string
 *       400:
 *         description: Bad request - invalid coordinates or radius
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/nearby', locationController.getNearbyLocations);

/**
 * @swagger
 * /api/locations/{locationId}:
 *   get:
 *     summary: Get a specific location by ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Location'
 *       400:
 *         description: Bad request - missing location ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:locationId', requireAuth(), locationController.getLocationById);

/**
 * @swagger
 * /api/locations/{locationId}:
 *   put:
 *     summary: Update a specific location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLocationRequest'
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Location'
 *       400:
 *         description: Bad request - validation error or no fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:locationId', requireAuth(), locationController.updateLocation);

/**
 * @swagger
 * /api/locations/{locationId}:
 *   delete:
 *     summary: Delete a specific location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Location deleted successfully"
 *       400:
 *         description: Bad request - missing location ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:locationId', requireAuth(), locationController.deleteLocation);

export default router;
