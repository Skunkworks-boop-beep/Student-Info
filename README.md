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

### Demo sign-in

The app uses mock authentication. Use any password with a demo email such as `student@university.edu` or `admin@university.edu` (see [`src/app/config/app.ts`](src/app/config/app.ts)). Replace with your institution’s identity provider for production.

---

## Tech stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** v4
- **React Router** v7
- **Leaflet** for maps
- **Recharts**, **Radix UI**, **Motion**, **Lucide**, and others — see `package.json`

---

## License

Specify a license in this repository if you intend open redistribution; until then, default copyright may apply. Add a `LICENSE` file when the club chooses terms.
