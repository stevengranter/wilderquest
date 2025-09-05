# Wildernest

A web application for creating and managing wildlife observation quests using iNaturalist data.

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm
- MySQL database
- Redis

### Installation
```bash
pnpm install
```

### Environment Setup
Copy the example environment file and configure your database and API keys:
```bash
cp .env.example .env
```

### Database Setup
```bash
# Run database migrations
dbmate up

# Seed initial data (optional)
# For mock data (limited to available mock taxa):
pnpm run seed:mock

# For real iNaturalist data (may hit rate limits):
pnpm run seed
```

### Development Mode

#### Normal Development (with real iNaturalist API)
```bash
pnpm dev
```

#### Mock Mode (avoids iNaturalist rate limits)
If you're getting 429 errors from the iNaturalist API during development, you can enable mock mode:

```bash
# Enable mock mode
pnpm run mock-inat

# Or manually add to .env:
echo "USE_MOCK_INAT=true" >> .env
```

When using mock mode, you can also seed your database with mock data:

```bash
# Seed with mock iNaturalist data
pnpm run seed:mock
```

Then restart your development server:
```bash
pnpm dev
```

Mock mode provides:
- Sample taxon data for species
- Mock observations
- Search autocomplete with mock results
- No API rate limits

To disable mock mode, remove `USE_MOCK_INAT=true` from your `.env` file and restart the server.

### Production Build
```bash
pnpm build
pnpm start
```

## Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm lint` - Lint code
- `pnpm mock-inat` - Enable mock mode for iNaturalist API

## Architecture

- **Frontend**: React with TypeScript, Vite
- **Backend**: Node.js with Express
- **Database**: MySQL with migrations via dbmate
- **Cache**: Redis
- **Styling**: Tailwind CSS
- **State Management**: React Query, Context API