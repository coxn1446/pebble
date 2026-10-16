# App Shell Generation Prompt

Use this prompt when creating a new app shell based on the following architecture. This prompt captures the complete structure, tech stack, and patterns used in this codebase.

Day-to-day agent work uses `AGENTS.md`, `.cursor/rules/`, and `.cursor/skills/` — not this file. Pin package versions to this repo’s `package.json`. Do not write “latest.”

## Context

I need you to create a new app shell (no functionality, just structure) based on the architecture below. The new app should have the same internal structure, tech stack, and organizational patterns, but be ready for new features to be built on top of it.

## Tech Stack

### Frontend
- **Framework**: React (latest) with React Router DOM (latest)
- **State Management**: Redux Toolkit (latest) with React Redux (latest)
- **Styling**: Tailwind CSS (latest)
- **UI Components**: Ionic React (latest)
- **Build Tool**: Vite (latest)
- **Notifications**: React Hot Toast (latest)
- **Native**: Capacitor (latest, iOS/Android support)

### Backend
- **Runtime**: Node.js (latest LTS)
- **Framework**: Express (latest)
- **Database**: PostgreSQL with `pg` (latest)
- **Authentication**: Passport.js (latest) with:
  - Local Strategy (`passport-local`)
  - Google OAuth (`passport-google-oauth20`)
  - Apple Sign In (`passport-apple`)
- **Session Management**: `express-session` with `connect-pg-simple` (latest)
- **File Upload**: Multer (latest)
- **Security**: 
  - express-rate-limit (latest)
  - bcrypt (latest)
  - cors (latest)
- **Cloud Services**:
  - Google Cloud Secret Manager (`@google-cloud/secret-manager`)
  - Google Cloud Storage (`@google-cloud/storage`)
  - Firebase Admin SDK (latest)
  - Stripe (latest)

### Development Tools
- **Testing**: 
  - @testing-library/react (latest)
  - @testing-library/jest-dom (latest)
  - @testing-library/user-event (latest)
- **Linting**: ESLint (react-app or recommended config)
- **Dev Server**: nodemon (latest)

## Project Structure

### Root Level
```
/
├── serverIndex.js          # Main server entry point
├── package.json            # Dependencies and scripts
├── vite.config.mjs         # Vite build/dev configuration
├── index.html              # Vite HTML entry point (with CSP and meta tags)
├── capacitor.config.ts     # Capacitor configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── app.yaml                # App Engine config (if applicable)
├── README.md               # Project documentation
├── APP_SHELL_PROMPT.md     # This file
├── DATABASE_SCHEMA.md      # Database documentation (MUST be maintained)
└── ARCHITECTURE.md         # Architecture documentation (MUST be maintained)
```

### Server Structure (`/server`)
```
server/
├── config/
│   └── firebase.js         # Firebase configuration
├── db/
│   └── index.js            # Database connection pool and initialization
├── loaders/
│   ├── index.js            # Main loader orchestrator
│   ├── express.js          # Express middleware setup
│   └── passport.js         # Passport authentication strategies
├── routes/
│   ├── index.js            # Route aggregator
│   └── [feature].js        # Individual route files (auth, users, etc.)
├── services/
│   └── [feature]Service.js # Business logic layer
├── queries/
│   ├── index.js            # Query aggregator
│   └── [feature]Queries.js # SQL query definitions
```

> Real-time messaging (Socket.io) is optional and is **not** part of the default shell. Add a `server/socket/` directory with `index.js` only if a feature actually requires it.

### Client Structure (`/src`)
```
src/
├── index.js                # React app entry point with Redux store
├── App.js                  # Main App component (in components/)
├── index.css               # Global styles
├── setupTests.js           # Test configuration
├── components/
│   ├── App.js              # Main app router and layout
│   ├── Auth/               # Authentication components
│   ├── Nav/                # Navigation components
│   ├── Loading/            # Loading states
│   └── [Feature]/          # Feature-specific components
├── routes/
│   └── [Route].js          # Route components (lazy loaded)
├── store/
│   ├── rootReducer.js      # Redux root reducer
│   └── [feature].reducer.js # Feature-specific reducers
├── helpers/
│   └── [feature]Helpers.js # Helper functions, to be called by the feature's UI component
├── hooks/
│   └── use[Feature].js     # Custom React hooks
├── utils/
│   ├── NativeContext.js    # Capacitor native features context
│   └── [utility].js         # Utility functions, used around the app in various contexts
├── modals/
│   └── [Modal].js           # Modal components
└── tests/
    └── [test].test.js       # Test files
```

