# FenceWatch — Smart Electric Fence Monitoring System

A responsive React dashboard and FastAPI service for forest and electrical fence operations. The two officer workspaces are protected independently with JWT authentication and role checks. Sensor readings, alerts, users, and notification preferences are stored in MySQL.

## What is included

- Shared login with Forest Officer and EB Officer workspaces.
- Dedicated `/forest` and `/eb` dashboards with overview, live monitoring, alerts, reports, location map, and settings.
- FastAPI REST API with JWT authentication and role-based access control.
- MySQL persistence for users, settings, telemetry, and alert history.
- ESP32/Blynk Cloud telemetry integration with configurable virtual pins.
- Clearly marked demo telemetry when Blynk is not configured; no demo sample is represented as live hardware data.
- PDF report downloads generated from stored data.
- Map view with sample coordinates, explicitly identified as illustrative until surveyed location data is configured.

## Requirements

- Node.js 18+ and npm
- Python 3.10+
- Docker Desktop (or a local MySQL 8 instance)

## Run locally (Windows PowerShell)

1. Start the MySQL service from the project root:

   ```powershell
   docker compose up -d mysql
   ```

2. Configure the API. Run these commands from the project root:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   py -m venv backend\.venv
   .\backend\.venv\Scripts\Activate.ps1
   python -m pip install -r backend\requirements.txt
   python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
   ```

   The API creates its tables and demo accounts on first startup. Interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

3. In a separate PowerShell window:

   ```powershell
   Set-Location frontend
   npm install
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173).

### Demo accounts

| Workspace | Username | Password |
|---|---|---|
| Forest Officer | `forest` | `forest123` |
| EB Officer | `eb` | `eb123` |

These are local demonstration credentials. Change them using the backend environment variables before deployment.

## Blynk / ESP32 configuration

Edit `backend\.env` and set `BLYNK_AUTH_TOKEN` from your Blynk device. The default Blynk virtual pin mapping is:

| Virtual pin | Measurement |
|---|---|
| `V0` | Fence voltage in kV |
| `V1` | Current in A |
| `V2` | Temperature in °C |
| `V3` | Humidity in % |
| `V4` | Battery level in % |
| `V5` | Fence status (`1` energized, `0` fault) |
| `V6` | Animal motion sensor (`1` detected, `0` clear) |

Set `BLYNK_*_PIN` variables to match your Blynk template. After restarting the API, monitoring requests fetch each pin from Blynk, persist readings, and create/resolve threshold alerts. Blynk API errors are returned explicitly rather than silently switching to demo data. Leave `BLYNK_AUTH_TOKEN` empty to use database-backed demo samples; the UI labels this mode clearly.

The map uses illustrative coordinates around the Western Range sample site. Replace the locations and boundary in `backend/app/routers.py` with surveyed GPS coordinates before relying on the map in field operations.

## Environment configuration

`backend/.env.example` documents the available settings. At minimum, set a private `JWT_SECRET` and a production `DATABASE_URL` for deployment. The local Compose MySQL credentials are development-only.

Set `VITE_API_URL` in `frontend/.env` if the API is hosted somewhere other than `http://localhost:8000/api`.

## API overview

- `POST /api/auth/login?role=forest_officer|eb_officer` — form fields `username`, `password`
- `POST /api/auth/logout`
- `GET /api/forest/{dashboard,monitoring,alerts,reports,locations,settings}`
- `PUT /api/forest/settings`
- `GET /api/forest/reports/download?report_type=daily|weekly|incidents`
- `GET /api/eb/{dashboard,monitoring,alerts,reports,locations,settings}`
- `PUT /api/eb/settings`
- `GET /api/eb/reports/download?report_type=daily|weekly|incidents`
- `GET /health`

All Forest Officer and EB Officer API endpoints require a valid bearer token and enforce the matching role.
