# CDT Journal

A personal trail journal app for my 2024 Continental Divide Trail thru-hike — ~3,000 miles from the Canadian border in Montana to the New Mexico/Mexico border. While hiking I kept a journal, tracked campsites, sent GPS messages home, and took a lot of photos. This app is my attempt to pull all of that together into one place.

Built with Next.js 15, TypeScript, PostgreSQL, and D3.js.

## Features

- **Interactive map** — D3.js visualization showing daily trail segments, campsites, Garmin message locations, and geotagged photos across all five CDT states. Includes a zoomable explore panel to jump to any day's trail segment directly from the map.
- **Journal entries** — Create, read, and edit daily entries linked to a specific date and trail leg. Each entry page includes a mini-map of that day's route.
- **Photo album** — Full photo gallery with lightbox, sourced from photos taken on trail.
- **Calendar view** — Browse entries by date.
- **Elevation contours** — Topographic contour lines on the map generated from DEM raster files via a Python preprocessing script.
- **Authentication** — Password-protected journal routes (NextAuth v5, bcrypt).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + DaisyUI |
| Database | PostgreSQL on Neon |
| Map | D3.js (`geoConicConformal` projection) |
| Photos | react-photo-album + yet-another-react-lightbox |
| Auth | NextAuth v5 (Credentials provider) |
| Validation | Zod |
| Package manager | pnpm |

## Data Model

- **`dates`** — one row per day on trail
- **`entries`** — journal text, linked to a date and state
- **`legs`** — GPS trail segments (from CalTopo exports), linked to a date; include coordinates and mileage
- **`photos`** — images with EXIF lat/lon, linked to a date
- **`users`** — authentication only

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A PostgreSQL database (the app uses [Neon](https://neon.tech))

### Environment variables

Create a `.env` file at the project root:

```
AUTH_SECRET=
POSTGRES_URL=
DATABASE_URL=
PGHOST=
PGUSER=
PGPASSWORD=
PGDATABASE=
```

### Install and run

```bash
pnpm install
pnpm dev        # development server (Turbopack)
pnpm build      # production build
pnpm start      # start production server
pnpm lint       # ESLint
```

## Contour Generation

Topographic contour lines are pre-generated from DEM raster files and saved to `public/contours.geojson`. To regenerate:

1. Export trail legs from the running dev server:
   ```bash
   curl http://localhost:3000/api/legs > scripts/trail_legs.geojson
   ```
2. Drop `.tif` files into `scripts/dem/`
3. Run the script:
   ```bash
   python3 scripts/generate_contours.py
   ```

The script clips each raster to a 30-mile corridor around the trail before extracting contours, which keeps the output file size manageable. Requires `rasterio`, `scikit-image`, `numpy`, and optionally `shapely` for the trail buffer clipping.

## Data Sources

- **Trail segments** — drawn in CalTopo based on campsite locations, exported as GeoJSON
- **Garmin messages & campsites** — exported from Garmin Explore, parsed to extract date, coordinates, and message content
- **Photos** — EXIF metadata extracted with `exifr` to get GPS coordinates and timestamps
- **Elevation data** — USGS 1/3 arc-second DEM tiles