### Public Assets (`/public`)
```
public/
├── manifest.json            # PWA manifest
└── [assets]/               # Static assets (icons, images)
```

> The HTML template lives at the project root as `index.html` (the Vite entry point), not under `public/`.

## Architecture Patterns

### 1. Server Architecture

#### Loader Pattern
The server uses a loader pattern to initialize middleware and services:
- `server/loaders/index.js` orchestrates all loaders
- `server/loaders/express.js` sets up Express middleware (CORS, body parsing, sessions, rate limiting)
- `server/loaders/passport.js` configures authentication strategies
- Routes are loaded after all middleware is configured

#### Service Layer Pattern
- **UI Components** (`src/components/`) React JSX components which strictly render just the UI, no business logic
- **Helpers** (`src/helpers/`) functions which can be imported into and called by UI components
- **Routes** (`server/routes/`) handle HTTP requests/responses and validation
- **Services** (`server/services/`) contain business logic
- **Queries** (`server/queries/`) contain raw SQL queries
- Components call helpers, helpers call routes, routes call services, services call queries

#### Database Connection
- Connection pool managed in `server/db/index.js`
- Supports both production (Cloud SQL) and development (local PostgreSQL)
- Health check mechanism with retries
- Graceful shutdown handling

#### Authentication Flow
- Passport.js with session-based authentication
- Serialization/deserialization of user objects
- Local login, Google, and Apple can all belong to the same user via `password`, `google_id`, and `apple_id`
- Session stored in PostgreSQL using connect-pg-simple

#### Real-time Communication (optional)
Socket.io is **not** part of the default shell. If a feature requires real-time messaging:
- Add `server/socket/index.js` with the Socket.io initialization and handlers
- Wire it up from `serverIndex.js` after the HTTP server is created
- Use room-based messaging (e.g., conversations) and connection tracking/cleanup

### 2. Client Architecture

#### Routing
- React Router DOM with lazy loading
- Public and private route separation
- Native platform detection (shows download prompt on web)
- Route-based code splitting

#### State Management
- Redux Toolkit for global state
- Feature-based reducers
- Redux middleware configured for serialization checks
- Selectors for accessing state

#### Native Integration
- Capacitor for iOS/Android
- NativeContext provider for platform detection
- Keyboard handling and device info
- Push notifications support

#### Component Organization
- Feature-based folder structure
- Lazy loading for route components
- Suspense boundaries for loading states
- Context providers for cross-cutting concerns

### 3. Database Patterns

#### Query Organization
- Queries separated by feature domain
- Reusable query fragments (e.g., USER_FIELDS)
- Parameterized queries for security
- Complex queries with CTEs for performance

#### Database Documentation (CRITICAL)
**Every database change MUST be documented in `/DATABASE_SCHEMA.md`**:
- Table schemas with columns, types, constraints
- Indexes and their purposes
- Foreign key relationships
- Triggers and their functions
- Database functions and stored procedures
- Views (if any)
- Migration history

Example structure for DATABASE_SCHEMA.md:
```markdown
# Database Schema Documentation

## Tables

### users
- **Purpose**: Stores user account information
- **Columns**:
  - user_id (SERIAL PRIMARY KEY)
  - username (VARCHAR UNIQUE NOT NULL)
  - email (VARCHAR UNIQUE)
  - password (VARCHAR) - bcrypt hash; null when local login is off
  - google_id (VARCHAR) - Google subject; null until linked
  - apple_id (VARCHAR) - Apple subject; null until linked
  - ...
- **Indexes**: username_idx, email_idx
- **Foreign Keys**: None
- **Triggers**: update_updated_at_trigger
- **Last Modified**: YYYY-MM-DD

## Functions

### get_re_sphere_count(post_id)
- **Purpose**: Calculates re-sphere count for a post
- **Returns**: INTEGER
- **Last Modified**: YYYY-MM-DD

## Migrations

### 2024-01-15_add_users_table
- Added users table with initial schema
```

