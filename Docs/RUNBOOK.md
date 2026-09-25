# ChayilResources — Local Runbook (Windows, no Docker, no admin)

All free tools. Laptop-friendly: everything runs as the logged-in user, no virtualization.

## 1. Paths

| What | Path |
|---|---|
| Repo | `Documents\Chayil Resources\ChayilResources` |
| App | `.../apps/web` |
| Node 24 (portable) | `%LOCALAPPDATA%\Programs\node-lts` |
| Git (per-user) | `%LOCALAPPDATA%\Programs\Git\cmd` |
| PostgreSQL 16 (binaries) | `%LOCALAPPDATA%\Programs\pgsql16\bin` |
| Postgres data + log | `%LOCALAPPDATA%\ChayilData\pgdata`, `...\pg.log` |
| Uploads (disk driver) | `apps/web/storage` |

All three `...\Programs` folders are on the user `PATH` (set with `setx`, no admin).
Open a **new terminal** after any PATH change.

## 2. First-time setup (already done on this machine)

1. Git: `winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements`
   (installs per-user, no admin).
2. Node: portable zip from `https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip`
   extracted to `%LOCALAPPDATA%\Programs\node-lts`. (The MSI needs admin; the zip does not.)
   Use `npm.cmd` / `npx.cmd` — PowerShell blocks the `.ps1` shims (execution policy).
3. PostgreSQL: EDB `...-windows-x64-binaries.zip` (PG 16.15) → keep only `bin`, `lib`, `share`
   in `%LOCALAPPDATA%\Programs\pgsql16`.
4. VC++ runtime: the PG binaries need `msvcp140.dll`, `vcruntime140.dll`,
   `vcruntime140_1.dll`. If `initdb` exits silently, copy the 64-bit DLLs from any
   installed app (e.g. under `C:\Program Files\...\`) into `pgsql16\bin` (app-local, no admin).
5. Database: `initdb -D "%LOCALAPPDATA%\ChayilData\pgdata" -U postgres -E UTF8`
   (warns about `trust` auth on local connections — acceptable for a dev laptop).
6. App: `cd apps/web && npm.cmd install`.

## 3. Daily use

```powershell
# Start / stop Postgres (or just log off/on — a scheduled task starts it)
& "$env:LOCALAPPDATA\Programs\pgsql16\bin\pg_ctl.exe" -D "$env:LOCALAPPDATA\ChayilData\pgdata" -l "$env:LOCALAPPDATA\ChayilData\pg.log" start
& "$env:LOCALAPPDATA\Programs\pgsql16\bin\pg_ctl.exe" -D "$env:LOCALAPPDATA\ChayilData\pgdata" stop

# App
cd apps\web
npm.cmd run dev    # http://localhost:3000
npm.cmd run build; npm.cmd run start   # production, same URL
```

Auto-start: `ChayilPostgres.vbs` in your personal Startup folder
(`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`) silently runs
`pg_ctl start` at every logon — no admin, no Task Scheduler involved.
(Tested with a real stop/start cycle.) To disable, delete the `.vbs` file.
(Note: `schtasks /create` needs admin on managed machines — that's why the Startup
folder is used instead.)

## 4. Database workflow

`.env` holds `DATABASE_URL` (local dev password lives only in `apps/web/.env`, which is git-ignored — never reuse it outside this laptop).
Prisma 7 quirks:
- Connection URL lives in `prisma.config.ts`, not `schema.prisma`.
- The CLI does **not** load `.env` into the config: prefix commands —
  `$env:DATABASE_URL="..."; .\node_modules\.bin\prisma.cmd migrate dev`.
- Prisma 7 needs a driver adapter: `src/lib/db.ts` wires `@prisma/adapter-pg`.
- `prisma db seed` runs `prisma.config.ts → migrations.seed`.

```powershell
$env:DATABASE_URL="postgresql://chayil:<db-password>@localhost:5432/chayil_resources"
.\node_modules\.bin\prisma.cmd migrate dev --name <change>
.\node_modules\.bin\prisma.cmd db seed
```

Roles: `TEACHER` (default) → `REVIEWER`/`ADMIN` via SQL file (avoids shell quoting issues —
`user` is reserved; always `update "user" ...`). Never paste double quotes inline; use `psql -f file.sql`.

Backup: `pg_dump -U chayil -h localhost chayil_resources > backup.sql`
Restore: `psql -U chayil -h localhost -d chayil_resources -f backup.sql`

## 5. Test accounts & flows

- Sign up at `/signup` → `/onboarding` (level/class/subject) → `/dashboard`.
- Promote to reviewer for `/admin` (review queue: create draft → approve/reject).
- Teacher loop: browse/search → resource page → save, add to collection, feedback, download.
- `/my-resources`: collections, saved, downloads, recently viewed. `/notifications`: new in your subjects.

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `node/npm/git/psql` not recognized | Open a new terminal (PATH via `setx` applies to new processes) |
| `.ps1 cannot be loaded` | Use the `.cmd` variants (`npm.cmd`, `prisma.cmd`) |
| `initdb`/`psql` silent exit | Missing VC++ DLLs — see §2.4 |
| Prisma `Cannot resolve DATABASE_URL` | Prefix `$env:DATABASE_URL=...` (see §4) |
| Prisma client `driver adapter required` | Import from `@/lib/db`, never `new PrismaClient()` directly |
| Port 5432/3000 busy | `Test-NetConnection 127.0.0.1 -Port <n>`; stop the other process |
| Dashboard count assertions in tests | React 19 renders `({n})` as `(<!-- -->n<!-- -->)` — match loosely |
| `Cannot find module '.prisma/client'` | Run `prisma generate` (after fresh install) |
