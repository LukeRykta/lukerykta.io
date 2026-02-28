# AGENTS.md

> Working agreement for autonomous/codegen agents ("Codex") collaborating on **lukerykta.io**.

This document defines **how agents should propose, generate, and modify code** in this repository. It encodes Luke’s preferences, tech choices, and guardrails so changes stay consistent and production‑ready.

---

## 1) Project snapshot

- **Monorepo**: Nx + pnpm
- **Frontend**: Angular (latest), standalone APIs, Signals, new control flow (`@if/@for/@switch`), `@defer` for lazy UI, `NgOptimizedImage` for images
- **UI**: Tailwind CSS (global base styles), Angular Material (M3) as needed
- **Brand**: lukerykta.io, Inter font baseline, dark background (`bg-neutral-900`), LR logo assets
- **Animation**: GSAP used for splash and micro‑interactions
- **Backend**: Spring Boot 3.x, REST APIs, OAuth2 login (Google & GitHub), HttpOnly cookie strategy
- **Auth UX**: Site is browsable without login; **interactive features require sign‑in** (redirect to provider)
- **Build/Run** (from `project.json` excerpt):
  - `serve`: `pnpm ng serve` (cwd: `frontend`)
  - `build`: `pnpm ng build` (cwd: `frontend`, outputs to `frontend/dist`)
  - `test`: `pnpm ng test --watch=false --browsers=ChromeHeadless`

> Agents must respect the above and avoid silently changing core tech.

---

## 2) Ground rules (must‑follow)

1. **Target: Angular Latest**  
   - Use **standalone components**, **functional providers**, **`inject()`**, **Signals** (`signal`, `computed`, `effect`), and the **new control flow** (`@if/@for/@switch`).  
   - Prefer **`@defer` blocks** for below‑the‑fold or slow resources.  
   - Use **`provideHttpClient(withFetch())`**, typed `HttpClient`, and functional route guards/resolvers.
2. **Zero legacy patterns**  
   - **Do not** introduce NgModules (except Material’s provided APIs), deprecated RxJS patterns for simple state, zone‑heavy hacks, or structural directives `*ngIf/*ngFor` (use new directives).  
   - Prefer **Signals over heavy RxJS** for local UI state; keep RxJS for streams/HTTP orchestration.
3. **Styling**  
   - Primary styling via **Tailwind** utility classes.  
   - Keep global base: `html, body { @apply min-h-screen bg-neutral-900 text-white; font-family: Inter, ... }`.  
   - Use Angular Material when appropriate; prefer **M3 tokens** and define theme in a single place.
4. **Images**  
   - Use `NgOptimizedImage`; **`sizes` must be responsive (no px)**. Provide explicit `width/height` when possible.
5. **Auth**  
   - Public routes stay public. Mutating actions must **gate to OAuth**: navigate to `/login` with providers or direct to `/oauth2/authorization/{provider}` endpoint. Use HttpOnly cookies; do **not** store tokens in JS.
6. **Accessibility & i18n**  
   - Semantic HTML; focus management on dialogs/menus; color contrast ≥ WCAG AA; support `prefers-reduced-motion`.
7. **Performance**  
   - **Code‑split** smartly (route‑level & `@defer`).  
   - Avoid layout thrash; batch DOM writes; keep GSAP timelines isolated; prefer CSS transforms.
8. **Testing**  
   - Add unit tests for pure logic and critical components. Headless Chrome for CI via `nx test`.
9. **DX & Consistency**  
   - Use **Conventional Commits**.  
   - Keep changes **small, focused**, and **explain rationale** in PR description.  
   - Follow file structure & naming conventions below.

---

## 3) Angular conventions (latest style & directives)

### 3.1 Components & inputs
- `standalone: true` always.  
- Use **`input()` signal** or standard `@Input()` (prefer signal when reactive use is immediate).  
- Prefer **`host`** bindings in `@Component` for classes/attrs over extra wrappers.

### 3.2 Templates
- Use **`@if / @else`** instead of `*ngIf`.  
- Use **`@for (item of items; track item.id)`** instead of `*ngFor`. Always provide a stable `track`.  
- Use **`@defer`** with `on viewport`, `on interaction`, or explicit triggers for expensive blocks.  
- Prefer **`[class]`/`[style]`** bindings to runtime `ngClass/ngStyle` when possible.  
- Keep template logic simple—move computations to `computed()` or class getters.

### 3.3 State management
- **Local UI state**: Signals.  
- **Derived state**: `computed()`.  
- **Side effects**: `effect()`.  
- **Server communication**: `HttpClient` with typed models; minimal services using `inject()`.

### 3.4 Routing
- **Standalone route configs** with lazy `loadComponent()`/`loadChildren()`.  
- Functional **guards/resolvers** (no classes).  
- Public routes remain public; protected actions trigger login flow.