## Key Configuration Files

### `serverIndex.js`
- Initializes secrets from Google Cloud Secret Manager
- Sets up database connection
- Loads Express app with all middleware
- Handles graceful shutdown
- Retry mechanism for startup failures
- (Optionally initializes Socket.io if real-time features are added later)

### `capacitor.config.ts`
- Environment-based configuration (dev/prod)
- App ID and name configuration
- Server URL configuration
- Plugin configurations (Keyboard, Camera, Push Notifications)
- iOS/Android specific settings

### `tailwind.config.js`
- Custom color palette
- Custom animations
- Content paths for purging

### `vite.config.mjs`
- React plugin (`@vitejs/plugin-react`)
- Tailwind CSS plugin (`@tailwindcss/vite`)
- `@` alias to `src/`
- Dev server proxy from `/api` to the Express server (default port 8080)
- Build output to `build/`

### `index.html` (project root)
- Content Security Policy (CSP)
- Meta tags for PWA
- Initial loader with timeout
- Viewport configuration
- `<script type="module" src="/src/index.js"></script>` Vite entry tag

## Development Workflow Requirements

### 1. Database Changes
When making ANY database change:
1. Update the database schema
2. **IMMEDIATELY update `/DATABASE_SCHEMA.md`** with:
   - New tables/columns
   - Modified constraints
   - New indexes
   - New triggers/functions
   - Migration notes
3. Prefer numbered SQL migrations in `server/db/migrations/` (`NNN_description.sql`) plus keeping `server/db/schema.sql` current; apply with `npm run db:migrate`

### 2. Testing
When adding new features:
1. **Update test suite in `/src/tests/`**
2. Add tests for:
   - New components
   - New services
   - New routes (integration tests)
   - New utilities
3. Update `setupTests.js` if new test utilities are needed

### 3. Documentation
**Maintain `/ARCHITECTURE.md`** with:
- Feature descriptions
- API endpoint documentation
- Component hierarchy
- State management patterns
- Integration points
- Deployment procedures

## Environment Variables

### Required Secrets (from Google Cloud Secret Manager)

#### Production Secrets
- `SESSION_SECRET`
- `DB_PASSWORD`, `DB_USER`, `DB_DATABASE`
- `DB_INSTANCE_UNIX_SOCKET` (production)
- `DEFAULT_CLIENT_URL`
- `INSTANCE_CONNECTION_NAME` (production)
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_KEY`
- `EMAIL_ADDRESS`, `EMAIL_PASSWORD`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`

#### QA Environment Secrets
- `QA_SESSION_SECRET` (separate from production)
- `QA_DB_PASSWORD`, `QA_DB_USER`, `QA_DB_DATABASE`
- `QA_DB_INSTANCE_UNIX_SOCKET` (QA Cloud SQL instance)
- `QA_CLIENT_URL` (QA frontend URL)
- `QA_INSTANCE_CONNECTION_NAME` (QA Cloud SQL connection name)
- `QA_GOOGLE_PLACES_API_KEY` (can use same or test key)
- `QA_GOOGLE_CLIENT_ID`, `QA_GOOGLE_CLIENT_SECRET` (QA OAuth credentials)
- `QA_APPLE_CLIENT_ID`, `QA_APPLE_TEAM_ID`, `QA_APPLE_KEY_ID`, `QA_APPLE_KEY` (QA Apple credentials)
- `QA_EMAIL_ADDRESS`, `QA_EMAIL_PASSWORD` (test email account)
- `QA_FIREBASE_SERVICE_ACCOUNT_JSON` (QA Firebase project)
- `QA_STRIPE_SECRET_KEY`, `QA_STRIPE_PUBLISHABLE_KEY` (Stripe test mode keys)
- `QA_GOOGLE_CLOUD_STORAGE_BUCKET` (QA storage bucket name)

