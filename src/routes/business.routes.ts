import express from 'express';

import BusinessController from '../controllers/business.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { dataFetchLimiter } from '../middlewares/rateLimit.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Businesses
 *     description: Business discovery, filtering, statistics and Google Maps integration
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT access token for authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BusinessResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique business identifier
 *         username:
 *           type: string
 *           description: Business username/handle
 *         name:
 *           type: string
 *           description: Business display name
 *         logo_url:
 *           type: string
 *           nullable: true
 *           description: URL to business logo image
 *         about:
 *           type: string
 *           nullable: true
 *           description: Business description
 *         email:
 *           type: string
 *           nullable: true
 *           description: Business contact email
 *         website:
 *           type: string
 *           nullable: true
 *           description: Business website URL
 *         rating:
 *           type: number
 *           nullable: true
 *           description: Average rating (calculated from rating_sum/review_count)
 *           minimum: 1
 *           maximum: 5
 *         ratingCount:
 *           type: integer
 *           description: Total number of reviews
 *         distance:
 *           type: number
 *           nullable: true
 *           description: Distance in meters (only when location provided)
 *         source:
 *           type: string
 *           enum: [local, google]
 *           description: Source of the business data
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   icon:
 *                     type: string
 *                     nullable: true
 *         locations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               city:
 *                 type: string
 *                 nullable: true
 *               state:
 *                 type: string
 *                 nullable: true
 *               country:
 *                 type: string
 *                 nullable: true
 *         _count:
 *           type: object
 *           properties:
 *             businessReviews:
 *               type: integer
 *             followers:
 *               type: integer
 *     BusinessDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         username:
 *           type: string
 *         name:
 *           type: string
 *         logo_url:
 *           type: string
 *           nullable: true
 *         about:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           nullable: true
 *         website:
 *           type: string
 *           nullable: true
 *         video_url:
 *           type: string
 *           nullable: true
 *         rating:
 *           type: number
 *           nullable: true
 *         ratingCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *         locations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *         _count:
 *           type: object
 *           properties:
 *             businessReviews:
 *               type: integer
 *             followers:
 *               type: integer
 *             businessVideos:
 *               type: integer
 *     GooglePlaceResult:
 *       type: object
 *       properties:
 *         place_id:
 *           type: string
 *         name:
 *           type: string
 *         formatted_address:
 *           type: string
 *           nullable: true
 *         rating:
 *           type: number
 *           nullable: true
 *         user_ratings_total:
 *           type: integer
 *         price_level:
 *           type: integer
 *           nullable: true
 *         types:
 *           type: array
 *           items:
 *             type: string
 *         geometry:
 *           type: object
 *           properties:
 *             location:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                 lng:
 *                   type: number
 *         photos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               photo_reference:
 *                 type: string
 *               height:
 *                 type: integer
 *               width:
 *                 type: integer
 *               html_attributions:
 *                 type: array
 *                 items:
 *                   type: string
 *         opening_hours:
 *           type: object
 *           properties:
 *             open_now:
 *               type: boolean
 *             weekday_text:
 *               type: array
 *               items:
 *                 type: string
 *           nullable: true
 *         vicinity:
 *           type: string
 *           nullable: true
 *     BusinessStats:
 *       type: object
 *       properties:
 *         totalBusinesses:
 *           type: integer
 *           example: 1200
 *         newBusinessesLastMonth:
 *           type: integer
 *           example: 50
 *         averageRating:
 *           type: number
 *           format: float
 *           example: 4.25
 *         totalReviews:
 *           type: integer
 *           example: 8500
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: fail
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         details:
 *           type: object
 *           nullable: true
 */

