# OperatorOS

OperatorOS is a multi-category coworking workspace booking and operations platform. Phase 1 delivers the secure platform foundation: Supabase authentication, Super Admin operations, operator provisioning, and a read-only Operator Admin workspace.

## Phase 1 status

Implemented:

- Super Admin bootstrap and dual-identifier login
- Role-protected Super Admin and Operator Admin experiences
- Real platform metrics, operator directory, location directory, and operator detail
- Guided company, administrator, and initial-location provisioning
- PostgreSQL schema, secure triggers, helper functions, audit logs, and RLS on every Phase 1 table
- Responsive, presentation-ready interfaces for desktop and mobile

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui Base UI with the Nova preset, Supabase PostgreSQL/Auth, `@supabase/ssr`, React Hook Form, and Zod.

## Setup

Follow [docs/PHASE_1_SETUP.md](docs/PHASE_1_SETUP.md) for the database and local setup sequence.

## Roadmap

- **Phase 1 — Foundation:** Authentication, Super Admin, and operator provisioning
- **Phase 2 — Workspace operations:** Location profiles, photos, and workspace inventory
- **Phase 3 — Marketplace:** Customer discovery, booking, and deployment readiness
