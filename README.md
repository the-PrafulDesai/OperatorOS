# OperatorOS

OperatorOS is a deployment-ready coworking marketplace and operations platform for three roles: Customers discover and book; Operator Admins configure and fulfil assigned-location inventory; Super Admins provision operators, publish supply, and oversee platform financials.

## MVP status

- **Phase 1 — complete:** Supabase authentication, strict roles, Super Admin bootstrap, operator provisioning, and location assignment.
- **Phase 2 — complete:** Location profiles, media, operating hours, Day Pass, Meeting Room, Dedicated Desk, Private Cabin inventory, review, approval, and publishing.
- **Phase 3 — complete in code:** Public discovery, customer signup, live availability, atomic ten-minute holds, booking history, in-app notifications, operator fulfilment, refunds, and Super Admin financial oversight.

The stack is Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui with Base UI, Supabase PostgreSQL/Auth/Storage, React Hook Form, and Zod.

Payments and refunds are simulated. The 18% tax and operator commission breakdown are demo calculations, not production tax or commercial-agreement logic.

## Setup and deployment

Apply the guides in order: [Phase 1](docs/PHASE_1_SETUP.md), [Phase 2](docs/PHASE_2_SETUP.md), and [Phase 3](docs/PHASE_3_SETUP.md). Use the [five-minute demo walkthrough](docs/DEMO_WALKTHROUGH.md) for founder presentation and [deployment guide](docs/DEPLOYMENT.md) for Vercel/Supabase production preparation.

After remote migrations and environment setup, run:

```bash
npm run bootstrap:superadmin
npm run bootstrap:demo-customer
npm run dev
```

The application is ready for manual production migration, demo-data preparation, and Vercel deployment. Production deployment is not implied by the local implementation.