/**
 * @swagger
 * /api/businesses/categories:
 *   post:
 *     summary: Get businesses by category
 *     description: |
 *       Retrieves businesses filtered by one or more category IDs, with optional rating, search, and location filters.
 *       Supports pagination and sorting. Perfect for building category-based business discovery pages.
 *       **Features:**
 *       - Filter by multiple categories simultaneously
 *       - Location-based radius filtering with distance calculation
 *       - Rating threshold filtering
 *       - Text search within categories
 *       - Multiple sorting options (rating, reviews, name, distance)
 *       - Pagination support for large result sets
 *       **Use Cases:**
 *       - Category browsing pages
 *       - Filtered search results
 *       - Location-based business discovery
 *       - Rating-based recommendations
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of category IDs to filter by
 *                 example: ["550e8400-e29b-41d4-a716-446655440000"]
 *                 minItems: 1
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Minimum rating filter (businesses with this rating or higher)
 *                 example: 4.0
 *               search:
 *                 type: string
 *                 description: Search term for business name, username, or about description
 *                 example: "coffee shop"
 *                 minLength: 1
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: User's latitude for location-based search
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: User's longitude for location-based search
 *                 example: -74.0060
 *               radius:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50000
 *                 description: Search radius in meters (for location-based search)
 *                 example: 5000
 *                 default: 5000
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 description: Page number for pagination
 *                 example: 1
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Number of results per page
 *                 example: 20
 *                 default: 20
 *               sortBy:
 *                 type: string
 *                 enum: [rating, reviews, name, distance]
 *                 description: Field to sort results by
 *                 example: rating
 *                 default: rating
 *               sortOrder:
 *                 type: string
 *                 enum: [asc, desc]
 *                 description: Sort order (ascending or descending)
 *                 example: desc
 *                 default: desc
 *           examples:
 *             basic_category_search:
 *               summary: Basic category filtering
 *               value:
 *                 categoryIds: ["cat-restaurant-uuid", "cat-cafe-uuid"]
 *                 page: 1
 *                 limit: 20
 *             location_based_search:
 *               summary: Location-based category search
 *               value:
 *                 categoryIds: ["cat-restaurant-uuid"]
 *                 latitude: 40.7128
 *                 longitude: -74.0060
 *                 radius: 2000
 *                 rating: 4.0
 *                 sortBy: distance
 *                 sortOrder: asc
 *             filtered_search:
 *               summary: Advanced filtered search
 *               value:
 *                 categoryIds: ["cat-restaurant-uuid"]
 *                 search: "italian pizza"
 *                 rating: 3.5
 *                 sortBy: rating
 *                 sortOrder: desc
 *                 page: 1
 *                 limit: 10
 *     responses:
 *       200:
 *         description: Businesses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Businesses fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     businesses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BusinessResult'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 156
 *                         totalPages:
 *                           type: integer
 *                           example: 8
 *                     filters:
 *                       type: object
 *                       properties:
 *                         rating:
 *                           type: number
 *                           example: 4.0
 *                         search:
 *                           type: string
 *                           example: "coffee shop"
 *                         location:
 *                           type: object
 *                           properties:
 *                             latitude:
 *                               type: number
 *                             longitude:
 *                               type: number
 *                             radius:
 *                               type: integer
 *                     categoryIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["cat-restaurant-uuid"]
 *             examples:
 *               success_response:
 *                 summary: Successful category search
 *                 value:
 *                   status: success
 *                   message: "Businesses fetched successfully"
 *                   data:
 *                     businesses:
 *                       - id: "business-uuid-1"
 *                         username: "mario_pizzeria"
 *                         name: "Mario's Pizzeria"
 *                         logo_url: "https://example.com/logo.jpg"
 *                         rating: 4.5
 *                         ratingCount: 127
 *                         distance: 850
 *                         categories:
 *                           - category:
 *                               id: "cat-restaurant-uuid"
 *                               name: "Restaurants"
 *                         locations:
 *                           - address: "123 Main St, New York, NY"
 *                             latitude: 40.7128
 *                             longitude: -74.0060
 *                     pagination:
 *                       page: 1
 *                       limit: 20
 *                       total: 156
 *                       totalPages: 8
 *                     filters:
 *                       rating: 4.0
 *                     categoryIds: ["cat-restaurant-uuid"]
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_categories:
 *                 summary: Missing category IDs
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Category IDs are required"
 *                   details: null
 *               invalid_rating:
 *                 summary: Invalid rating value
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Rating must be between 1 and 5"
 *                   details: null
 *               invalid_pagination:
 *                 summary: Invalid pagination parameters
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Limit must be between 1 and 100"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Missing or invalid token
 *                 value:
 *                   status: fail
 *                   statusCode: 401
 *                   message: "Access token is required"
 *                   details: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Internal server error
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "Failed to get businesses by category"
 *                   details: null
 */
router.post(
  '/categories',
  dataFetchLimiter,
  requireAuth(),
  BusinessController.getBusinessesByCategory,
);

