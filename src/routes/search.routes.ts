import express from 'express';

import SearchController from '../controllers/search.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { dataFetchLimiter } from '../middlewares/rateLimit.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Search
 *     description: Comprehensive business search with local database and Google Maps integration, Redis caching, and search history management
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
 *     SearchFilters:
 *       type: object
 *       properties:
 *         categoryIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of category IDs to filter by
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Minimum rating filter
 *         radius:
 *           type: integer
 *           minimum: 1
 *           maximum: 50000
 *           description: Search radius in meters (for location-based search)
 *     SearchOptions:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Page number for pagination
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           description: Number of results per page
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           description: User's latitude for location-based search
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           description: User's longitude for location-based search
 *     BusinessResult:
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
 *         rating:
 *           type: number
 *           nullable: true
 *           description: Average rating (calculated from rating_sum/review_count)
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
 */

/**
 * @swagger
 * /api/search/businesses:
 *   post:
 *     summary: Search for businesses
 *     description: |
 *       **🔍 Comprehensive Business Search Engine**
 *       Advanced business search that intelligently combines local database results with Google Maps API data.
 *       Features automatic deduplication, Redis caching, and comprehensive search history tracking.
 *       **🚀 Key Features:**
 *       - **Hybrid Search**: Combines local database + Google Maps results
 *       - **Smart Deduplication**: Removes duplicate businesses using name similarity and location proximity
 *       - **Advanced Filtering**: Categories, ratings, location radius, text search
 *       - **Redis Caching**: Fast recent searches with automatic expiration
 *       - **Search History**: Automatic logging for analytics and user experience
 *       - **Location Intelligence**: Haversine distance calculations for precise results
 *       - **Pagination**: Efficient handling of large result sets
 *       **🎯 Search Strategy:**
 *       1. Searches local business database (name, username, description)
 *       2. Queries Google Maps API for external businesses
 *       3. Combines and deduplicates results intelligently
 *       4. Applies filters and sorting
 *       5. Saves search to history and Redis cache
 *       **💡 Use Cases:**
 *       - Main business search functionality
 *       - Location-based discovery
 *       - Category-specific searches
 *       - Competitor analysis
 *       - Market research
 *     tags: [Search]
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
 *                 maxLength: 255
 *                 description: Search query (business name, keywords, description)
 *                 example: "italian pizza restaurant"
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Filter by specific category IDs
 *                 example: ["cat-restaurant-uuid", "cat-italian-uuid"]
 *                 maxItems: 10
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Minimum rating threshold (businesses with this rating or higher)
 *                 example: 4.0
 *               radius:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 50000
 *                 description: Search radius in meters (for location-based search)
 *                 example: 5000
 *                 default: 5000
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
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
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: User's latitude for location-based search and distance calculation
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: User's longitude for location-based search and distance calculation
 *                 example: -74.0060
 *           examples:
 *             basic_text_search:
 *               summary: Simple text search
 *               description: Basic search without location or filters
 *               value:
 *                 query: "pizza restaurant"
 *                 page: 1
 *                 limit: 20
 *             location_based_search:
 *               summary: Location-based search with filters
 *               description: Search near specific coordinates with rating filter
 *               value:
 *                 query: "coffee shop"
 *                 latitude: 40.7128
 *                 longitude: -74.0060
 *                 radius: 2000
 *                 rating: 4.0
 *                 limit: 15
 *             category_filtered_search:
 *               summary: Search with category and rating filters
 *               description: Advanced search with multiple filters
 *               value:
 *                 query: "authentic food"
 *                 categoryIds: ["cat-restaurant-uuid", "cat-italian-uuid"]
 *                 rating: 3.5
 *                 page: 1
 *                 limit: 10
 *             comprehensive_search:
 *               summary: Full-featured search
 *               description: Search with all available filters and location
 *               value:
 *                 query: "best sushi"
 *                 categoryIds: ["cat-restaurant-uuid", "cat-japanese-uuid"]
 *                 latitude: 40.7589
 *                 longitude: -73.9851
 *                 radius: 3000
 *                 rating: 4.5
 *                 page: 1
 *                 limit: 25
 *     responses:
 *       200:
 *         description: Search completed successfully
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
 *                   example: Search completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     businesses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BusinessResult'
 *                       description: Combined and deduplicated business results from local and Google sources
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
 *                           example: 87
 *                           description: Total number of results found
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                           description: Total number of pages available
 *                     sources:
 *                       type: object
 *                       properties:
 *                         local:
 *                           type: integer
 *                           example: 15
 *                           description: Number of results from local database
 *                         google:
 *                           type: integer
 *                           example: 8
 *                           description: Number of results from Google Maps API
 *                         deduplicated:
 *                           type: integer
 *                           example: 3
 *                           description: Number of duplicate entries removed
 *                     query:
 *                       type: string
 *                       example: "italian pizza restaurant"
 *                       description: The original search query
 *                     filters:
 *                       $ref: '#/components/schemas/SearchFilters'
 *                     searchId:
 *                       type: string
 *                       format: uuid
 *                       example: "search-uuid-123"
 *                       description: Unique identifier for this search (for analytics)
 *             examples:
 *               successful_search:
 *                 summary: Successful search with mixed results
 *                 value:
 *                   status: success
 *                   message: "Search completed successfully"
 *                   data:
 *                     businesses:
 *                       - id: "business-local-1"
 *                         username: "tonys_pizza"
 *                         name: "Tony's Authentic Pizza"
 *                         logo_url: "https://example.com/logo1.jpg"
 *                         rating: 4.7
 *                         ratingCount: 156
 *                         distance: 850
 *                         source: "local"
 *                         categories:
 *                           - category:
 *                               id: "cat-restaurant-uuid"
 *                               name: "Restaurants"
 *                         locations:
 *                           - address: "123 Main St, New York, NY"
 *                             latitude: 40.7128
 *                             longitude: -74.0060
 *                       - id: "google_ChIJN1t_tDeuEmsRUsoyG83frY4"
 *                         name: "Mario's Pizza Place"
 *                         rating: 4.3
 *                         ratingCount: 89
 *                         distance: 1200
 *                         source: "google"
 *                         place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *                         locations:
 *                           - address: "456 Broadway, New York, NY"
 *                             latitude: 40.7505
 *                             longitude: -73.9934
 *                     pagination:
 *                       page: 1
 *                       limit: 20
 *                       total: 23
 *                       totalPages: 2
 *                     sources:
 *                       local: 15
 *                       google: 8
 *                       deduplicated: 0
 *                     query: "pizza restaurant"
 *                     searchId: "search-uuid-123"
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
 *                 summary: Invalid latitude/longitude
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Invalid latitude or longitude coordinates"
 *                   details:
 *                     latitude: "Must be between -90 and 90"
 *                     longitude: "Must be between -180 and 180"
 *               invalid_pagination:
 *                 summary: Invalid pagination parameters
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Invalid pagination parameters"
 *                   details:
 *                     page: "Must be a positive integer"
 *                     limit: "Must be between 1 and 100"
 *               invalid_rating:
 *                 summary: Invalid rating filter
 *                 value:
 *                   status: fail
 *                   statusCode: 400
 *                   message: "Rating must be between 1 and 5"
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
 *               token_expired:
 *                 summary: Expired access token
 *                 value:
 *                   status: fail
 *                   statusCode: 401
 *                   message: "Access token has expired"
 *                   details: null
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               rate_limited:
 *                 summary: Rate limit exceeded
 *                 value:
 *                   status: fail
 *                   statusCode: 429
 *                   message: "Too many search requests. Please try again later."
 *                   details:
 *                     retryAfter: 60
 *                     limit: 100
 *                     remaining: 0
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               database_error:
 *                 summary: Database connection error
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "Database connection failed"
 *                   details: null
 *               google_api_error:
 *                 summary: Google Maps API error
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "External search service temporarily unavailable"
 *                   details: null
 *               search_timeout:
 *                 summary: Search timeout
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "Search request timed out"
 *                   details: null
 */
