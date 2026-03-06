# lukerykta.io

Full-stack Nx monorepo for the lukerykta.io platform, combining Angular, Spring Boot, Playwright, and Terraform in one workspace.

![Nx](https://img.shields.io/badge/Nx-22.5.3-143055?logo=nx&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?logo=angular&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

## Stack

| Area | Tech |
| --- | --- |
| Monorepo | Nx + pnpm |
| Frontend | Angular 21 (standalone APIs, Signals, Angular Material, Tailwind CSS, GSAP) |
| Backend | Spring Boot 3.5, Gradle, JPA, OAuth2, Flyway |
| Data | MySQL 8.4 |
| Testing | Karma/Jasmine (frontend), JUnit/Testcontainers (backend), Playwright (E2E) |
| Infrastructure | Terraform |

## Repository Layout

```text
.
|- frontend/        Angular application
|- backend/         Spring Boot application
|- frontend-e2e/    Playwright tests
|- infra/           Terraform code
|- scripts/         Workspace helper scripts
|- nx.json          Nx workspace configuration
`- package.json     Workspace scripts
```

## Prerequisites

- Node.js LTS
- pnpm
- Java 25 (backend toolchain target)
- Docker (for local MySQL)
- Playwright Chromium (one-time setup):

```bash
pnpm exec playwright install chromium
```

## Quick Start

1. Clone and install dependencies.

```bash
git clone https://github.com/LukeRykta/lukerykta.io.git
cd lukerykta.io
pnpm install
```

2. Start local MySQL.

```bash
docker compose -f backend/docker-compose.yml up -d
```

3. (If needed) provide OAuth client credentials for local auth flows.

```bash
# PowerShell examples
$env:GITHUB_CLIENT_ID="your-client-id"
$env:GITHUB_CLIENT_SECRET="your-client-secret"
$env:GOOGLE_CLIENT_ID="your-client-id"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
```

4. Run frontend and backend in separate terminals.

```bash
pnpm -w nx serve frontend
pnpm -w nx serve backend
```

Frontend runs at `http://localhost:4200`.

## Daily Commands

| Task | Command |
| --- | --- |
| Serve frontend | `pnpm -w nx serve frontend` |
| Build frontend | `pnpm -w nx build frontend` |
| Test frontend | `pnpm -w nx test frontend` |
| Serve backend | `pnpm -w nx serve backend` |
| Build backend | `pnpm -w nx build backend` |
| Test backend | `pnpm -w nx test backend` |
| E2E (all) | `pnpm -w nx e2e frontend-e2e` |
| E2E smoke | `pnpm -w nx e2e frontend-e2e --grep @smoke` |
| Open Playwright report | `pnpm run test:e2e:report` |
| Show Nx project graph | `pnpm -w nx graph` |
| Required push gate | `pnpm -w verify:push` |

## Quality Gate

This workspace enforces a push gate via Husky pre-push hook:

```bash
pnpm -w verify:push
```

It runs backend tests, frontend tests, and E2E smoke coverage. A failing step blocks push.

## Auth and Runtime Notes

- Public pages are browsable without login.
- Interactive mutations (likes/replies/edits) are auth-gated.
- Backend auth uses OAuth2 login and HttpOnly cookie sessions.
- Flyway migrations run on backend startup (`spring.flyway.enabled=true`).

Local dev database defaults:

- Host: `127.0.0.1:3306`
- Database: `appdb`
- User: `appuser`
- Password: `appsecret`

## Infrastructure

```bash
cd infra
terraform init
terraform plan
```

## Contributing

- Use Conventional Commits (for example, `feat(frontend/home): add deferred hero block`).
- Keep PRs small and focused.
- Include context, risk notes, and test evidence.

## License

GPL-3.0. See `LICENSE`.