/**
 * @swagger
 * /api/businesses/google-places:
 *   post:
 *     summary: Search Google Places
 *     description: |
 *       Direct search using Google Places API for external business data.
 *       Useful for finding businesses not yet in the local database.
 *       **Features:**
 *       - Direct integration with Google Places API
 *       - Text-based and location-based search
 *       - Rich business information from Google
 *       - Photo references and ratings
 *       - Opening hours and business types
 *       **Use Cases:**
 *       - External business discovery
 *       - Data enrichment for local businesses
 *       - Competitor analysis
 *       - Market research
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 1
 *                 description: Search query for businesses
 *                 example: "coffee shops near central park"
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude for location-based search
 *                 example: 40.7829
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude for location-based search
 *                 example: -73.9654
 *               radius:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50000
 *                 description: Search radius in meters
 *                 example: 1000
 *                 default: 5000
 *           examples:
 *             text_search:
 *               summary: Text-based search
 *               value:
 *                 query: "italian restaurants manhattan"
 *             location_search:
 *               summary: Location-based search
 *               value:
 *                 query: "coffee shop"
 *                 latitude: 40.7829
 *                 longitude: -73.9654
 *                 radius: 1000
 *     responses:
 *       200:
 *         description: Google Places search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Google Places search completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     places:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GooglePlaceResult'
 *                     query:
 *                       type: string
 *                       example: "coffee shops"
 *                     location:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                         radius:
 *                           type: integer
 *                       nullable: true
 *                     count:
 *                       type: integer
 *                       example: 15
 *             examples:
 *               success_response:
 *                 summary: Successful Google Places search
 *                 value:
 *                   status: success
 *                   message: "Google Places search completed successfully"
 *                   data:
 *                     places:
 *                       - place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *                         name: "Starbucks Coffee"
 *                         formatted_address: "123 5th Avenue, New York, NY 10003, USA"
 *                         rating: 4.2
 *                         user_ratings_total: 1547
 *                         price_level: 2
 *                         types: ["cafe", "food", "point_of_interest", "store", "establishment"]
 *                         geometry:
 *                           location:
 *                             lat: 40.7505
 *                             lng: -73.9934
 *                         photos:
 *                           - photo_reference: "AelY_CtOhdbwz6WaXDvgS4NnP1hY"
 *                             height: 1080
 *                             width: 1920
 *                         opening_hours:
 *                           open_now: true
 *                           weekday_text:
 *                             - "Monday: 6:00 AM – 10:00 PM"
 *                             - "Tuesday: 6:00 AM – 10:00 PM"
 *                     query: "coffee shops"
 *                     location:
 *                       latitude: 40.7829
 *                       longitude: -73.9654
 *                       radius: 1000
 *                     count: 15
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_query:
 *                 summary: Missing search query
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Search query is required"
 *                   details: null
 *               invalid_coordinates:
 *                 summary: Invalid latitude or longitude
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Invalid latitude or longitude"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
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
 *             examples:
 *               google_api_error:
 *                 summary: Google Places API error
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "Failed to search Google Places"
 *                   details: null
 */
router.post(
  '/google-places',
  dataFetchLimiter,
  requireAuth(),
  BusinessController.searchGooglePlaces,
);