router.post('/businesses', dataFetchLimiter, requireAuth(), SearchController.searchBusinesses);

/**
 * @swagger
 * /api/search/recent:
 *   get:
 *     summary: Get recent searches
 *     description: |
 *       **📚 Recent Search History**
 *       Retrieves the user's most recent search queries from Redis cache.
 *       Perfect for implementing search suggestions and improving user experience.
 *       **🚀 Features:**
 *       - **Redis ZSET Storage**: Fast retrieval with automatic scoring by timestamp
 *       - **Smart Deduplication**: Prevents duplicate search terms
 *       - **Automatic Expiration**: Searches auto-expire after 30 days
 *       - **Privacy Focused**: User-specific searches only
 *       **💡 Use Cases:**
 *       - Search suggestion dropdowns
 *       - Quick re-search functionality
 *       - User behavior analytics
 *       - Personalized search experience
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent searches fetched successfully
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
 *                   example: Recent searches fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     searches:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of recent search queries ordered by recency
 *                       example: ["italian restaurant", "coffee shop near me", "pizza delivery", "sushi bar", "gym membership"]
 *                       maxItems: 10
 *                     count:
 *                       type: integer
 *                       description: Number of recent searches returned
 *                       example: 5
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       description: User ID for whom searches were retrieved
 *             examples:
 *               with_searches:
 *                 summary: User with recent searches
 *                 value:
 *                   status: success
 *                   message: "Recent searches fetched successfully"
 *                   data:
 *                     searches: ["italian restaurant", "coffee shop near me", "pizza delivery", "sushi bar", "gym membership"]
 *                     count: 5
 *                     userId: "user-uuid-123"
 *               empty_searches:
 *                 summary: User with no recent searches
 *                 value:
 *                   status: success
 *                   message: "Recent searches fetched successfully"
 *                   data:
 *                     searches: []
 *                     count: 0
 *                     userId: "user-uuid-456"
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: Access token is required
 *       500:
 *         description: Internal server error (Redis unavailable)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve recent searches
 *             examples:
 *               redis_error:
 *                 summary: Redis connection error
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "Redis cache temporarily unavailable"
 */
