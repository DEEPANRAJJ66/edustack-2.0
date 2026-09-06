# EduStack 2.0 — Production-Ready JEE Main Test Practice & Error Revision

EduStack 2.0 is a complete web application specifically built for **JEE Main CBT mock practice, attempt-specific analysis, Smart Error Notes, Error Correct Test generation, and revision notebook PDF generation**.

---

## 🚀 Key Systems & Architecture

```text
React + TypeScript + Vite (Tailwind CSS)
              ↓
Node.js + Express + TypeScript Backend
              ↓
Supabase Auth (Google OAuth) + PostgreSQL Database
              ↓
Permanent Student Data & Independent Attempt History
```

1. **Production Supabase Persistence**:
   - Supabase PostgreSQL is the **sole source of truth** for student data (profile, attempts, responses, scores, error notes).
   - Survives browser refresh, tab closure, logout/login, and redeployments.
   - Includes an explicit development/demo fallback with a visible banner for testing when `.env` is unconfigured.
2. **Separation of Code-Managed Tests & Runtime Data**:
   - Tests and questions are code-managed in `client/src/data/tests/` with stable IDs, KaTeX mathematical formulas, and SVG diagrams.
   - No teacher dashboard or question-builder UI.
3. **Concurrency-Safe Attempt Numbering**:
   - Implemented via the PostgreSQL function `create_next_attempt` with row-level locks and `UNIQUE(student_id, test_id, attempt_number)`.
   - Sequential per student + test (`Attempt #1`, `Attempt #2`, etc.).
4. **Server-Authoritative Final Scoring & Flexible Marking**:
   - Evaluates answers on the server against official question keys and custom marking schemes (+4/-1 for MCQ, +4/0 for NAT).
5. **Strict Numerical Answer Type (NAT) Input**:
   - Blocks invalid characters immediately (`0–9` and at most one `.`).
   - The negative sign `-` is strictly rejected.
   - Rejects invalid pasted text (does not silently strip `12a50` into `1250`).
6. **Timestamp-Based Timer**:
   - Computes remaining time from `started_at`; immune to page reloads and browser throttling.
7. **Smart Error Notes & "This is Fine" Logic**:
   - 9 error classifications with debounced autosave.
   - `THIS_IS_FINE` is exclude-only: excluded from error counts, PDF, and retest, but preserved in attempt history.
8. **Error Correct Test System**:
   - Generates a focused retest with only eligible error questions (excluding `THIS_IS_FINE`).
   - Creates an independent retest attempt linked to the original parent attempt.
9. **Attempt-Specific KaTeX PDF Generator**:
   - Generates formatted revision notebooks with rendered equations and diagrams: `<Student>_<Test>_Attempt_<N>_Error_Notes.pdf`.

---

## 🛠 Project Structure

```
Edustack 2.0/
├── client/                     # Frontend (React 18 + Vite + Tailwind CSS + KaTeX)
│   ├── src/
│   │   ├── components/         # MathText (KaTeX), SvgViewer, NumericalInput, Navbar
│   │   ├── data/               # Code-managed Mock Test 01 & Mock Test 02
│   │   ├── features/           # Dashboard, CBT Engine, Analysis, Error Notes, Retest, PDF
│   │   ├── services/           # Supabase client, storageAdapter
│   │   └── utils/              # Strict NAT validation, scoring, formatters
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                     # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Supabase Admin client
│   │   ├── services/           # Authoritative Scoring Service
│   │   ├── tests/              # Official Question Keys & Schemes
│   │   ├── routes/             # Express API routes
│   │   └── server.ts
│   └── package.json
├── supabase/
│   └── migrations/
│       └── 01_initial_schema.sql  # Safe, non-destructive PostgreSQL DDL & RLS
├── .env.example                # Template for environment variables
└── README.md
```

---

## ⚡ Quick Start

### 1. Database Setup (Supabase)
1. In your Supabase Project Dashboard, navigate to the **SQL Editor**.
2. Run the SQL script from `supabase/migrations/01_initial_schema.sql`.
3. In **Authentication > Providers**, enable the **Google** provider.
4. Copy your **Project URL**, **Anon Key**, and **Service Role Key** into `.env`.

### 2. Run the Frontend (Client)
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:3000`.

### 3. Run the Backend (Server)
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`.

---

## 🧪 Testing Multi-Student Isolation
EduStack 2.0 includes a student profile switcher in the top right user menu (Student A vs Student B) so you can directly verify that:
- Student A's attempts `#1`, `#2`, `#3` remain completely isolated from Student B's attempt `#1`.
- Changing answers or error notes in Student B never touches Student A's history.
