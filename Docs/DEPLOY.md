# ChayilResources — Going Live, Step by Step (Beginner's Guide)

You can do all of this — no coding. Each step ends with a ✅ check. Do them in order,
and call me (your coding assistant) at any step that confuses you.

What you need before starting: an email address, a phone (for verification codes),
and optionally ~$15/year for a custom domain (Step 4 — skippable; free addresses work).

---

## Step 1 — Production database: Neon (free tier) ✅ DONE 2026-10-01

Project `lucky-silence-73060912` linked in this repo (`.neon/`, git-ignored);
production branch migrated + seeded (1 system, 15 classes, 11 subjects, 37 resources).
Connection string lives in repo-root `.env.local` (git-ignored, never commit).
Key commands: `neon deploy` (apply `neon.ts` policy), Prisma with `$env:DATABASE_URL`
loaded from `.env.local` (see RUNBOOK §4 pattern), `neon mcp` still needs an API key.

Why: your data currently lives only on this laptop. Neon hosts PostgreSQL on the
internet with backups included.

Why: your data currently lives only on this laptop. Neon hosts PostgreSQL on the
internet with backups included.

1. Go to **neon.tech** → Sign Up (use your email or "Continue with GitHub").
2. Click **New Project** → name it `chayil-resources` → region: pick the closest to
   Ghana (e.g. EU West) → Create.
3. Open the project → **Dashboard** → **Connection string** → copy it.
   It looks like: `postgresql://user:password@ep-xxx.aws.neon.tech/chayil?sslmode=require`
4. ✅ Check: the string starts with `postgresql://` and contains `neon.tech`.
5. Send me that string (in chat is fine — we'll move it straight into server settings,
   never into the code). I will connect the app, run the tables + seed content on it,
   and verify it works.

Cost: free tier covers a pilot (plenty of storage and hours).

## Step 2 — File storage: Cloudflare R2 (free tier, zero download fees)

Why: PDFs/videos must live somewhere teachers can download from anywhere.

1. Go to **dash.cloudflare.com** → Sign Up → verify your email.
2. Left menu → **R2 Object Storage** → **Create bucket** → name: `chayil-resources`.
3. **Manage R2 API tokens** → **Create API token** → give it **Object Read & Write** on
   that bucket → copy the **Access Key ID**, **Secret Access Key**, and the
   **endpoint URL** (`https://<account>.r2.cloudflarestorage.com`).
4. ✅ Check: you have 3 values (endpoint, key ID, secret).
5. Send them to me. I will switch the app from local-disk to R2 and test an upload
   and download with you watching.

Cost: free tier (10 GB storage, zero egress fees — downloads are free).

## Step 3 — Email: Resend (for password resets)

Why: without this, "forgot password" links only appear on the server screen.

1. Go to **resend.com** → Sign Up.
2. **API Keys** → **Create API Key** → copy it (`re_...`).
3. Decide the sender address:
   - Quick start (testing): use Resend's test address — emails only reach your own inbox.
   - Pilot (recommended once you have Step 4's domain): **Domains** → Add Domain →
     add the 3 DNS records it shows at your domain provider → wait for ✅ Verified.
4. ✅ Check: API key starts with `re_`.
5. Send me the key (+ your chosen sender address). I will wire it and we'll trigger a
   real reset email to your inbox together.

Cost: free tier (100 emails/day — plenty for a pilot).

## Step 4 — Domain name (optional but recommended, ~$15/year)

Why: `chayilresources.org` builds more trust than `something.vercel.app`.

1. Go to **namecheap.com** (or Cloudflare Registrar) → search a name
   (e.g. `chayilresources.org`) → buy 1 year.
2. Tell me the name. When we deploy (Step 5), I will show you exactly which 2 DNS
   records to add (an `A`/`CNAME` pair) — 5 minutes of copy-paste.
3. ✅ Check: visiting your domain shows the app within 24 hours (usually minutes).

Skip this for now if you like — the free hosting address works for a pilot.

## Step 5 — Hosting the app: Vercel (free tier)

Why: puts the app itself on the internet, always on.

1. Push the repo to GitHub (already done — it's at
   `github.com/fatiissifu474-debug/ChayilResources`).
2. Go to **vercel.com** → Sign Up with GitHub → **Add New Project** →
   **Import** `ChayilResources` → set **Root Directory** to `apps/web`.
3. Before deploying, open **Environment Variables** and add (values from Steps 1–3):
   `DATABASE_URL`, `BETTER_AUTH_SECRET` (ask me to generate one),
   `BETTER_AUTH_URL` (your Vercel address first, domain later),
   `STORAGE_DRIVER=r2` + the 4 R2 values, `RESEND_API_KEY`, `EMAIL_FROM`,
   `GROQ_API_KEY` (same key as local), `PASSWORD_RESET_DEV_LOG=false`.
4. **Deploy** → you get a `*.vercel.app` address.
5. Tell me the address. I will run the database tables + content on Neon and we'll
   click through signup → browse → download together.
6. ✅ Check: the landing page loads, signup works, downloads work.

Cost: free hobby tier covers a pilot.

## Step 6 — Legal review (needs a human lawyer, ~1–2 hours of their time)

I cannot do this part — but I've made it cheap:

1. Send a lawyer: `apps/web/src/app/terms/page.tsx`, `apps/web/src/app/privacy/page.tsx`
   (both labelled pilot drafts) + this question list:
   - Are these sufficient for Ghanaian teachers' personal data?
   - What must change before learners' data could ever appear?
   - Do we need a data-processing addendum for Neon/Resend/R2 as subprocessors?
2. Apply their edits (send me the revised wording — I'll put it in).
3. ✅ Check: pages no longer say "have counsel review".

## Step 7 — Go-live checklist (with me)

- [ ] Fresh admin + reviewer accounts created on the live site (ask me to promote them).
- [ ] Test accounts and probe content removed; real seed content present.
- [ ] Join codes created per pilot school (`/admin` → institutions).
- [ ] One full loop tested live: signup → onboarding → browse → save → download →
      feedback → reset password → real email received.
- [ ] Backup confirmed (Neon automatic backups ON + manual export saved).
- [ ] `Docs/PILOT.md` training scheduled with the first school.

---

**Where you are right now:** code complete through v0.11.0, 43 library resources,
all verified on this laptop. The next human action is **Step 1** (Neon, ~15 minutes).
Tell me when you've created the project and I'll take it from there.
