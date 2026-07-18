# OperatorOS Phase 1 setup

The SQL migration must be applied before the Super Admin bootstrap script is run.

## Local setup

1. Copy `.env.example` to `.env.local` and add the required values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SECRET_KEY=
   SUPER_ADMIN_NAME=
   SUPER_ADMIN_EMAIL=
   SUPER_ADMIN_PASSWORD=
   ```

2. Open the SQL Editor in the linked Supabase project.
3. Run the complete contents of `supabase/migrations/202607180001_phase1_foundation.sql`.
4. Bootstrap the first Super Admin:

   ```bash
   npm run bootstrap:superadmin
   ```

5. Start OperatorOS:

   ```bash
   npm run dev
   ```

6. Open `/login` and sign in with the Super Admin email and password from `.env.local`.
7. Select **Create Operator** and complete the company, administrator, and initial-location form.
8. Save the one-time credentials summary, then log out.
9. Log in using the newly created Operator ID and temporary password. The administrator can also use their email and the same password.
10. Verify that the Operator Dashboard shows only the assigned company and location.

## Security and lifecycle notes

- Passwords are stored only by Supabase Auth.
- Temporary operator passwords are sent directly to Supabase Auth and are never persisted in application tables.
- `SUPABASE_SECRET_KEY` is used only in server-side modules and scripts. Never use a `NEXT_PUBLIC_` prefix for it.
- Initial locations are created as `DRAFT` and remain unpublished until Phase 2.
- Keep `.env.local` out of source control and configure the equivalent environment values in Vercel later.
- Production deployment and final deployment verification will be completed after Phase 3.