/**
 * @swagger
 * /api/businesses/popular:
 *   get:
 *     summary: Get popular/trending businesses
 *     description: |
 *       Get trending businesses based on recent review activity and overall ratings.
 *       Uses a sophisticated trending algorithm that considers recent activity, ratings, and followers.
 *       **Trending Algorithm:**
 *       - Recent reviews (weighted heavily)
 *       - Overall rating and review count
 *       - Follower engagement
 *       - Configurable timeframe analysis
 *       **Features:**
 *       - Timeframe-based trending (day/week/month)
 *       - Category filtering
 *       - Configurable result limits
 *       - Only includes businesses with recent activity
 *       **Use Cases:**
 *       - Homepage trending sections
 *       - Discovery pages
 *       - Marketing insights
 *       - Popular business widgets
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of trending businesses to return
 *         example: 15
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         style: form
 *         explode: true
 *         description: Filter by specific category IDs
 *         example: ["cat-restaurant-uuid", "cat-cafe-uuid"]
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Timeframe for trending analysis
 *         example: week
 *     responses:
 *       200:
 *         description: Popular businesses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Popular businesses fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     businesses:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/BusinessResult'
 *                           - type: object
 *                             properties:
 *                               recentReviews:
 *                                 type: integer
 *                                 description: Number of reviews in the specified timeframe
 *                               trendingScore:
 *                                 type: number
 *                                 description: Calculated trending score
 *                     timeframe:
 *                       type: string
 *                       example: week
 *                     total:
 *                       type: integer
 *                       example: 10
 *             examples:
 *               success_response:
 *                 summary: Trending businesses for the week
 *                 value:
 *                   status: success
 *                   message: "Popular businesses fetched successfully"
 *                   data:
 *                     businesses:
 *                       - id: "business-uuid-1"
 *                         username: "trending_cafe"
 *                         name: "The Trending Cafe"
 *                         logo_url: "https://example.com/logo.jpg"
 *                         rating: 4.8
 *                         ratingCount: 89
 *                         recentReviews: 23
 *                         trendingScore: 147.5
 *                         categories:
 *                           - category:
 *                               id: "cat-cafe-uuid"
 *                               name: "Cafes"
 *                         locations:
 *                           - address: "456 Trend St, Brooklyn, NY"
 *                             latitude: 40.6782
 *                             longitude: -73.9442
 *                         _count:
 *                           businessReviews: 89
 *                           followers: 234
 *                     timeframe: "week"
 *                     total: 10
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_limit:
 *                 summary: Invalid limit parameter
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Limit must be between 1 and 50"
 *                   details: null
 *               invalid_timeframe:
 *                 summary: Invalid timeframe
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Timeframe must be one of: day, week, month"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
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
router.get('/popular', dataFetchLimiter, requireAuth(), BusinessController.getPopularBusinesses);

/**
 * @swagger
 * /api/businesses/{businessId}:
 *   get:
 *     summary: Get business details
 *     description: |
 *       Retrieves detailed information for a specific business by its ID.
 *       Includes complete business profile, locations, categories, and statistics.
 *       **Information Included:**
 *       - Complete business profile (name, description, contact info)
 *       - All business locations with coordinates
 *       - Associated categories
 *       - Review and follower statistics
 *       - Video content URLs if available
 *       - Creation timestamp
 *       **Use Cases:**
 *       - Business detail pages
 *       - Profile displays
 *       - Admin business management
 *       - Analytics dashboards
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the business to retrieve
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Business details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Business details fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/BusinessDetails'
 *             examples:
 *               success_response:
 *                 summary: Complete business details
 *                 value:
 *                   status: success
 *                   message: "Business details fetched successfully"
 *                   data:
 *                     id: "business-uuid-123"
 *                     username: "mario_pizzeria"
 *                     name: "Mario's Authentic Pizzeria"
 *                     logo_url: "https://example.com/logos/mario.jpg"
 *                     about: "Authentic Italian pizza since 1985. Family recipes passed down through generations."
 *                     email: "info@mariospizza.com"
 *                     website: "https://mariospizza.com"
 *                     video_url: "https://example.com/videos/mario-intro.mp4"
 *                     rating: 4.7
 *                     ratingCount: 324
 *                     createdAt: "2023-01-15T10:30:00Z"
 *                     categories:
 *                       - category:
 *                           id: "cat-restaurant-uuid"
 *                           name: "Restaurants"
 *                       - category:
 *                           id: "cat-italian-uuid"
 *                           name: "Italian Cuisine"
 *                     locations:
 *                       - id: "loc-uuid-1"
 *                         address: "123 Main Street, New York, NY 10001"
 *                         latitude: 40.7128
 *                         longitude: -74.0060
 *                         city: "New York"
 *                         state: "NY"
 *                         country: "USA"
 *                     _count:
 *                       businessReviews: 324
 *                       followers: 1250
 *                       businessVideos: 5
 *       400:
 *         description: Bad request - missing business ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_id:
 *                 summary: Missing business ID
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Business ID is required"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Business not found
 *                 value:
 *                   status: fail
 *                   statusCode: 404
 *                   message: "Business not found"
 *                   details: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:businessId', dataFetchLimiter, requireAuth(), BusinessController.getBusinessDetails);

/**
 * @swagger
 * /api/businesses/stats:
 *   get:
 *     summary: Get overall business statistics
 *     description: |
 *       Retrieves various statistics about businesses in the system, such as total count,
 *       new businesses in the last month, average rating, and total reviews.
 *       This endpoint is useful for administrative dashboards or general insights.
 *       **Statistics Included:**
 *       - Total number of active businesses
 *       - New businesses registered in the last month
 *       - Average rating across all businesses
 *       - Total number of reviews across all businesses
 *       **Use Cases:**
 *       - Admin dashboards
 *       - Business analytics
 *       - Platform insights
 *       - Performance metrics
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business statistics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Business statistics fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/BusinessStats'
 *             examples:
 *               success_response:
 *                 summary: Complete business statistics
 *                 value:
 *                   status: success
 *                   message: "Business statistics fetched successfully"
 *                   data:
 *                     totalBusinesses: 1847
 *                     newBusinessesLastMonth: 73
 *                     averageRating: 4.28
 *                     totalReviews: 12456
 *       401:
 *         description: Unauthorized - missing or invalid access token
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
 *             examples:
 *               stats_error:
 *                 summary: Error fetching statistics
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "Failed to get business statistics"
 *                   details: null
 */
