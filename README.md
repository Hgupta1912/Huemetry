# Huemetry

**Live app:** [placeholder — add your deployed Netlify URL here once live]

Huemetry is a color analytics platform for visual artists. Log your art as it develops, and get back quantitative insight into your palette; tonal range; hue, saturation, and value statistics; and comparative statistics against a reference photo if desired.

This is partly powered by a self-implemented adaptive saliency weighted k-means++ color-clustering algorithm in the CIELAB color space followed by delta refinement. This project is also my personal portfolio piece: I'm an artist and a computer science student, and Huemetry is my attempt to build something that builds an intersection of both: using color theory and statistics to inform artistic process, the same way logic and creativity inform each other in my own practice.

> **This app is designed for phone-sized screens only.** If you're testing it on a laptop, open your browser's dev tools, toggle the device toolbar, and set a mobile viewport (roughly 440×960 works well). It has not been designed nor tested for desktop widths.

---

## Screenshots

*(placeholders)

| Dashboard | Session Analytics | Discover Artists |
|---|---|---|
| ![Dashboard](./screenshots/dashboard.png) | ![Session Analytics](./screenshots/session-analytics.png) | ![Discover Artists](./screenshots/discover.png) |

---

## What it does

- **Log your creative process.** Create a project in either *progressive* mode (log sessions as you go, in real time) or *retrospective* mode (backdate sessions for work you've already finished).
- **Real color science.** Every uploaded image runs through a custom-built k-means++ clustering pipeline (operating in CIELAB color space (not RGB) for perceptually accurate results), with saliency-weighted centers so small, vivid accent colors don't get lost inside a larger neutral area, and an over-cluster-then-consolidate refinement step (using Delta E76 perceptual distance) so near-duplicate neutral tones get merged rather than crowding out another distinct color.
- **Tonal decomposition.** Every image gets broken down into overall, shadow, midtone, and highlight palettes, where their threshholds/fences are adaptively calculated.
- **Reference comparison.** For realism work, upload a reference photo and see how each session's palette, saturation, value, and warmth compare to it (through metrics, histograms, and multi-boxblots) including how that comparison trends over the life of the project.
- **Full statistical + visual analytics**, per session and cumulative per project: box plots, histograms, palette breakdowns, temperature (warmth/coolness) scoring, and trend lines over time (all built from scratch on top of Recharts, since no charting library ships a box-plot component out of the box).
- **A free, no-signup analyzer.** Anyone can upload a single image and get instant palette/statistics feedback with zero account required.
- **A social layer.** Public profiles, portfolios, a discovery feed for browsing other artists' public work, and collections for grouping your own projects into series.

---

## Tech stack

**Frontend**
- React 19 + TypeScript, built with Vite
- Tailwind CSS v4
- React Router (data router, nested routes, protected-route pattern)
- Recharts, extended with custom-built chart types (a from-scratch box plot using Recharts' floating-bar primitives, since Recharts has no native box plot; overlaid/superimposed histograms for reference comparisons)
- A hand-built CMY color system for the UI itself: three translucent primary colors (cyan/magenta/yellow) that alpha-blend into secondary colors wherever they visually overlap, echoing the app's own concept

**Backend**
- Node.js + Express
- PostgreSQL, via Prisma ORM
- JWT-based authentication with bcrypt password hashing
- Cloudinary + Multer for image upload/storage
- Sharp for server-side image decoding and downsampling

**Core algorithm (the technical centerpiece)**
- A self-implemented k-means++ clustering algorithm (not a library) including:
  - Perceptually-weighted initialization
  - Saliency-weighted center updates (saturation and pixel contrast based), so visually striking/different colors pull cluster centers toward themselves
  - Clustering performed in CIELAB space rather than RGB, since RGB's geometry doesn't match human color perception and causes visually distinct saturated colors to average into muddy neutrals
  - "Snap to real pixel" post-processing, so every reported color is a genuine color that exists in the image, never a synthetic average that was never actually present
  - Over-clustering + Delta E76-based consolidation, merging near-duplicate results and pruning weak clusters by a saturation/weight score
- Single-pass statistical summarization (box-plot quartiles/fences/outliers via linear-interpolation percentiles, histograms, hue-based warmth scoring) computed directly from raw pixel data
- `culori` used only for the well-established, solved RGB↔LAB color-space conversion math — deliberately not hand-rolled, since that's a standard formula, not part of the app's own algorithm design

**Deployment**
- Frontend: Netlify
- Backend: Render
- Database: Neon (managed PostgreSQL)

---

## Running it locally

### Prerequisites
- Node.js (v18+ recommended)
- A PostgreSQL database (Neon, or any Postgres instance)
- A Cloudinary account (for image uploads)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/huemetry.git
cd huemetry
```

### 2. Set up the server
```bash
cd server
npm install
```
Create a `.env` file in `server/` with:
```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
SERVER_PORT=3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```
Then run the Prisma migrations and start the server:
```bash
npx prisma migrate dev
npm run dev
```

### 3. Set up the client
In a separate terminal:
```bash
cd client
npm install
```
Create a `.env` file in `client/` with:
```
VITE_API_URL=http://localhost:3000
```
Then start the dev server:
```bash
npm run dev
```

### 4. Open it
Visit the local URL Vite prints (usually `http://localhost:5173`), and remember to switch your browser into a mobile device view, per the note at the top of this README.

---

## Deploying your own copy

1. **Database (Neon):** create a free Neon Postgres project, copy the connection string into your Render environment variables as `DATABASE_URL`.
2. **Backend (Render):** create a new Web Service pointing at the `server/` folder of this repo. Set the same environment variables listed above (`DATABASE_URL`, `JWT_SECRET`, Cloudinary keys, `FRONTEND_URL` set to your eventual Netlify URL). Render will run `npm install` and `npm start` automatically — confirm your `package.json` has a `start` script.
3. **Frontend (Netlify):** create a new site pointing at the `client/` folder. Set `VITE_API_URL` to your Render backend's URL in Netlify's environment variables. Build command: `npm run build`; publish directory: `dist`.
4. **Update CORS:** make sure your backend's `FRONTEND_URL` env var exactly matches your live Netlify URL (no trailing slash), or requests from the deployed frontend will be blocked.

**Known tradeoff:** the backend is deployed on Render's free tier, which spins down after inactivity — the first request after a period of no traffic can take up to a minute or so to wake back up. Subsequent requests are fast. This is a deliberate, accepted tradeoff for a free-tier personal project, not a bug.

---

## Known limitations / future work (test new sync)

- Portfolio-level and collection-level analytics are not yet built (only individual session and project analytics currently exist).
- Ridgeline plots (showing how color-distribution shape changes over time) are planned but not yet implemented.
- Account deletion is not yet implemented.
- This is a PWA-in-progress — installable home-screen support is planned but not yet wired up.
- The color-extraction algorithm involves randomized initialization (k-means++), so re-analyzing the exact same image can occasionally produce very slightly different results between runs — this is flagged directly in the UI wherever comparative statistics are shown.