# Repository Guidelines

## Project Structure & Module Organization
This repository is a Yarn 1 + Turborepo monorepo. `apps/web` contains the Next.js 15 frontend in `src/app`, `src/components`, and `src/lib`. `apps/api` contains the Cloudflare Worker API built with Hono; routes live in `src/routes` and shared server utilities in `src/lib`. Shared domain packages live in `packages/*` (`emotion`, `memory`, `prompt`, `types`). Use `playground/` for local experiments and one-off scripts, not production code.

## Build, Test, and Development Commands
Run commands from the repo root unless a workspace is called out.

- `yarn dev`: starts all available workspace dev tasks through Turbo.
- `yarn build`: runs workspace builds.
- `yarn type-check`: runs `tsc --noEmit` across the repo.
- `yarn lint`: runs configured lint tasks; currently this is mainly useful for `apps/web`.
- `yarn workspace @ai-companion/web dev`: runs the Next.js app locally.
- `yarn workspace @ai-companion/api dev`: runs the Worker locally with Wrangler.
- `cd playground && yarn test`: runs the playground script in `scripts/run.ts`.

Use Node 20+ as declared in the root `package.json`.

## Coding Style & Naming Conventions
TypeScript is the default across apps and packages. Prettier is the source of truth: tabs, `tabWidth: 2`, semicolons, trailing commas, and `printWidth: 120`. Import ordering is enforced with `@trivago/prettier-plugin-sort-imports`, and Tailwind classes are sorted with `prettier-plugin-tailwindcss`.

Follow existing naming patterns: React components in PascalCase, utility modules in kebab-case or descriptive lowercase files such as `format-time.ts`, and package exports through `src/index.ts`.

## Testing Guidelines
There is no full Jest/Vitest suite yet. For every change, run `yarn type-check` and the relevant app command (`yarn workspace @ai-companion/web lint`, local `dev`, or `build`). If you add tests, keep them close to the feature as `*.test.ts` or `*.test.tsx` and add the matching workspace script.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes such as `feat:`, `refactor:`, and `chore:`. Keep commits scoped to one concern and mention the affected workspace when useful.

PRs should include a short summary, impacted paths, required env or schema changes, and verification steps. Add screenshots for `apps/web` UI changes and note API contract or Cloudflare binding changes for `apps/api`.
