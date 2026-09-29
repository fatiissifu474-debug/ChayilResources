# ChayilResources — Pilot Launch Kit (Phase 5)

How to run a pilot with 3–10 schools before wider release.

## 1. Prepare (1 week before)

- [ ] Production build passes: `npm.cmd run build` in `apps/web` (also runs typecheck).
- [ ] Database backed up: `pg_dump -U chayil -h localhost chayil_resources > pilot-backup-<date>.sql`.
- [ ] Seed review: at least 50 approved resources across the pilot's classes/subjects.
- [ ] Create one institution per pilot school in `/admin` → share each join code.
- [ ] Reviewer accounts: promote 1–2 content leads to REVIEWER (SQL in RUNBOOK §4).
- [ ] Decide premium scope: which packs stay free for the pilot (default: everything free).

## 2. Onboard teachers (training session, 60–90 min)

1. Live demo (15 min): search → preview → save → download for offline use.
2. Guided signup (15 min): everyone creates an account, completes onboarding
   (level/class/subjects), joins their school with the code.
3. Hands-on (30 min): each teacher builds one collection for next week's lessons
   and saves one lesson-prep pack.
4. Feedback: show `/community`, the resource feedback buttons, and the report flow.
5. Take-home: one-page handout — URLs, join code, who to contact.

## 3. Run (4–6 weeks)

- Week 1: check `/admin/analytics` — signups per school, searches with 0 results
  (content gaps → acquisition backlog).
- Week 2–3: review teacher feedback + problem flags; fix or remove poor resources.
- Week 4: run one CPD module together (e.g. Questioning Techniques) in a staff meeting.
- Throughout: reply in `/community` within 48 hours; approve contributions weekly.

## 4. Go / no-go for wider release

- [ ] ≥60% of onboarded teachers active weekly (analytics: views + downloads).
- [ ] Search-to-save rate stable or rising; top-10 searches all return results.
- [ ] Zero unresolved INCORRECT/OUTDATED flags older than 7 days.
- [ ] Teachers report reduced prep time (survey: 5 questions, paper or community post).
- [ ] Backup + restore drill completed; R2/Resend keys ready if leaving the laptop.

## 5. Roles

| Role | Who | Does |
|---|---|---|
| Pilot lead | You | schools, training, go/no-go |
| Content lead (REVIEWER) | 1–2 teachers | review queue, flags, packs |
| School champion | 1 per school | join codes, nudges colleagues |
| Teachers | everyone | use, save, feedback, community |
