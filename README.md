# OperatorOS

OperatorOS is a multi-category coworking workspace booking and operations platform. Phase 2 adds complete operator location setup, workspace-product management, protected customer previews, and a Super Admin publishing workflow to the secure Phase 1 foundation.

## Current status — Phase 2 complete

Implemented:

- Super Admin bootstrap, dual-identifier login, protected roles, and operator provisioning
- Guided location overview, amenities, hours, policies, and media management
- Day Pass, Meeting Room, Dedicated Desk, and Private Cabin configuration
- Category-specific pricing, availability, activation, and Dedicated Desk inventory
- Server-calculated publishing readiness and protected customer preview
- Submit-for-review, request-changes, approve, and publish workflow
- Operator-scoped Storage RLS for public-read workspace marketing media
- Responsive, presentation-ready interfaces for desktop and mobile

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui Base UI with the Nova preset, Supabase PostgreSQL/Auth/Storage, `@supabase/ssr`, React Hook Form, and Zod.

## Setup

Start with [docs/PHASE_1_SETUP.md](docs/PHASE_1_SETUP.md), then apply [docs/PHASE_2_SETUP.md](docs/PHASE_2_SETUP.md).

## Roadmap

- **Phase 1 — Foundation:** Authentication, Super Admin, and operator provisioning — complete
- **Phase 2 — Workspace operations:** Location profiles, media, workspace inventory, review, and publishing — complete
- **Phase 3 — Marketplace:** Customer discovery, booking, and deployment readiness — next

Customer booking arrives in Phase 3. Final deployment and production verification will be completed after Phase 3.
