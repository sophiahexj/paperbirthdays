# Paper Birthdays

A static website that celebrates academic papers published on today's date. Each visit shows a random paper published on this day in history.

## Features

- Random paper selection on each page load
- No API calls when users visit (all data pre-generated)
- Filters by field, citation count, year (coming soon)
- Scalable architecture supporting thousands of papers
- Daily automated data updates

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Database:** PostgreSQL
- **Data Source:** Semantic Scholar API
- **Deployment:** Vercel (frontend), GitHub Actions (automation)

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set Up Database

Create a free PostgreSQL database at [Neon](https://neon.tech) or [Supabase](https://supabase.com).

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your database connection string to `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

Run the schema:
```bash
# Using psql
psql $DATABASE_URL -f db/schema.sql

# Or copy/paste db/schema.sql into your database provider's SQL editor
```

### 3. Ingest Data

Start with today's date:
```bash
python scripts/ingest_papers.py today
```

Or a specific date (e.g., March 14):
```bash
python scripts/ingest_papers.py 03-14
```

Or ingest all 366 dates (WARNING: takes hours):
```bash
python scripts/ingest_papers.py all
```

### 4. Generate JSON Files

```bash
# Generate all 366 JSON files
python scripts/generate_json.py all

# Or just one date
python scripts/generate_json.py 12-24
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site!

## Project Structure

```
paperbirthdays/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── PaperCard.tsx     # Paper display card
│   └── RandomPaperDisplay.tsx  # Client-side randomization
├── lib/                   # Utility functions
│   ├── dateUtils.ts      # Date formatting
│   └── paperUtils.ts     # Paper filtering/sorting
├── types/                 # TypeScript types
│   └── paper.ts          # Paper interfaces
├── scripts/               # Python scripts
│   ├── ingest_papers.py  # Fetch from API → DB
│   └── generate_json.py  # DB → Static JSON
├── db/                    # Database
│   └── schema.sql        # PostgreSQL schema
├── public/data/          # Generated JSON files
│   ├── 01-01.json       # Papers for Jan 1
│   ├── 12-31.json       # Papers for Dec 31
│   └── metadata.json    # Global stats
└── .env                  # Environment variables (create this)
```

## How It Works

1. **Data Ingestion:** Python script fetches papers from Semantic Scholar API and stores them in PostgreSQL
2. **Static Generation:** Another script queries the database and generates 366 JSON files (one per day)
3. **Frontend:** Next.js loads today's JSON file and randomly selects one paper client-side
4. **Automation:** GitHub Actions runs daily to update citation counts and add new papers

## Key Design Decisions

### Why separate `publication_month_day` and `year`?

- `publication_month_day` (MM-DD): Fast filtering for "papers published today"
- `year`: Enables filters like "oldest paper", "papers from 1900s", etc.
- Together they support flexible querying without performance issues

### Why static JSON instead of API calls?

- **Performance:** No database queries on each page load
- **Cost:** Free hosting on Vercel
- **Simplicity:** No backend server needed
- **Scalability:** CDN-cacheable files

### Why client-side randomization?

- Different paper each refresh without server processing
- Simplest implementation
- Can upgrade to weighted randomization later

## Available Scripts

### Python Scripts

```bash
# Ingest papers
python scripts/ingest_papers.py today     # Today's date
python scripts/ingest_papers.py 03-14    # Specific date
python scripts/ingest_papers.py all      # All 366 dates

# Generate JSON
python scripts/generate_json.py all      # All 366 files
python scripts/generate_json.py 12-24    # Specific date
```

### Next.js Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # Run ESLint
```

## Future Enhancements

- [ ] Filter by field (Economics, Computer Science, etc.)
- [ ] Filter by citation count ("highly cited papers")
- [ ] Filter by year ("oldest papers", "papers from the 2000s")
- [ ] Sort by citations, year, author count
- [ ] Field-specific pages (/economics, /physics)
- [ ] "Share this paper" functionality
- [ ] Historical context ("what else happened this year?")

## Data Sources

- **Semantic Scholar:** Primary source for papers
  - 200M+ papers
  - Free API (100 req/sec without key)
  - Optional API key for higher limits

## Deployment

### Deploy Frontend (Vercel)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Deploy (automatic on push to main)

### Set Up Daily Automation (GitHub Actions)

See `.github/workflows/daily-update.yml` (coming soon) for automated daily updates.

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Acknowledgments

- Data from [Semantic Scholar](https://www.semanticscholar.org/)
- Built with [Next.js](https://nextjs.org/)
- Inspired by projects like [Wikipedia's "On This Day"](https://en.wikipedia.org/wiki/Wikipedia:On_this_day)
