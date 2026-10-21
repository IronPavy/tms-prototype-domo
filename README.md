# Aufgaben Management — Prototyp

React 18 · Vite · TypeScript · Tailwind v4 · Sophi's Pet 3 design system (`src/design-system`).

```bash
npm install
npm run dev        # http://localhost:5174
npm run build
```

## Review comments (for the PO)
Press **C** in the running app, click anywhere and write a comment (name asked once). **Shift+C** shows / hides all comments.
Comments are shared through Supabase when these variables are set (see `.env.example`, table in `supabase/schema.sql`):

```
VITE_REVIEW=1
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Without the Supabase keys, comments stay in the local browser only.

Deploy: Vercel (`vercel.json`) — set the three variables in the project settings.
More: `CLAUDE.md`, `docs/`.