### 3.5 HTTP & errors
- `provideHttpClient(withFetch(), withInterceptors([...]))`.  
- Centralize error mapping; surface user‑friendly messages; never leak stack traces to UI.

### 3.6 Material & theming
- Single theme definition (M3) and tokens; do **not** scatter ad‑hoc palette tweaks.  
- Prefer **filled/tonal** buttons for primary actions; adjust density via design tokens, not arbitrary CSS.

### 3.7 Images & assets
- Use `ngSrc`, `priority`, and responsive `sizes` (e.g., `"(min-width: 768px) 50vw, 100vw"`).  
- Provide intrinsic dimensions to reduce CLS.

---

## 4) Repository layout & scaffolding

```
root/
  frontend/                # Angular app (name: frontend)
    src/
      app/
        pages/             # route components
        components/        # shared UI components
        core/              # providers, interceptors, tokens
        assets/            # images, logo, fonts declarations
    project.json           # Nx targets (serve/build/test)
  backend/                 # Spring Boot app
  tools/                   # Nx generators (if any)
```

**When adding files**, prefer generators or copy an existing pattern. Keep filenames **kebab‑case**; component selectors prefixed with `app-`.

---

## 5) Auth: interaction gating pattern

- Any action that **creates/likes/replies/edits** must call a central `requireAuth()` util.  
- If unauthenticated → redirect to `/login` screen offering **Continue with Google/GitHub**.  
- After login, **return to the original intent** (use `redirectUrl` in query).  
- Back end issues session via **HttpOnly cookie**; front end reads only auth **status**, not raw tokens.

---

## 6) Performance & progressive loading

- Use route-level lazy loading and `@defer` for below‑the‑fold content (e.g., heavy carousels/GSAP sequences).  
- Keep GSAP timelines detached until element is visible. Clean up in `ngOnDestroy`.

---

## 7) Quality gates

- **Lint/Format**: ESLint + Prettier; run on staged files.  
- **Tests**: Add/maintain unit tests for new logic; provide at least smoke tests for components with complex bindings.  
- **Accessibility**: Verify keyboard paths, ARIA where needed, and color contrast.  
- **Images**: Validate `NgOptimizedImage` usage—no pixel‑based `sizes`.

---

## 8) Commit & PR hygiene

- Conventional Commits examples:  
  - `feat(frontend/home): add @defer block to hero video`  
  - `fix(auth): gate like-button and preserve redirectUrl`  
  - `refactor(ui): replace *ngFor with @for`  
- PR description must include: **context**, **screenshots** (or GIF), **risk**, **testing notes**.

---

## 9) Typical agent tasks (safe to automate)

- Migrate templates to `@if/@for/@switch`.  
- Replace local state with Signals (`signal/computed/effect`).  
- Add `@defer` to non‑critical UI (document trigger).  
- Wire `NgOptimizedImage` on image elements with responsive `sizes`.  
- Create small shared components in `/components` with standalone API.  
- Add functional `provide*` in `main.ts` or feature entry points.

> When in doubt: prefer minimal diffs that clearly improve style‑conformance.

---

## 10) Anti‑tasks (do not do without explicit approval)

- Introducing NgModules or class‑based guards/resolvers.  
- Adding state libraries unless justified (Signals first).  
- Changing auth flow (public browse; gated interactions).  
- Re‑theming Material ad‑hoc or overriding Tailwind base.  
- Adding libraries that bloat bundle without clear value.

---

## 11) Run & verify

- **Dev**: `pnpm -w nx serve frontend` (or run defined `serve` target).  
- **Build**: `pnpm -w nx build frontend`.  
- **Tests**: `pnpm -w nx test frontend`.  
- Verify Lighthouse (performance/accessibility/SEO best‑effort on SPA), and no console errors.

---

## 12) Notes specific to lukerykta.io

- Maintain the **dark aesthetic** and **LR branding** consistently.  
- Keep the splash/GSAP sequences performant and optional; content must remain accessible without animation.  
- Buttons/links should look modern (Material or Tailwind patterns) without importing global legacy themes that break cards. Prefer **component‑scoped** styles or Material tokens.

---

## 13) Review checklist (for every change)

- [ ] Standalone, signals, new control flow used where applicable  
- [ ] Auth‑gating respected for interactions  
- [ ] Tailwind classes consistent; no global overrides  
- [ ] `NgOptimizedImage` correct with responsive `sizes`  
- [ ] Lazy/deferred where sensible  
- [ ] Tests updated/added  
- [ ] A11y considerations addressed  
- [ ] Bundle size/regression risk noted in PR

---

By following this guide, agents can confidently modify and extend **lukerykta.io** while staying aligned with **current Angular conventions** and Luke’s architecture preferences.