router.get('/recent', requireAuth(), SearchController.getRecentSearches);

/**
 * @swagger
 * /api/search/history:
 *   get:
 *     summary: Get search history
 *     description: |
 *       Get the user's complete search history from the database with pagination.
 *       Includes search timestamps and status for analytics purposes.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Search history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     searches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           searchText:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 */
router.get('/history', requireAuth(), SearchController.getSearchHistory);

/**
 * @swagger
 * /api/search/recent:
 *   delete:
 *     summary: Clear recent searches
 *     description: |
 *       **🗑️ Clear Search History**
 *       Permanently removes all recent search queries for the authenticated user from Redis cache.
 *       This action is immediate and cannot be undone.
 *       **🔒 Privacy Features:**
 *       - **User-Specific**: Only clears searches for the authenticated user
 *       - **Immediate Effect**: Changes are reflected instantly
 *       - **Permanent Deletion**: Cannot be undone
 *       - **Secure Operation**: Requires valid authentication
 *       **💡 Use Cases:**
 *       - Privacy management
 *       - Clean slate for testing
 *       - User preference settings
 *       - GDPR compliance features
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent searches cleared successfully
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
 *                   example: Recent searches cleared successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the user whose searches were cleared
 *                       example: "user-uuid-123"
 *                     clearedCount:
 *                       type: integer
 *                       description: Number of search entries that were removed
 *                       example: 8
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: When the clearing operation was performed
 *                       example: "2024-01-15T14:30:00Z"
 *             examples:
 *               searches_cleared:
 *                 summary: Successfully cleared searches
 *                 value:
 *                   status: success
 *                   message: "Recent searches cleared successfully"
 *                   data:
 *                     userId: "user-uuid-123"
 *                     clearedCount: 8
 *                     timestamp: "2024-01-15T14:30:00Z"
 *               no_searches_to_clear:
 *                 summary: No searches to clear
 *                 value:
 *                   status: success
 *                   message: "Recent searches cleared successfully"
 *                   data:
 *                     userId: "user-uuid-456"
 *                     clearedCount: 0
 *                     timestamp: "2024-01-15T14:30:00Z"
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: Access token is required
 *       500:
 *         description: Internal server error (Redis unavailable)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Failed to clear recent searches
 *             examples:
 *               redis_error:
 *                 summary: Redis connection error
 *                 value:
 *                   status: error
 *                   statusCode: 500
 *                   message: "Redis cache temporarily unavailable"
 */
router.delete('/recent', requireAuth(), SearchController.clearRecentSearches);

export default router;
