# Changelog

All notable changes to this project will be documented in this file.

## [0.16.1] - 2026-10-02

### Added
- Two new contributor learner books ingested (Rich Oral Descriptions, Giving Clear
  Directions — Basic 7); removed stray editor lock files

## [0.16.0] - 2026-10-02

### Added
- Docker support: multi-stage `Dockerfile` (standalone), `docker-compose.yml`
  (Postgres 16 + app + healthchecks + volumes), `.env.docker.example`
- Beginner migration guide (`Docs/MOVE-TO-DOCKER.md`): installs, clone, secrets,
  compose, migrate/seed/ingest, admin promotion, daily use, troubleshooting

## [0.15.1] - 2026-10-02

### Removed
- Withdrew the 27 generated learner books (not learner-facing enough; contributor
  will supply originals) — rows, files and sources deleted, 2 contributor books kept

## [0.15.0] - 2026-10-02

### Added
- Learner Resources section (`/learners` by Basic level, step-by-step reading, download)
- Ingested 2 contributor learner books as real rows with files
- Generated 27 matching learner books from teacher plans (Groq content, contributor styling)
- Reusable ops pipeline: generate → render (.docx) → ingest; runbook documented

## [0.14.0] - 2026-10-01

### Added
- Final subject structure: 7 Primary + 7 JHS subjects (Maths naming), English strands
  (Oral Language, Reading, Grammar, Writing/Composition, Literature) for both levels
- Ingested 29 real Oral Language lesson plans (Basic 7–9) with files + extracted
  descriptions; reusable ops scripts (`ops/structure.ts`, `ops/ingest-lessons.ts`)

### Removed
- All placeholder topics, resources and test packs (local + production)

## [0.13.0] - 2026-10-01

### Changed (scope narrowing)
- Product limited to basic school (Primary + JHS, Basic 1–9) and Ghana only
- Removed SHS/TVET taxonomy, resources and UI entry points; removed Nigeria system
- Seed grows Primary/JHS content only; enum retains SHS/TVET for a future return
- PRD §40 design log records the binding scope

## [0.12.0] - 2026-10-01

### Added
- Pilot content wave: 12 subjects, 20 topics, 43 resources across all levels
- Beginner's deploy guide (`Docs/DEPLOY.md`): Neon, R2, Resend, domain, Vercel, legal

## [0.11.0] - 2026-10-01

### Added
- Deploy readiness: `.env.example` template, standalone build output, PWA icons,
  Terms/Privacy pages (pilot versions), rate limiting on public write endpoints,
  automated backup script (14-day retention, verified with real dump)
- Secrets rotated (auth secret + DB password); runbook updated

## [0.10.0] - 2026-09-29

### Added
- Expanded library seed: 7 subjects, 8 topics, 15 resources across Primary/JHS/SHS/TVET
- Fully idempotent seed (safe to rerun; verified with double-run)
- Production build re-verified with smoke test

## [0.9.0] - 2026-09-29

### Added
- Groq AI integration (`groq-sdk`, server-side only): smarter search (natural language
  to filters with understood-as chips + keyword fallback), cached auto-summaries on
  resource pages, lesson-prep assistant (`/assistant`) with library matches
- Runbook: Groq setup, model rotation and fallback notes

## [0.8.0] - 2026-09-29

### Added
- Staff audit trail across all review/grant/member/announcement actions + admin activity feed
- Education systems: per-country taxonomy scoping (Ghana + Nigeria skeleton), browse switcher
- Pilot launch kit (`Docs/PILOT.md`): schools, training, run cadence, go/no-go criteria
- Runbook: systems, audit and pilot notes

## [0.7.0] - 2026-09-29

### Added
- Collaborative creation: suggest resources for packs, staff review, approved joins pack
- Learning pathways: ordered module sequences with progress, `/learn` shelf + detail
- Announcements completing notification preferences (post, honor mute, restore)
- Country scope on profiles (expansion starter)
- Runbook: collaboration, pathways, announcements, country notes

## [0.6.0] - 2026-09-29

### Added
- Phase 3 starter: moderated teacher community (posts, replies, reports, hide/unhide/delete)
- Analytics dashboard for education organizations (KPIs, top searches/views, signups, flags)
- Institution activity detail (per-member saved/downloads/submissions)
- Runbook: community, analytics and institution notes

## [0.5.0] - 2026-09-26

### Added
- Improved recommendations: scored engine (subjects, saves, views, searches, recency)
  with reasons, saved items excluded, My-learning section on dashboard
- Professional learning: modules with ordered steps, step progress + completion,
  `/learn` shelf, admin create/review
- Publisher flow: signup checkbox + self-upgrade, `/publisher` portal with stats,
  org attribution on submissions and review queue
- Runbook: publisher, learning and recommendations notes

## [0.4.0] - 2026-09-26

### Added
- Pluggable email (`src/lib/email.ts`): Resend when configured, console fallback locally
- R2 private-bucket support via 1-hour presigned URLs (public buckets unchanged)
- Granular notification preferences with per-category enforcement and muted states
- Hybrid access model: FREE/PREMIUM resources, personal entitlements (optional expiry),
  institutions with join codes and member management, download gating with staff bypass,
  access label on dashboard
- Runbook: pilot notes for email, R2, access, notifications

## [0.3.0] - 2026-09-25

### Added
- Hardening: staff file upload (25 MB allowlist, replace supported) on the resource page
- Password reset via BetterAuth (`/reset-password`, dev links to server console)
- Teacher contributions: multipart submit with optional file, review with CONTRIBUTOR badge, My contributions
- Assessment Resource Centre (`/assessments`), teaching strategies shelf (`/strategies`)
- Lesson preparation packs: auto-assembly from approved resources, Learn/Plan/Practice/Check detail, one-click save-all
- Resource-type filters on browse/search; contributor/pack/strategy navigation
- Runbook: reset flow, contributions, packs, curl-based API testing notes

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