router.get('/stats', dataFetchLimiter, requireAuth(), BusinessController.getBusinessStats);

/**
 * @swagger
 * /api/businesses/nearby:
 *   post:
 *     summary: Get nearby businesses
 *     description: |
 *       **📍 Location-Based Business Discovery**
 *       Find businesses within a specified radius of a given location.
 *       Perfect for "near me" functionality and location-based recommendations.
 *       **🚀 Features:**
 *       - **Radius-based Search**: Find businesses within specified distance
 *       - **Distance Sorting**: Results automatically sorted by proximity
 *       - **Category Filtering**: Optional category-based filtering
 *       - **Rating Filtering**: Optional minimum rating threshold
 *       - **Real-time Results**: Live data from your business database
 *       **💡 Use Cases:**
 *       - "Near me" search functionality
 *       - Location-based recommendations
 *       - Map-based business discovery
 *       - Travel and tourism apps
 *       - Local business finder
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: User's latitude coordinate
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: User's longitude coordinate
 *                 example: -74.0060
 *               radius:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 50000
 *                 description: Search radius in meters
 *                 example: 2000
 *                 default: 5000
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional category IDs to filter by
 *                 example: ["cat-restaurant-uuid", "cat-cafe-uuid"]
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Optional minimum rating filter
 *                 example: 4.0
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Maximum number of results to return
 *                 example: 20
 *                 default: 20
 *           examples:
 *             basic_nearby:
 *               summary: Basic nearby search
 *               value:
 *                 latitude: 40.7128
 *                 longitude: -74.0060
 *                 radius: 2000
 *                 limit: 15
 *             filtered_nearby:
 *               summary: Filtered nearby search
 *               value:
 *                 latitude: 40.7589
 *                 longitude: -73.9851
 *                 radius: 1000
 *                 categoryIds: ["cat-restaurant-uuid"]
 *                 rating: 4.0
 *                 limit: 10
 *             wide_search:
 *               summary: Wide area search
 *               value:
 *                 latitude: 40.7505
 *                 longitude: -73.9934
 *                 radius: 10000
 *                 limit: 50
 *     responses:
 *       200:
 *         description: Nearby businesses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Nearby businesses fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     businesses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BusinessResult'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 15
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                     filters:
 *                       type: object
 *                       properties:
 *                         location:
 *                           type: object
 *                           properties:
 *                             latitude:
 *                               type: number
 *                             longitude:
 *                               type: number
 *                             radius:
 *                               type: integer
 *                         rating:
 *                           type: number
 *                         categoryIds:
 *                           type: array
 *                           items:
 *                             type: string
 *             examples:
 *               successful_nearby:
 *                 summary: Successful nearby search
 *                 value:
 *                   status: success
 *                   message: "Nearby businesses fetched successfully"
 *                   data:
 *                     businesses:
 *                       - id: "business-uuid-1"
 *                         username: "nearby_cafe"
 *                         name: "Corner Coffee Shop"
 *                         logo_url: "https://example.com/logo.jpg"
 *                         rating: 4.5
 *                         ratingCount: 89
 *                         distance: 250
 *                         categories:
 *                           - category:
 *                               id: "cat-cafe-uuid"
 *                               name: "Cafes"
 *                         locations:
 *                           - address: "123 Main St, New York, NY"
 *                             latitude: 40.7128
 *                             longitude: -74.0060
 *                       - id: "business-uuid-2"
 *                         username: "pizza_place"
 *                         name: "Mario's Pizza"
 *                         logo_url: "https://example.com/pizza.jpg"
 *                         rating: 4.2
 *                         ratingCount: 156
 *                         distance: 450
 *                         categories:
 *                           - category:
 *                               id: "cat-restaurant-uuid"
 *                               name: "Restaurants"
 *                         locations:
 *                           - address: "456 Broadway, New York, NY"
 *                             latitude: 40.7505
 *                             longitude: -73.9934
 *                     pagination:
 *                       page: 1
 *                       limit: 20
 *                       total: 15
 *                       totalPages: 1
 *                     filters:
 *                       location:
 *                         latitude: 40.7128
 *                         longitude: -74.0060
 *                         radius: 2000
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_coordinates:
 *                 summary: Missing latitude or longitude
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Latitude and longitude are required"
 *                   details: null
 *               invalid_coordinates:
 *                 summary: Invalid coordinates
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Invalid latitude or longitude"
 *                   details: null
 *               invalid_radius:
 *                 summary: Invalid radius
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Radius must be between 100 and 50000 meters"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
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
router.post('/nearby', dataFetchLimiter, requireAuth(), BusinessController.getNearbyBusinesses);

export default router;
