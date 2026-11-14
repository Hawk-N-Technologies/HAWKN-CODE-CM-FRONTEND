# AMPL Packing POC — Frontend

React + Vite web app for QR-based packing at Hawk N Technologies.

- **Phones:** operators sign in, choose a packing section, scan product QR codes into a box, complete it, and verify boxes.
- **Laptops:** the admin manages SKUs, UIDs, box configurations, sections and users, prints labels, and sees the dashboard, packing history and scan log.

It runs on its own (port 18001) and shares no code or settings with HawkN OS. It proxies API requests to the AMPL backend (`https://ampl-pocapi.hawkntechnologies.com`).
The backend is `AMPL_Packing_POC/` in the HAWKN-CODE-CM-BACKEND repo. Its `docs/` folder has the test record and the deployment guide.

## First-time setup

Run from inside `AMPL_Packing_POC/`.

```bash
npm install
npm run dev          # http://localhost:18001  (https://… if VITE_DEV_HTTPS=true)
```

Open the app and sign in. Admins land on the dashboard (`/manage`), operators on their sections (`/op`).

## Commands

```bash
npm run dev          # development server
npm run build        # production build into dist/
npm run preview      # serve the build locally
npm run lint         # code checks
```

## Settings (`.env`, optional)

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `18001` | Dev / container server port |
| `VITE_BACKEND_URL` | `https://ampl-pocapi.hawkntechnologies.com` | AMPL backend API URL |
| `VITE_API_PROXY_TARGET` | `https://ampl-pocapi.hawkntechnologies.com` | Where Vite dev server proxies `/api` and `/admin` |
| `VITE_DEV_HTTPS` | `false` | `true` = serve https with the certificate in `.cert/` (needed for phone cameras) |
| `VITE_DEV_HTTPS_KEY`, `VITE_DEV_HTTPS_CERT` | `.cert/key.pem`, `.cert/cert.pem` | Certificate files |

The production build needs no settings: it always calls `/api/v1` on its own address.

## Screens

| Route | Who | What |
| --- | --- | --- |
| `/login` | Everyone | Sign in |
| `/manage` | Admin | Dashboard: UID and box counts, capacity, recent batches |
| `/manage/skus` | Admin | Add/edit SKUs, generate UIDs |
| `/manage/batches` | Admin | All UID batches: print labels, CSV |
| `/manage/configurations` | Admin | Box configurations and their versions |
| `/manage/sections` | Admin | Sections, their configuration and operators |
| `/manage/history` | Admin | Packing history with filters; click a box ID to open its record |
| `/manage/scan-log` | Admin | Every scan and action, accepted or rejected |
| `/manage/users` | Admin | Add users, reset passwords, activate/deactivate |
| `/op` | Operator (and admin) | Choose a packing section |
| `/op/pack/:sectionId` | Operator (and admin) | Packing screen: scan, progress, complete |
| `/verify` | Operator (and admin) | Scan a box label, see its record, save the check |
| `/print/batch/:batchId` | Admin | Product label sheet (A4 stickers, adjustable layout) |
| `/print/box/:publicId` | Operator (and admin) | 50 × 35 mm box label |
| `/status` | Everyone | Frontend / backend / database health |

## Testing on a phone (camera needs https)

1. Mac IP address: `ipconfig getifaddr en0` (e.g. `192.168.1.20`). Phone on the same Wi-Fi.
2. Create a local certificate once, inside `AMPL_Packing_POC/`:
   ```bash
   mkdir -p .cert
   openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout .cert/key.pem -out .cert/cert.pem -subj "/CN=ampl-dev"
   ```
3. In `.env` (copy from `.env.example`): `VITE_DEV_HTTPS=true`
4. In the backend `.env`, set `DJANGO_CSRF_TRUSTED_ORIGINS` (one line only) to include `https://localhost:5180,https://192.168.1.20:5180`, then restart the backend.
5. `npm run dev`, then open `https://192.168.1.20:5180` on the phone and accept the certificate warning
   (Android Chrome: Advanced → Proceed; iPhone Safari: Show Details → visit this website).

`.cert/` is git-ignored. If the Mac asks whether to allow incoming connections for node, allow it. If the Wi-Fi gives the Mac a new IP address, update step 4.

## Scanning

- **Camera:** the `qr-scanner` library (`src/components/scanner/QrScannerView.jsx` is the only file that uses it).
- **Typing or USB/Bluetooth scanners:** the "Type or scan" box (scanners type the code and press Enter).
- The same code seen again within 2.5 seconds is ignored (the camera sees one label many times a second). The server still rejects real duplicates.
- Feedback: green or red banner, a beep, and vibration on Android.

## Printing

Print from Chrome or Edge on a computer.
- **Box label:** paper 50 × 35 mm (landscape), scale 100%, margins None.
- **Product sheets:** paper A4, scale 100%, margins Default, headers and footers off. Test on plain paper first, then adjust the sheet layout (it is remembered on that computer).

## Production

### Option 1: Docker
The Dockerfile supports running from either the root repository or inside `AMPL_Packing_POC/`:

```bash
# From root directory:
docker build -t ampl-frontend -f AMPL_Packing_POC/Dockerfile .

# Or from inside AMPL_Packing_POC/:
cd AMPL_Packing_POC
docker build -t ampl-frontend .

# Run container on port 18001:
docker run -d -p 18001:18001 --name ampl-frontend ampl-frontend
```

### Option 2: Nginx on host
`npm run build`, then serve `dist/` with nginx on the same HTTPS address that forwards `/api/` and `/admin/` to the backend.
See `deploy/nginx.conf.example` and the backend's `docs/DEPLOYMENT.md`.

## Layout

```
src/
  api/            client.js (all backend calls), one file per area
  auth/           AuthProvider (who is logged in), RequireAuth (route guard), roles
  layouts/        AdminLayout (side menu)
  components/     scanner/, packing/, verification/, admin/, ui/ (shared pieces)
  pages/          one file per screen; admin/ and print/ sub-folders
  styles/         tokens.css (Hawk N colours, copied), app.css
deploy/           nginx.conf.example
```

## Known limitations

- Printing uses the browser's print dialog (no silent printing). Sticker sheet presets are starting values.
- The phone camera needs HTTPS. In development the certificate is self-signed, so phones show a one-time warning.
- Vibration does not work on iPhone (browser limitation).
- Verification shows the system record of a box; only "Physical inspection" means someone opened and counted it.
