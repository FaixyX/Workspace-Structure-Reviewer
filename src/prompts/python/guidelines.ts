const DJANGO = `### Django conventions to enforce
- Project layout: manage.py at repo root; apps as packages with models/views/urls/serializers/tests separated.
- Prefer app-based structure (apps/, config/ or project_name/) over dumping logic in a single module.
- settings.py / base settings split by environment; secrets via env vars, not committed.
- urls.py routes to views; use include() for app URL modules; name URL patterns.
- Models in models.py (or models/ package); fat models vs fat views — be consistent.
- Use migrations; never suggest editing migration history casually.
- Templates in templates/<app>/; static in static/ or collected static root.
- For APIs: serializers in serializers.py, views/viewsets separated from URL conf.`;

const FASTAPI = `### FastAPI conventions to enforce
- Entry module (main.py or app/main.py) creates FastAPI(); routers in routers/ or api/ package.
- Use APIRouter per domain; avoid hundreds of routes in one file.
- Pydantic models in schemas.py or schemas/ package; separate from DB models.
- Dependency injection for DB sessions and auth; deps.py or dependencies/ module.
- settings via pydantic-settings / env; no secrets in code.
- Sync vs async: be consistent; do not block event loop in async routes.
- Structure: app/api/, app/core/, app/models/, app/services/ for larger projects.`;

const FLASK = `### Flask conventions to enforce
- Application factory pattern (create_app) for anything beyond a toy app.
- Blueprints per feature area; register in app factory.
- config.py or instance/config for environment-specific settings.
- templates/ and static/ at app level; avoid giant single app.py.
- Extensions (SQLAlchemy, Migrate) initialized in factory, not at import side effects.`;

const STARLETTE = `### Starlette conventions to enforce
- Mount routes in routes.py or api/ package; middleware in dedicated module.
- Lifespan handlers for startup/shutdown resources.
- Keep routing thin; business logic in services/.`;

const PYTHON_GENERIC = `### Python (general) conventions to enforce
- src/ layout or clear top-level package; __init__.py where needed.
- tests/ mirroring package structure; conftest.py for shared fixtures.
- requirements.txt or pyproject.toml at root; virtualenv not committed.
- modules under ~300–400 lines; split when mixing IO, domain, and CLI.`;

const CELERY_NOTE = `### Celery (when present)
- tasks.py per app or tasks/ package; broker URL from env.
- Do not import Django models at module level in tasks without django.setup pattern where needed.`;

export function getFrameworkGuidelines(frameworkId: string, secondaryIds: string[]): string {
  const parts: string[] = [];

  switch (frameworkId) {
    case 'django':
      parts.push(DJANGO);
      break;
    case 'fastapi':
      parts.push(FASTAPI);
      break;
    case 'flask':
      parts.push(FLASK);
      break;
    case 'starlette':
      parts.push(STARLETTE);
      break;
    case 'python':
    default:
      parts.push(PYTHON_GENERIC);
      break;
  }

  if (secondaryIds.includes('celery')) {
    parts.push(CELERY_NOTE);
  }

  return parts.join('\n\n');
}
