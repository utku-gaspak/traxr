# Job Application Tracker (Full Stack .NET 10 & React)

Job Application Tracker is a full-stack application for managing job applications with JWT authentication, per-user data isolation, and a tested React dashboard for day-to-day tracking.

## Core Features

- JWT-based authentication for register and login flows
- CRUD operations for job applications
- Application status tracking (`Applied`, `Interviewing`, `Rejected`, `Offer`)
- Protected dashboard routes with persisted login state
- Specialized error handling for validation, not found, unauthorized, server, and connection failures
- Generated OpenAPI artifact and TypeScript client support for backend/frontend synchronization

## Tech Stack

### Backend

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL (Neon / Npgsql)
- xUnit
- Moq
- FluentAssertions

### Frontend

- React
- TypeScript
- Vite
- Vitest
- React Testing Library
- MSW

## Testing Philosophy

This project has been hardened with a test-driven approach across both layers.

- Backend tests isolate services and controllers with an in-memory EF Core test database and targeted mocks.
- Frontend tests isolate API behavior with MSW so the UI can be verified without a live backend.
- Current coverage includes authentication, protected routing, CRUD flows, validation, empty states, loading states, catastrophic failures, and auth-expiry behavior.

Current test count:

- Backend: `45` tests
- Frontend: `17` tests
- Total: `62` tests

Run the suites with:

```bash
dotnet test server/server.slnx
```

```bash
cd client
npm test
```

## Setup Guide

### Backend

1. Provide the required configuration for the API:
   - `ConnectionStrings__DefaultConnection`
   - `JWT__Issuer`
   - `JWT__Audience`
   - `JWT__SigningKey`
2. Restore and run the API:

```bash
dotnet restore server/server.slnx
dotnet run --project server/api
```

The API runs on `http://localhost:5075` by default.

### Frontend

1. Install dependencies:

```bash
cd client
npm install
```

2. Optionally override the backend URL with:
   - `VITE_API_BASE_URL`

3. Start the client:

```bash
npm run dev
```

The frontend expects the API at `http://localhost:5075` unless `VITE_API_BASE_URL` is provided.

## Project Status

The project is currently in a **Functional & Hardened** state and is ready to move into the **UI/UX Design** phase.

## Audit Notes

The latest audit pass included a few cleanup corrections before this README was written:

- removed stale backend config code that was no longer used (`AppOptions` / `AddAppOptions`)
- removed the unused `efscaffold` placeholder class
- normalized remaining mixed-language auth strings in runtime code
- moved `LoginDto` into the correct namespace and added request validation attributes
- removed the manual `500` catch from `AccountController.Register` so unhandled exceptions flow through the global exception handler
- tightened JWT timestamp generation to use `UtcNow`
