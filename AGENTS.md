# Repository Guidelines

## Project Structure & Module Organization
- `index.tsx` bootstraps React 19; `App.tsx` contains the main UI.
- `components/` holds reusable UI units (PascalCase files like `Header.tsx`).
- `services/` contains API and side‑effect logic (e.g., `geminiService.ts`).
- `assets/` stores static files; `index.css` is for global styles; `types.ts` shares common types.
- Import alias `@` maps to the project root (see `vite.config.ts`).

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start Vite dev server at `http://localhost:3000`.
- `npm run build` — produce a production build in `dist/`.
- `npm run preview` — serve the built app locally for verification.

## Coding Style & Naming Conventions
- TypeScript + JSX. Use 2‑space indentation, single quotes, and semicolons.
- Components: PascalCase (`ObjectCard.tsx`). Functions/variables/hooks: camelCase.
- Prefer typed props and explicit return types on exported functions.
- Co‑locate small helpers with usage; move shared logic into `services/` or `components/`.
- Use absolute imports with `@` for cross‑folder paths when clearer.

## Testing Guidelines
- No test runner is configured yet.
- If adding tests, prefer Vitest + React Testing Library.
- Place tests adjacent to sources as `*.test.ts`/`*.test.tsx`. Add an `npm test` script (e.g., `vitest` or `vitest run`).

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `feat: add product selector`, `fix: handle drag ghost`.
- Commit messages must not exceed 150 characters.
- Write imperative, concise subjects; include scope when helpful.
- PRs should include: summary/purpose, before/after screenshots for UI, steps to verify, and linked issues.
- Keep PRs focused; avoid unrelated refactors or reformatting.

## Security & Configuration Tips
- Create `.env.local` and set `GEMINI_API_KEY=...`. Vite exposes it via `process.env.GEMINI_API_KEY` (see `vite.config.ts`).
- Do not commit secrets; `.gitignore` excludes `*.local`.
- Avoid logging sensitive values to the console.

## Agent‑Specific Notes
- Follow the conventions above and keep changes minimal and localized.
- Do not reformat untouched files; prefer small, reviewable patches.
- Use the `@` alias for clearer cross‑folder imports when appropriate.
