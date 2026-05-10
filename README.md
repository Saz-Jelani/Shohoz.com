# Shohoz.com Clone (Angular)

A full-featured transport ticketing web app built with Angular, inspired by Shohoz workflows.
This project supports both **Bus** and **Launch** ticket search, seat selection, booking flow, user authentication, and admin schedule management.

## What This Project Includes

- User registration and login flow
- Auth-guarded private routes
- Bus and Launch ticket search
- Search results with operator and schedule details
- Passenger details and review & payment steps
- Profile and password change pages
- Admin panel for Bus and Launch schedule management
- Local mock backend via `json-server`

## Tech Stack

- Angular 15
- TypeScript
- Angular Router + Reactive/Template Forms
- RxJS
- json-server (mock REST API)

## Prerequisites

Make sure these are installed:

- Node.js 18+ (recommended LTS)
- npm 9+
- Angular CLI 15 (optional globally, project scripts work without global install)

Check versions:

```bash
node -v
npm -v
npx ng version
```

## Quick Start (New Developer Friendly)

1. Clone and enter project directory:

```bash
git clone <your-repo-url>
cd Shohoz.com
```

2. Install dependencies:

```bash
npm install
```

3. Start mock backend (json-server):

```bash
npm run db
```

4. In another terminal, start Angular app:

```bash
npm start
```

5. Open browser:

- Frontend: `http://localhost:4200`
- Mock API: `http://localhost:3000`

Important: app features (login, schedules, bookings) depend on the mock API. Keep both servers running.

## Default Test Credentials

From `db.json`:

- Admin:
  - Email: `admin@gmail.com`
  - Password: `admin`
- User:
  - Email: `sazzad05101003@student.ndub.edu.bd`
  - Password: `sazzad`

Admin permission is currently based on user ID `1` in the frontend auth service.

## Available npm Scripts

- `npm start`: Run Angular dev server on port 4200
- `npm run db`: Run json-server on port 3000 using `db.json`
- `npm run build`: Production build to `dist/`
- `npm run watch`: Development build in watch mode
- `npm test`: Run unit tests with Karma

## Route Overview

Public routes:

- `/login`
- `/register`

Private routes (auth required):

- `/` (home)
- `/bus/search`
- `/launch/search`
- `/bus/passenger-details`
- `/launch/passenger-details`
- `/bus/review-pay`
- `/launch/review-pay`
- `/launch-tickets`
- `/my-profile`
- `/change-password`
- `/admin/bus-management`
- `/admin/launch-management`

## Mock API Resources

The app consumes these `json-server` resources from `db.json`:

- `/users`
- `/operators`
- `/busSchedules`
- `/launchSchedules`
- `/bookings`

## Project Structure

```text
src/
  app/
    components/        # Reusable UI components (header, footer, selectors, etc.)
    guards/            # Route guards (AuthGuard)
    models/            # TypeScript models/interfaces
    pages/             # Route-level pages (home, login, search, admin, etc.)
    services/          # API and business logic services
    app-routing.module.ts
    app.module.ts
  assets/              # Static images/icons
  styles.css           # Global styles

db.json                # Mock backend data for json-server
angular.json           # Angular workspace config
package.json           # Scripts and dependencies
```

## Common Issues and Fixes

1. Blank page or no data in UI:
- Ensure `npm run db` is running on `http://localhost:3000`.

2. Login fails even with correct credentials:
- Verify user exists in `db.json` under `users`.
- Ensure email/password match exactly.

3. CORS/API connection error:
- Confirm frontend runs on `4200` and json-server on `3000`.
- Restart both terminals.

4. Port already in use:
- Stop existing process using that port or run Angular on another port:

```bash
npx ng serve --port 4300
```

## Build for Production

```bash
npm run build
```

Build output is generated in `dist/`.

## Notes for Contributors

- Keep model and service contracts aligned with `db.json` shape.
- If you add new API collections, update both:
  - `db.json`
  - corresponding Angular service and model
- Preserve route guard behavior for private pages.

## License

This project is currently for educational and portfolio/demo purposes.
Update this section if you want to publish under a specific open-source license.
