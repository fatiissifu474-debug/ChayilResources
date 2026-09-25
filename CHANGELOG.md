# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-09-25

### Added
- MVP web app (`apps/web`, Next.js 16) on a local Windows stack — no Docker, no admin needed
- Teacher accounts (BetterAuth), onboarding (level/class/subjects), personalized dashboard
- Discovery: search, curriculum browse (Level → Class → Subject → Resources), resource-type filters
- Resource detail with preview fields, quality badges, save/bookmark, downloads, teacher feedback
- Content admin: review queue with draft creation and approve/reject
- Collections, My Resources (saved/downloads/recently viewed), notifications stub
- Prisma schema (auth, taxonomy, resources, engagement, metrics) with seed data
- Disk/R2 storage abstraction; local Windows runbook (`Docs/RUNBOOK.md`); Postgres auto-start
- All flows verified live against local PostgreSQL

## [0.1.0] - 2026-09-19

### Added
- Initial version: product definition for ChayilResources Teacher Resource Platform
- README describing product vision, users, principles, features, and roadmap
- Product Requirements Document (see `Docs/`)
- Project scaffolding (`VERSION`, `.gitignore`, `CHANGELOG.md`)
