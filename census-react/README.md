# Barangay Census Management System

A frontend transformation of the original React/Vite project into a two-role Barangay Census Management System.

## Roles
- **User** — single-page census form with household members and validation.
- **Admin** — dashboard, census records, residents, reports, Excel/PDF/print tools, activity logs, and settings.

## Data
The current prototype uses simple React state through a small React Context provider with fictional mock census data. Records are kept only in the current application session and reset when the page is fully reloaded.

## Run
```bash
npm install
npm run dev
```

For a production build:
```bash
npm run build
```
