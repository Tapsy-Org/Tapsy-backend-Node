# Development Guide

## Auto-Updating Swagger Documentation

This project now supports automatic Swagger documentation updates during development.

### How it Works

1. **Automatic Regeneration**: When you run `npm run dev`, the Swagger documentation is automatically regenerated whenever you modify route files (`src/routes/*.ts`).

2. **Dynamic Loading**: In development mode, the Swagger UI fetches the latest documentation on each page refresh, so you'll always see the most up-to-date API docs.

3. **Real-time Updates**: Any changes to your route files will trigger:
   - Swagger documentation regeneration
   - Server restart via nodemon
   - Fresh documentation available at `/api-docs`

### Available Scripts

- `npm run dev` - Starts development server with auto-updating Swagger docs
- `npm run dev:simple` - Alternative development mode (fallback)
- `npm run swagger:generate` - Manually generate Swagger documentation
- `npm run swagger:watch` - Watch route files and regenerate docs only (without server restart)

### Development Workflow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to:
   - API: `http://localhost:YOUR_PORT/api`
   - Swagger Docs: `http://localhost:YOUR_PORT/api-docs`

3. Make changes to your route files in `src/routes/`

4. The server will automatically:
   - Regenerate Swagger documentation
   - Restart the server
   - Update the API documentation

### Troubleshooting

If Swagger docs aren't updating:

1. Check that your route files have proper JSDoc comments with Swagger annotations
2. Verify the `dist/swagger.json` file is being generated
3. Try manually running `npm run swagger:generate`
4. Restart the development server with `npm run dev`

### Performance Notes

- In **development**: Swagger spec is dynamically loaded on each request for real-time updates
- In **production**: Swagger spec is loaded once at startup for optimal performance

### File Structure

```
scripts/
├── dev-start.js           # Enhanced development starter script
├── generate-swagger.js    # Swagger generation script

src/
├── utils/
│   └── swagger.ts         # Dynamic Swagger loader with caching
├── routes/                # API routes with Swagger annotations
└── app.ts                 # Express app with dynamic Swagger setup
```
