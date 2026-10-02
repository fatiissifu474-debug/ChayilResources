# Moving to Your New Laptop (Docker) — Beginner's Guide

Your new laptop has Docker and no IT blocks, so everything gets simpler:
**Postgres and the app each run in a container. One command starts both.**

Read top to bottom, do every step. Anything marked **(me)** I already did here.

## Part A — On the OLD laptop (5 minutes, mostly me)

- [x] **(me)** Project Dockerized: `apps/web/Dockerfile`, `docker-compose.yml`,
  `.env.docker.example` are committed and pushed.
- [ ] **You:** make sure GitHub has everything: open
  `github.com/fatiissifu474-debug/ChayilResources` in a browser and check the newest
  commit is *"Learner Resources section…"* (v0.15.x). If yes, you're backed up. ✅

Optional (only if you want your test accounts + saved items moved too — otherwise
skip; the new laptop starts clean, which I recommend):
- In PowerShell on the old laptop:
  `& "$env:LOCALAPPDATA\Programs\pgsql16\bin\pg_dump.exe" -U chayil -h localhost chayil_resources > "$env:USERPROFILE\Desktop\chayil-backup.sql"`
- Copy that file to the new laptop with a USB stick.

## Part B — On the NEW laptop (~45 minutes)

### 1. Install three things (accept all defaults)
1. **Git:** `winget install --id Git.Git -e` in PowerShell (or download from git-scm.com).
2. **Node.js LTS:** download from nodejs.org → install.
3. **Docker Desktop:** open it once after installing and wait until the whale icon says
   "Engine running". If it asks about WSL2, click through the update — it's automatic.
- ✅ Check: open a NEW PowerShell and run `git --version`, `node --version`,
  `docker --version`, `docker compose version`. All four must answer.

### 2. Get the project
```powershell
cd "$env:USERPROFILE\Documents"
git clone https://github.com/fatiissifu474-debug/ChayilResources.git
cd ChayilResources
```
- ✅ Check: you see `docker-compose.yml` and `apps/` in that folder.

### 3. Create your secrets file (2 minutes)
```powershell
Copy-Item ".env.docker.example" ".env"
notepad ".env"
```
- Replace `DB_PASSWORD=...` with something long and random.
- Generate the auth secret: run
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  and paste the output after `BETTER_AUTH_SECRET=`.
- Paste your Groq key after `GROQ_API_KEY=` (same key as before; find it any time at
  console.groq.com → API Keys).
- Save, close Notepad. `.env` is git-ignored — it can never leak to GitHub.
- ✅ Check: `Get-Content ".env"` shows your three values filled in.

### 4. Start everything (first run takes ~5–10 minutes — totally normal)
```powershell
docker compose up -d --build
docker compose ps
```
- ✅ Check: both `db` and `web` show `Up` / `healthy`.

### 5. Create tables + content (run from the repo folder)
```powershell
cd apps/web
npm install
$env:DATABASE_URL = "postgresql://chayil:PUT-YOUR-DB_PASSWORD-HERE@localhost:5432/chayil_resources"
npx prisma migrate deploy
npx prisma db seed
```
(use the DB_PASSWORD from your `.env`; localhost works because Docker publishes Postgres on 5432)
- ✅ Check: seed prints `Seeded structure: 9 classes, 14 subjects, 10 strands, 3 topics`.

### 6. Attach the real files (lesson plans + learner books)
```powershell
npx tsx ops/ingest-lessons.ts
npx tsx ops/ingest-learner-user.ts
npx tsx ops/generate-learner.ts
npx tsx ops/render-learner.ts
npx tsx ops/ingest-learner-gen.ts
```
(The `.docx` sources travel with git, so they re-attach from the repo folders.
The two contributor books ingest directly; the 27 generated books are re-drafted
from the teacher plans via Groq, then rendered and attached — about 15 minutes.)
- Open **http://localhost:3000** → landing page → Learners → download a book. ✅

### 7. Make yourself admin
Sign up in the app, then:
```powershell
docker compose exec db psql -U chayil -d chayil_resources -c "update \"user\" set role='ADMIN' where email='YOUR-EMAIL';"
```
- ✅ Check: `/admin` opens for you.

## Part C — Daily life on the new laptop

| Do this | Command (in repo folder) |
|---|---|
| Start everything | `docker compose up -d` |
| Stop everything | `docker compose down` |
| See logs | `docker compose logs -f web` (Ctrl+C to exit) |
| Backup the database | `docker compose exec db pg_dump -U chayil chayil_resources > backup.sql` |
| Fresh content reseed | step 5's seed command (idempotent — safe to rerun) |

Your code edits still go in `apps/web`, with `npm run dev` locally if you want hot-reload —
or just rebuild the container: `docker compose up -d --build`.

## Troubleshooting (read this before panicking)

- **`docker: command not found`** → close and reopen PowerShell after installing.
- **Port 5432 already in use** → an old Postgres is running: stop it or change the port
  mapping to `"5433:5432"` in `docker-compose.yml` (and use 5433 in DATABASE_URL).
- **web container keeps restarting** → `docker compose logs web` and send me the output.
- **Forgot what's where** → database lives in the `pgdata` Docker volume, uploads in
  `uploads`. `docker volume ls` proves they exist. They survive restarts and rebuilds.
