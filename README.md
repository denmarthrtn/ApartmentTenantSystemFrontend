# Apartment Manager (frontend)

The web app for my [Apartment Management System API](https://github.com/denmarthrtn/ApartmentSystem). It is built with React, TypeScript, Vite and Tailwind CSS.

## Live demo

**https://yellow-pond-033850b00.5.azurestaticapps.net**

You can sign in with either of these demo accounts:

| Role             | Email                         | Password         |
|------------------|-------------------------------|------------------|
| Property manager | `demo.admin@apartments.local` | `Demo#Admin2026` |
| Tenant           | `juan.delacruz@example.com`   | `Tenant#2026x`   |

The site and the API are both on Azure's free tier. The API goes to sleep when nobody is using it, so the first page can take a minute or more to load and may say "Can't reach the server" at first. Give it a moment and refresh.

Everything in the demo is sample data, so feel free to add, edit and delete things.

## What it does

- **Public page.** Anyone can browse the vacant apartments.
- **Property manager.** A dashboard (occupancy, rent collected, overdue rent, open repairs), plus pages to manage apartments, tenants, leases, billing and maintenance requests. Payments can be recorded in parts, and a tenant can be given a login.
- **Tenant.** Sees only their own lease, rent charges and balance, and can report a problem in their apartment and follow it.

The menu and pages change with the role in the login token. The API still checks every request, so hiding a page here is only for convenience.

## Running it

You need Node.js 20 or newer, and the API running locally (`dotnet run --project ApartmentManagementSystem` in the API repo, which listens on http://localhost:5041).

```bash
npm install
npm run dev
```

Open http://localhost:5173. In development the login page has two buttons for the API's demo accounts, so there is nothing to type.

The API has no CORS policy, so in development Vite forwards every `/api` request to it. If your API runs somewhere else, copy `.env.example` to `.env.local` and change `API_PROXY_TARGET`.

If the pages say "Can't reach the server" while the API is running, the API was probably started with its https profile (Visual Studio does this by default). It then redirects port 5041 to https://localhost:7253, and the browser blocks that redirect. Start the API with `dotnet run` instead, or point `API_PROXY_TARGET` at the https address.

### Demo accounts

The API creates the same two accounts listed under [Live demo](#live-demo) when it runs in Development. They are the accounts the two buttons on the login page use.

### Settings

All of these are optional and go in `.env.local`.

| Name               | What it is for                                                                  |
|--------------------|---------------------------------------------------------------------------------|
| `API_PROXY_TARGET` | Where Vite forwards `/api` in development. Default `http://localhost:5041`.      |
| `VITE_API_URL`     | Full address of the API for a production build when it is on another domain.     |
| `VITE_DEMO`        | Set to `true` to show the demo account buttons outside development.              |

## Building for production

```bash
npm run build     # type-checks, then writes the site to dist/
npm run preview   # serves dist/ locally
```

If the site and the API are on different domains, set `VITE_API_URL` to the API's address before building, and allow the site's origin in the API with CORS. The host also has to send every unknown path to `index.html`, because the pages are routed in the browser.

## How the code is laid out

```
src/
  api.ts      fetch wrapper, login/logout, token refresh, and the API's response types
  lib.ts      formatting helpers and the data-loading hooks
  ui.tsx      shared components: icons, buttons, fields, badges, table, modal
  App.tsx     routes and the sidebar layout
  pages/      one file per screen
```

A few decisions worth knowing about:

- **No data-fetching or form library.** `useFetch` and `usePaged` in `lib.ts` are small enough for this app, and forms read their values with the browser's `FormData`.
- **Token refresh.** Access tokens last 15 minutes. When a request gets a 401, the app refreshes once and retries. The API's refresh tokens are single use, so the refresh runs inside a browser lock (`navigator.locks`) to stop two requests, or two tabs, from using the same one.
- **Modals** use the native `<dialog>` element, which handles focus and the Esc key by itself.
- **No icon or component library.** The icons are a few inline SVGs in `ui.tsx`, and the look comes from Tailwind classes on the shared components, so a change there shows up on every page. The only runtime dependencies are React and React Router.
- **Loading and motion.** Tables show grey placeholder rows while the first page loads. Pages fade in when you move between them, and the animations are turned off for people who ask their system for reduced motion.

## Checking the code

```bash
npm run lint      # oxlint
npm run build     # also runs the TypeScript type check
```

There are no automated tests in this project yet. The API has its own test suite.