### Development Environment Variables
- `NODE_ENV=development`
- `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_HOST`, `DB_PORT` (server-side)
- `SESSION_SECRET` (server-side)
- Any client-exposed values must be prefixed with `VITE_` (e.g., `VITE_GOOGLE_PLACES_API_KEY`) for Vite to expose them to the browser via `import.meta.env`

### QA Environment Variables
- `NODE_ENV=qa` or `NODE_ENV=staging`
- QA-specific secrets loaded from Google Cloud Secret Manager (prefixed with `QA_`)
- QA-specific database connection settings
- QA-specific storage bucket configuration

## NPM Scripts

- `npm start` - Start production server (`node serverIndex.js`)
- `npm run dev` - Run Vite dev server and the Express server concurrently
- `npm run start:dev` - Start the Vite dev server only (`vite`)
- `npm run server:dev` - Start the Express server with nodemon
- `npm run build` - Build the client for production (`vite build`)
- `npm run preview` - Preview the production build locally (`vite preview`)
- `npm test` - Run tests (Jest)
- `npm run s` - Sync Capacitor iOS project (`npx cap sync ios`)
- `npm run deploy:qa` - Deploy to QA environment (if configured)
- `npm run deploy:prod` - Deploy to production environment (if configured)

## Security Considerations

- Rate limiting on all routes
- CORS configured for production domains
- Session cookies with httpOnly, secure (production), sameSite
- SQL injection prevention via parameterized queries
- Content Security Policy in HTML
- Secrets managed via Google Cloud Secret Manager
- HTTPS enforced in production

## Performance Optimizations

- Connection pooling for database
- Compression middleware
- Lazy loading for React components
- Code splitting by routes
- Image optimization (sharp library)
- Query optimization with CTEs and indexes

## Native App Features

- iOS and Android support via Capacitor
- Push notifications
- Camera access
- Keyboard handling
- Status bar configuration
- Deep linking support
- App URL schemes

## Creating the Shell

When generating the new app shell:

1. **Create all directory structures** as outlined above
2. **Set up package.json** with all dependencies
3. **Create configuration files** (capacitor.config.ts, tailwind.config.js, etc.)
4. **Set up server structure** with:
   - Empty route files
   - Empty service files
   - Empty query files
   - Loader files with basic setup
   - Database connection setup
5. **Set up client structure** with:
   - Redux store configuration
   - Basic routing setup
   - Native context provider
   - Loading components
6. **Create placeholder files** for:
   - DATABASE_SCHEMA.md (with template)
   - ARCHITECTURE.md (with template)
   - README.md (with project-specific info)
7. **Set up testing infrastructure** with setupTests.js
8. **Include all middleware** but with minimal/no functionality
9. **Set up authentication structure** (routes, services, queries) but empty implementations
10. **Create basic HTML template** with CSP and meta tags

## Important Notes

- The shell should have NO business logic, only structure
- All files should be present but mostly empty/placeholder
- Configuration should be set up but pointing to placeholder values
- Database connection should be configured but not require actual DB
- Routes should exist but return placeholder responses
- Components should render but show placeholder content
- The app should be runnable (even if it just shows "App Shell" or similar)

## QA Environment Setup

After creating the initial app shell, set up a QA/staging environment:

1. **Create QA App Engine Service**: Set up separate App Engine service for QA
2. **QA Database**: Create separate Cloud SQL instance for QA testing
3. **QA Storage**: Create separate Cloud Storage bucket for QA assets
4. **QA Secrets**: Set up QA-specific secrets in Google Cloud Secret Manager
5. **QA Configuration**: Create `app-qa.yaml` for QA-specific App Engine configuration
6. **Deployment Scripts**: Add QA deployment scripts to package.json

See `ARCHITECTURE.md` Deployment section for detailed QA environment setup instructions.

## Example Shell Output

The generated shell should:
- Start without errors (with placeholder DB config)
- Show a basic layout with navigation structure
- Have all routes defined (but showing placeholder content)
- Have Redux store configured (but minimal state)
- Have authentication structure ready (but no actual auth)
- Have all services/routes/queries files present (but empty)
- Include DATABASE_SCHEMA.md template ready to fill
- Include ARCHITECTURE.md template ready to fill

---

**Use this prompt to generate a complete app shell that matches the AuraSphere architecture and is ready for feature development.**
