# FrameHunter

> Aesthetic video & photography frame search engine powered by perceptual color vectors (Oklab LMS), photometric curves, and PostgreSQL + pgvector.

## Overview

FrameHunter analyzes frames and images in real-time, extracting:
- **9D Perceptual Oklab Vector**: 3 dominant color centroids converted from sRGB through linear RGB to Oklab coordinates, ordered by cluster weight.
- **Photometric Telemetry**: Average relative luminance (ITU-R BT.709) and shadow crush ratio.
- **HNSW Vector Indexing**: Sub-millisecond $L_2$ distance search across millions of frames using pgvector.
- **Interactive Control Deck**: Dual color picker, reference library, custom curation workspace, photometric sliders, and high-resolution lightbox view.

---

## Tech Stack

- **Backend**: Node.js, TypeScript, Fastify, Sharp, `pg`, `pgvector`
- **Database**: PostgreSQL 16 with `pgvector` extension
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons

---

## Architecture & File Structure

```
frame-hunter/
├── docker-compose.yml           # PostgreSQL + pgvector service
├── .gitignore                   # Excludes secrets, build outputs, and caches
├── .env.example                 # Root environment template
│
├── backend/
│   ├── .env.example
│   ├── migrations/
│   │   └── 001_init_schema.sql  # pgvector extension, table schemas, HNSW indexes
│   └── src/
│       ├── config/db.ts         # Connection pool & auto-migrations
│       ├── core/                # Color space conversion & quantization
│       ├── routes/              # Ingest & vector search endpoints
│       └── server.ts            # Fastify application server
│
└── frontend/
    ├── .env.example
    ├── src/
    │   ├── app/                 # Next.js app layout & main dashboard
    │   ├── components/          # FrameCard, DualColorPicker, MoodSliders, etc.
    │   └── lib/                 # Color conversion utilities & API client
```

---

## Getting Started

### 1. Start PostgreSQL with pgvector

```bash
docker-compose up -d
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend server will run at `http://localhost:5000`.

### 3. Configure Frontend

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

MIT
