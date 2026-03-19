# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mini PC product catalog system with three main components:
- **API**: Backend service (Hono + SQLite + Drizzle ORM)
- **Web**: Customer-facing website (Next.js 15)
- **Admin**: Management dashboard (Next.js 15 + Mantine UI)

## Development Commands

### API (Port 3001)
```bash
cd api
pnpm run dev          # Start development server with hot reload
pnpm run start        # Start production server
pnpm run db:generate  # Generate Drizzle migrations
pnpm run db:migrate   # Run database migrations
pnpm run backup       # Backup database to data/backups/
```

### Web (Port 3000)
```bash
cd web
pnpm run dev    # Start development server
pnpm run build  # Build for production
pnpm run start  # Start production server
pnpm run lint   # Run ESLint
```

### Admin (Port 3002)
```bash
cd admin
pnpm run dev    # Start development server on port 3002
pnpm run build  # Build for production
pnpm run start  # Start production server on port 3002
```

### Full Stack Development
Start all three services in separate terminals:
```bash
# Terminal 1
cd api && pnpm run dev

# Terminal 2
cd web && pnpm run dev

# Terminal 3
cd admin && pnpm run dev
```

Or use the convenience script:
```bash
./start.sh  # Starts all services using PM2
```

## Architecture

### API Structure (`api/src/`)
- `index.ts` - Main Hono app entry point
- `db/schema.ts` - Drizzle ORM schema definitions (products, leads, events, etc.)
- `db/index.ts` - Database connection setup
- `routes/` - API route handlers:
  - `products.ts` - Product CRUD operations
  - `leads.ts` - Lead management
  - `events.ts` - User behavior tracking
  - `stats.ts` - Analytics and statistics
  - `upload.ts` - Image upload handling
- `lib/logger.ts` - Logging utilities

**Database**: SQLite file at `api/data/catalog.db`

### Web Structure (`web/src/`)
- `app/` - Next.js App Router pages
  - `page.tsx` - Homepage with product listing
  - `products/[id]/page.tsx` - Product detail pages
- `components/` - React components
- `lib/` - Utility functions and API client
- `types/` - TypeScript type definitions

**Styling**: Tailwind CSS v4

### Admin Structure (`admin/src/`)
- `app/` - Next.js App Router with route groups
  - `login/` - Authentication page
  - `(admin)/` - Protected admin routes (products, leads, analytics)
- `components/` - Mantine UI components
- `lib/` - Utility functions and API client

**UI Framework**: Mantine v8 with charts (Recharts)

## Key Technical Details

### Database Schema
The system tracks:
- **products** - Product catalog with specs (JSON), pricing, images
- **leads** - Customer inquiries with contact info and requirements
- **events** - User behavior tracking (views, clicks, etc.)

### API Communication
- Base URL: `http://localhost:3001` (development)
- All frontends communicate with API via fetch
- API client typically in `lib/api.ts` or similar

### Environment Variables
Each project requires `.env` configuration:
- **API**: Database path, port, CORS settings
- **Web**: API URL (`NEXT_PUBLIC_API_URL`)
- **Admin**: API URL, admin password

Copy from `.env.example` files in each directory.

## DIY Configuration Feature

A planned AI-powered feature for custom PC configuration (see `DIY_FEATURE_DESIGN.md`):
- AI selects components from manufacturer database
- Validates compatibility rules
- Generates 2-3 configuration options
- Backend validation prevents AI from inventing components or prices

**Implementation approach**: Constrained AI generation with multi-layer validation.

## Common Development Tasks

### Adding a New Product Field
1. Update `api/src/db/schema.ts` - Add column to products table
2. Run `cd api && pnpm run db:generate && pnpm run db:migrate`
3. Update TypeScript types in `web/src/types/` and `admin/src/types/`
4. Update UI components in web and admin

### Adding a New API Endpoint
1. Create route handler in `api/src/routes/`
2. Register route in `api/src/index.ts`
3. Update API client in frontends (`lib/api.ts`)

### Database Migrations
Drizzle Kit handles migrations automatically:
- Modify schema in `api/src/db/schema.ts`
- Run `pnpm run db:generate` to create migration
- Run `pnpm run db:migrate` to apply

### Image Uploads
- Upload endpoint: `POST /api/upload`
- Files stored in `api/public/images/uploads/`
- Returns URL path for database storage

## Deployment

See `DEPLOYMENT.md` and `DEPLOYMENT_CHECKLIST.md` for production deployment instructions.

The `ecosystem.config.js` file configures PM2 for process management in production.

## Important Notes

- **Database**: SQLite is used for simplicity. For production scale, consider PostgreSQL.
- **Authentication**: Admin dashboard uses simple password auth (not production-ready).
- **CORS**: API must be configured to allow requests from web and admin origins.
- **Port conflicts**: Ensure ports 3000, 3001, 3002 are available.
- **pnpm**: This project uses pnpm, not npm or yarn. Always use `pnpm install` and `pnpm run`.
