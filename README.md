# Student.Info

Campus issue intelligence for students and administrators: thoughts feed, tactical heat map, AI-assisted workflows, notifications, gamification (UNI XP), and admin analytics.

**Repository:** [github.com/Skunkworks-boop-beep/Student-Info](https://github.com/Skunkworks-boop-beep/Student-Info)  
**Related org:** [MIS Student Club](https://github.com/baumisstudentclub) (`baumisstudentclub`)

---

## Documentation

| Document | Description |
| --- | --- |
| [**docs/README.md**](docs/README.md) | Index of all documentation |
| [**docs/CREDITS.md**](docs/CREDITS.md) | Core team (first names), roles, and repository/organization attribution |
| [**docs/FEATURES.md**](docs/FEATURES.md) | Feature framework: capabilities, summaries, and contributor mapping |
| [**RELEASE_CHECKLIST.md**](RELEASE_CHECKLIST.md) | Production deploy: migrations, Auth, Resend, Storage |

---

## Quick start

Requirements: **Node.js** (v18+ recommended), **npm** or **pnpm**.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Supabase (production / staging)

1. Copy [`.env.example`](.env.example) to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Run SQL migrations **in order** in the Supabase SQL Editor (see `supabase/migrations/`).
3. Create the **`complaint-media`** bucket is created by migration `20260430150000_storage_media_workflow_rules.sql` (public read, authenticated upload under `userId/...`).
4. Optional: `VITE_SUPPORT_EMAIL` for the Support page mailto target.

When Supabase env vars are set, the app uses real Auth, Storage uploads on thoughts, live feed, leaderboard, notifications, admin analytics, workflow rules, and map heat from **open** thoughts.

### Local demo mode

Leave `VITE_SUPABASE_*` unset to use bundled sample data and mock sign-in (see [`src/app/config/app.ts`](src/app/config/app.ts)).

---

## Tech stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** v4
- **React Router** v7
- **Supabase** (Auth, Postgres, RLS, Storage, optional Edge Functions)
- **Recharts**, **Radix UI**, **Motion**, **Lucide**, and others — see `package.json`

---

## License

Specify a license in this repository if you intend open redistribution; until then, default copyright may apply. Add a `LICENSE` file when the club chooses terms.
