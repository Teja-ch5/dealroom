# DealRoom 🏦
### AI-native M&A due diligence workspace

> Built for the **Agents League Hackathon 2026** Creative Apps track

---

## What is DealRoom?

M&A due diligence is brutally manual. Associates spend weeks reading hundreds of documents, financials, contracts, cap tables, legal filings, hunting for risks that could kill a deal or surface post-close. Teams miss things. Deals go wrong.

DealRoom is an AI-native due diligence workspace that turns a folder of documents into an interactive deal intelligence system in minutes.

---

## Features

### 📄 Upload any document
Drag and drop PDFs, Word docs, or text files. DealRoom parses, chunks, and indexes everything automatically.

### 💬 Ask anything
Query across all documents in plain English. Get streamed answers with source citations so you can verify every claim.

### ⚠️ Automatic risk detection
When an answer surfaces a risk, DealRoom automatically creates an issue card on the Kanban board, no manual tracking needed.

### 📋 Kanban risk board
Track open issues, move them through Open → Reviewing → Resolved. Click any card to see the full AI analysis.

### 📝 One-click deal memo
Generate a structured deal memo.Executive Summary, Key Risks, Financial Highlights, Recommendation, ready to export as PDF.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| AI / LLM | Groq API (Llama 3.3 70B) |
| Database | Supabase (Postgres + pgvector) |
| Document parsing | pdf-parse-fork, mammoth |
| Deployment | Vercel |

---

## Built with GitHub Copilot

This entire app was built AI-first using GitHub Copilot. The majority of the codebase, from API route scaffolding to document chunking logic to the drag-and-drop Kanban board, was generated from code comments using Copilot's autocomplete.

---

## Getting Started

### Prerequisites
- Node.js v18+
- Supabase account (free)
- Groq API key (free)

### Installation

```bash
git clone https://github.com/Teja-ch5/dealroom.git
cd dealroom
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

NEXTAUTH_SECRET=your_random_secret
```

### Supabase Setup

Run this SQL in your Supabase SQL editor:

```sql
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size integer,
  created_at timestamptz default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  source_question text,
  source_answer text,
  status text default 'open',
  created_at timestamptz default now()
);
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
app/
├── api/
│   ├── upload/route.ts    # Document parsing + indexing
│   ├── query/route.ts     # RAG-based Q&A with Groq
│   └── memo/route.ts      # Deal memo generation
├── kanban/page.tsx        # Risk tracking board
├── memo/page.tsx          # Deal memo generator
└── page.tsx               # Main chat interface
```

---

## Hackathon

- **Event**: Agents League Hackathon 2026
- **Track**: Creative Apps
- **Built with**: GitHub Copilot, Azure OpenAI, Next.js
- **Team**: Bhagya Teja Chalicham

---

## License

MIT
