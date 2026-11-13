# AMPL Packing POC — Frontend

React + Vite web app for QR-based packing (operators on phones) and administration (desktop).

- Runs on its own (port 5180). Shares no code or settings with HawkN OS.
- Talks only to the AMPL backend through `/api/v1` (same origin, session cookies).

## First-time setup

Run these from inside `AMPL_Packing_POC/`. The backend must be running on port 8010.

```bash
npm install          # creates package-lock.json; commit it
npm run dev          # http://localhost:5180
```

Check: open <http://localhost:5180>. You are sent to the sign-in page.

| Route | Who | What |
| --- | --- | --- |
| `/login` | Everyone | Sign in |
| `/manage` | Admin | Admin home (UID capacity, links) |
| `/op` | Operator (and admin) | Operator home (assigned sections) |
| `/status` | Everyone | Frontend / backend / database health |

The Django admin console is reachable through this app at `/admin/`.

Other commands:

```bash
npm run lint         # code checks
npm run build        # production build into dist/
npm run preview      # serve the build locally
```

## Settings

Defaults work for local development. To change them, copy `.env.example` to `.env`:

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `5180` | Dev server port |
| `VITE_API_PROXY_TARGET` | `http://localhost:8010` | Where the backend runs |

## Layout

```
src/
  api/          client.js (all backend calls go through here), one file per area
  auth/         AuthProvider (who is logged in), RequireAuth (route guard), roles
  components/   shared UI pieces
  pages/        one file per screen
  styles/       tokens.css (Hawk N colours, copied), app.css
```

Phone camera scanning needs HTTPS; that is set up in M4.
