const NEXTJS = `### Next.js conventions to enforce
- App Router: app/ with layout.tsx, page.tsx, loading.tsx, error.tsx; route groups (folder) and dynamic [param] segments.
- Pages Router (legacy): pages/ only when App Router is not used — do not mix patterns blindly.
- Server vs Client Components: 'use client' only when needed; keep data fetching in Server Components where possible.
- Colocate components under app/ or components/; shared UI in components/ui.
- API routes: app/api/.../route.ts (App Router) or pages/api (Pages).
- next.config at root; env via NEXT_PUBLIC_ prefix for client-exposed vars.
- File names: kebab-case for routes/folders; PascalCase for React components.`;

const REACT = `### React conventions to enforce
- src/ with components/, hooks/, pages/ or features/ — feature folders for larger apps.
- One component per file; PascalCase filenames for components (UserCard.tsx).
- Custom hooks: useXxx in hooks/; prefix hook names with use.
- Keep components presentational vs container separation where useful.
- Avoid prop drilling — context or composition for shared state.
- Vite/CRA: entry at main.tsx; public assets in public/.
- Prefer function components; consistent named vs default exports per project.`;

const VUE = `### Vue conventions to enforce
- Single-File Components: .vue with <script setup> preferred in Vue 3.
- components/, composables/ (useXxx.ts), views/ or pages/.
- PascalCase for component files; kebab-case in templates.
- Pinia stores in stores/; avoid giant global mixins.
- vue-router: views in views/ or pages/; route names explicit.`;

const NUXT = `### Nuxt conventions to enforce
- pages/ for file-based routing; layouts/ for layout wrappers.
- composables/ for auto-imported composables (useXxx).
- server/api/ for Nitro API routes; server/ for server-only utils.
- nuxt.config.ts at root; runtimeConfig for secrets.
- components/ auto-imported — still group by feature for large apps.`;

const ANGULAR = `### Angular conventions to enforce
- NgModules or standalone components — pick one style per app, not mixed randomly.
- Feature modules/folders: feature/*.component.ts, *.service.ts, *.module.ts.
- Services injectable; smart/dumb component split.
- angular.json and tsconfig.app.json at root; src/app/ bootstrap.
- Reactive forms vs template-driven — be consistent.
- Lazy-loaded routes for feature areas.`;

const EXPRESS = `### Express conventions to enforce
- src/routes/, src/controllers/, src/services/, src/middlewares/ separation.
- app.ts vs server.ts: create app in one, listen in other.
- Routers per domain: routes/users.ts mounted with app.use('/users', router).
- No business logic in route handlers — delegate to services.
- async errors wrapped with middleware; central error handler.
- config/ for env-based configuration.`;

const NESTJS = `### NestJS conventions to enforce
- modules/, controllers/, services/, dto/, entities/ per feature (users/users.module.ts).
- DTOs with class-validator; pipes for validation.
- Thin controllers; logic in services; repositories for data access.
- Global modules sparingly; feature modules import what they need.
- main.ts bootstraps NestFactory; ConfigModule for env.`;

const SVELTE = `### Svelte / SvelteKit conventions to enforce
- SvelteKit: src/routes/ file-based routing; +page.svelte, +layout.svelte, +server.ts.
- lib/ for shared components; components/ alias.
- Stores in lib/stores or dedicated stores/ — typed writable/readable.
- .svelte files: script, style, markup sections clear; props via export let.
- Server hooks in hooks.server.ts when using SvelteKit.`;

const NODE_GENERIC = `### Node.js / TypeScript (general) conventions to enforce
- src/ entry (index.ts); separate config/, types/, utils/.
- package.json type module vs commonjs — be consistent.
- ESLint + TypeScript strict; shared types in types/ or @types.
- tests/ mirror src/ (unit vs e2e folders).
- No god index.ts — split by domain.`;

export function getJavaScriptFrameworkGuidelines(
  frameworkId: string,
  _secondaryIds: string[]
): string {
  switch (frameworkId) {
    case 'nextjs':
      return NEXTJS;
    case 'react':
      return REACT;
    case 'vue':
      return VUE;
    case 'nuxt':
      return NUXT;
    case 'angular':
      return ANGULAR;
    case 'express':
      return EXPRESS;
    case 'nestjs':
      return NESTJS;
    case 'svelte':
      return SVELTE;
    case 'node':
    default:
      return NODE_GENERIC;
  }
}
