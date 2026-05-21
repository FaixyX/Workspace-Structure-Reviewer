const LARAVEL = `### Laravel conventions to enforce
- app/ for application code: Http/Controllers, Models, Providers; routes/ for web.php & api.php.
- Use Eloquent models in app/Models; migrations in database/migrations; factories/seeders alongside.
- Form Requests for validation; Policies/Gates for auth; avoid fat controllers — delegate to Actions/Services.
- config/ for app config; .env for secrets (never commit real .env).
- resources/views for Blade; resources/js|css or Vite for front-end assets.
- Feature tests in tests/Feature; unit tests in tests/Unit.
- PSR-4 autoload under App\\ namespace per composer.json.`;

const SYMFONY = `### Symfony conventions to enforce
- src/ for PHP code: Controller/, Entity/, Repository/, Form/; config/ for packages and routes.
- Thin controllers; business logic in services tagged and injected.
- Doctrine entities in src/Entity; migrations managed explicitly.
- public/index.php as single front controller; templates in templates/.
- routes in config/routes.yaml or attributes on controllers.
- Bundles registered in config/bundles.php; env-specific config/packages/*.`;

const CODEIGNITER = `### CodeIgniter conventions to enforce
- app/Controllers, app/Models, app/Views, app/Config — not mixed with system/.
- Config/Routes.php for routing; Filters for middleware-style logic.
- Database migrations in app/Database/Migrations.
- Keep writable/ out of version control for logs/cache.
- Namespaced controllers under App\\Controllers with PSR-4.`;

const WORDPRESS = `### WordPress conventions to enforce
- Custom code in wp-content/themes/<theme>/ or wp-content/plugins/<plugin>/ — never edit core under wp-admin/wp-includes.
- Child themes for overrides; functions.php minimal — use includes/ or small classes.
- Prefix functions/hooks (e.g. myplugin_) to avoid collisions.
- Use hooks (add_action/add_filter) not direct core hacks.
- Template hierarchy: style.css header, template files named correctly.
- Sanitize/escape output (esc_html, esc_url); use $wpdb or WP APIs for DB.`;

const DRUPAL = `### Drupal conventions to enforce
- Custom modules in modules/custom/<module>/ with .info.yml, .module, src/ Plugin API structure.
- Routing in <module>.routing.yml; services in <module>.services.yml.
- Controllers in src/Controller; entities and forms under src/.
- Configuration in config/install or config/sync — not hard-coded in PHP.
- Twig templates in templates/; avoid logic in templates.
- Use dependency injection; avoid global \\Drupal:: where injectable.`;

const SLIM = `### Slim conventions to enforce
- public/index.php bootstraps AppFactory; routes in routes/web.php or grouped files.
- DI container in dependencies.php / container setup; settings in settings.php.
- Controllers as invokable classes or closures kept thin.
- Middleware for cross-cutting concerns; error middleware for exceptions.
- src/ for domain code; tests mirror structure.`;

const PHP_GENERIC = `### PHP (general) conventions to enforce
- PSR-4 autoload via composer.json; src/ for application code.
- Separate public/ web root from src/ when building custom apps.
- config/ or .env for environment; no secrets in repo.
- tests/ with PHPUnit; mirror namespace under tests/.
- One class per file; match filename to class name.`;

export function getPhpFrameworkGuidelines(
  frameworkId: string,
  _secondaryIds: string[]
): string {
  switch (frameworkId) {
    case 'laravel':
      return LARAVEL;
    case 'symfony':
      return SYMFONY;
    case 'codeigniter':
      return CODEIGNITER;
    case 'wordpress':
      return WORDPRESS;
    case 'drupal':
      return DRUPAL;
    case 'slim':
      return SLIM;
    case 'php':
    default:
      return PHP_GENERIC;
  }
}
