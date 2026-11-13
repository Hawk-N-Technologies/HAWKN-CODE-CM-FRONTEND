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
| `/op` | Operator (and admin) | Choose packing section |
| `/op/pack/:sectionId` | Operator (and admin) | Packing screen: scan, progress, complete |
| `/verify` | Operator (and admin) | Scan a box label, see its record, save the check |
| `/print/batch/:batchId` | Admin | Product label sheet (A4 stickers, adjustable layout) |
| `/print/box/:publicId` | Operator (and admin) | 1 x 1 inch box label |
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

## Printing

Print from Chrome or Edge on a computer.
- Box label: paper 1 x 1 in (25 x 25 mm), scale 100%, margins None.
- Product sheets: paper A4, scale 100%, margins Default, headers/footers off. Test on plain paper first.

## Testing on a phone (camera needs https)

1. Mac IP address: `ipconfig getifaddr en0` (e.g. `192.168.1.20`). Phone on the same Wi-Fi.
2. Create a local certificate once, inside `AMPL_Packing_POC/`:
   ```bash
   mkdir -p .cert
   openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout .cert/key.pem -out .cert/cert.pem -subj "/CN=ampl-dev"
   ```
3. In `.env` (copy from `.env.example`): `VITE_DEV_HTTPS=true`
4. In the backend `.env`, add to `DJANGO_CSRF_TRUSTED_ORIGINS`: `https://localhost:5180,https://192.168.1.20:5180`, then restart the backend.
5. `npm run dev`, then open `https://192.168.1.20:5180` on the phone and accept the certificate warning
   (Android Chrome: Advanced → Proceed; iPhone Safari: Show Details → visit this website).

`.cert/` is git-ignored. If the Mac asks whether to allow incoming connections for node, allow it.
