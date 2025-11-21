# Swagger API Documentation Setup

## ✅ What Was Configured

Swagger/OpenAPI documentation has been successfully integrated into the PixelForge API.

## 📚 Access the Documentation

### Production

- **URL**: [https://pixelforge-smp3.onrender.com/docs](https://pixelforge-smp3.onrender.com/docs)

### Local Development

- **URL**: [http://localhost:3000/docs](http://localhost:3000/docs)

## 🎯 Features

The Swagger UI provides:

- **Interactive API Testing**: Try out endpoints directly in the browser
- **Complete Documentation**: All endpoints, parameters, and response schemas
- **Request/Response Examples**: Sample payloads for each operation
- **Authentication**: No authentication required (public API)
- **Rate Limiting Info**: Documentation includes rate limit details

## 📋 Available Endpoints

### Jobs Management

- `POST /api/jobs` - Create a new image processing job
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/{id}` - Get job status
- `PUT /api/jobs/{id}/retry` - Retry a failed job
- `DELETE /api/jobs/{id}` - Delete a job

### Health Check

- `GET /health` - Service health check

## 🚀 Deployment

### To Deploy Changes

1. **Build locally to verify**:

   ```bash
   cd apps/api
   pnpm build
   ```

2. **Commit and push changes**:

   ```bash
   git add .
   git commit -m "Add Swagger API documentation"
   git push origin main
   ```

3. **Render will automatically deploy** (if you have auto-deploy enabled)

   - Or manually deploy from the Render dashboard

4. **Verify deployment**:
   - Visit: https://pixelforge-smp3.onrender.com/docs
   - Check: https://pixelforge-smp3.onrender.com/health

## 📦 Installed Packages

- `swagger-jsdoc` - Generates OpenAPI spec from JSDoc comments
- `swagger-ui-express` - Serves Swagger UI
- `@types/swagger-jsdoc` - TypeScript types
- `@types/swagger-ui-express` - TypeScript types

## 🔧 Configuration Files

### Created

- `apps/api/src/lib/swagger-config.ts` - Swagger configuration and schemas

### Modified

- `apps/api/src/app.ts` - Added Swagger middleware and health endpoint docs
- `apps/api/src/routes/job-routes.ts` - Added OpenAPI annotations to all routes
- `apps/api/src/middlewares/rate-limiter.ts` - Excluded /docs from rate limiting
- `README.md` - Added documentation links

## 🎨 Customization

The Swagger UI has been customized with:

- Hidden top bar (cleaner look)
- Custom page title: "PixelForge API Documentation"
- Production and development server URLs pre-configured

## 🛠️ Local Development

To start the API with Swagger documentation:

```bash
# From project root
pnpm api:dev

# Or from apps/api
pnpm dev
```

Then visit: http://localhost:3000/docs

## 📝 Adding New Endpoints

To document new endpoints, add JSDoc comments with OpenAPI annotations:

```typescript
/**
 * @openapi
 * /api/your-endpoint:
 *   post:
 *     tags:
 *       - YourTag
 *     summary: Brief description
 *     description: Detailed description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourSchema'
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/your-endpoint", yourController);
```

## ✨ Benefits

- **Developer Experience**: Easy API exploration and testing
- **Documentation**: Always up-to-date with code
- **Testing**: No need for Postman/cURL during development
- **Professional**: Industry-standard API documentation
- **SEO**: Crawlable API documentation

## 🔒 Security Notes

- `/docs` endpoint is excluded from rate limiting
- No authentication required (public API)
- Swagger UI is read-only (cannot modify server state directly)
- CORS policies still apply to API requests

## 📞 Support

If you encounter any issues:

1. Check build logs: `pnpm build`
2. Verify all dependencies installed: `pnpm install`
3. Restart the development server
4. Check browser console for errors

---

**Status**: ✅ Ready for deployment
**Last Updated**: 2024-11-21
