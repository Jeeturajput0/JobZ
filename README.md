# JobZ

A dynamic recruitment platform built with Next.js 16 (App Router), TypeScript, MongoDB and Mongoose.
It supports candidates, company workspaces, counseling teams and a super admin with dynamic RBAC.

## Environment

Create `.env.local` in the project root:

```bash
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/jobz"
JWT_SECRET="a-long-random-secret"
```

Optional (used by `npm run seed:platform` to create the first super admin):

```bash
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="a-strong-password"
SUPER_ADMIN_NAME="Super Admin"
```

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## First-time setup

```bash
npm run seed:platform
```

This is idempotent and seeds:
- the permission catalogue,
- default company/counseling system roles,
- default platform settings (matching weights, ATS version, etc.),
- the first super admin (when the `SUPER_ADMIN_*` variables are set).

Then sign in at `/admin/login`. Public self-registration can never create an admin account.

## Dashboards

| Dashboard | URL | Role |
|---|---|---|
| Candidate | `/job-seeker/dashboard` | `jobSeeker` |
| Company admin | `/employer/dashboard` | `employer` |
| Company team | `/company/dashboard` | `companyMember` |
| Counseling team | `/counseling/dashboard` | `counselingAdmin`, `counselingMember` |
| Super admin | `/admin/dashboard` | `admin` |

## Super Admin dashboard

The Super Admin dashboard is a dedicated area under `app/admin/(dashboard)/` with its own
server-side auth guard and sidebar (`components/super-admin/`). The old admin panels in the
shared `[role]` dashboard shell were removed; other role dashboards are unchanged.

It covers: overview (live stats + recent records), companies and verification, counseling
organizations, job seekers, jobs and approvals, applications, partnerships, placements,
super admin team/roles, platform settings and activity logs. Partnership and placement
records are real MongoDB models (`Partnership`, `Placement`) — no records are fabricated and
no revenue is inferred from placement counts.

## Counseling dashboard

A dedicated Counseling Organization dashboard lives at `app/counseling/(dashboard)/` with its own
server-side role guard and sidebar (`components/counseling/`). The old counseling panels in the
shared `[role]` shell were removed. Counseling Admin and Counselor roles are supported with
organization-scoped data and permission checks on every API.

Sections: overview, candidates, team, companies, partnerships, hiring requests, recommendations,
applications, interviews, placements, notifications and settings. Partnerships are required before
recommendations; candidate consent is respected; placements require an explicit joining confirmation.
No revenue is shown or derived.

## Job Seeker profile workspace

Job seekers no longer have a separate dashboard. After login they land on `/profile`, a
profile-centric workspace with an internal sidebar (`components/profile/`). The main navbar shows
their avatar/name with a dropdown linking to every profile section. All former dashboard features
(overview, edit profile, resume, applications, saved jobs, interviews, career progress, counseling,
notifications, settings) are reused from `components/job-seeker/sections.tsx` and served through
`/profile/*`. Old `/job-seeker/*` routes redirect to their new `/profile/*` equivalents. All
candidate self-service APIs require the `jobSeeker` role on the server (`requireJobSeeker`).

## Company dashboard

A dedicated hiring workspace lives at `app/company/(dashboard)/` with its own server-side role
guard and sidebar (`components/company/`). Company admins (`employer`) and team members
(`companyMember`) are scoped to their own company by `assertCompanyScope` on every API. It covers
overview, profile, team, jobs, applicants, pipeline, interviews, hiring requests, counseling
partnerships, recommendations, placements, analytics, notifications and settings. Company-created
jobs are submitted as `draft`/`pending` and only a super admin can approve them.

## Role & permission model

- The JWT carries only `userId` and `role`. Permissions are resolved from MongoDB on every request
  (`lib/session.ts`), so revoking a role or permission takes effect immediately.
- Super admins can create custom roles and assign permissions through `/admin/roles`.
- Company admins can create roles/permissions scoped to their company and can never grant
  permissions they do not hold themselves. Counseling admins have the equivalent scoped controls.
- All company/counseling APIs validate scope against the authenticated account. A companyId sent
  by the client is never trusted on its own.
- Private documents are stored as encrypted-in-transit data URLs and served only through
  authorised APIs; they are never placed under `public/`.

## Main feature areas

- Candidate profile enhancement + dynamic profile completion (`/job-seeker/growth`).
- Verification workflow with reviewer queue (`/counseling/verification`).
- Assessments with question bank, attempts and skill-based results.
- Configurable job matching (`/job-seeker/growth` → Recommended jobs).
- Explainable, rule-based ATS evaluation on application (advisory only; never auto-rejects).
- Direct applications and counseling recommendations with candidate consent.
- Company hiring requests sourced by the counseling team.
- interviews, application timelines, notifications and activity logs.

## Notes

- `POST /api/auth/register` intentionally rejects `role: "admin"`.
- ATS and matching scores are deterministic and use only real profile/job data.
- Where AI is not configured, `aiAssisted` is explicitly `false`.
