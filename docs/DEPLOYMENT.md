# Deployment guide

## Vercel and Supabase

1. Push the repository to GitHub and import it as a new Vercel project.
2. Create or select the production Supabase project.
3. Apply migrations in order: `202607180001`, `202607180002`, then `202607180003`.
4. Add every variable from `.env.example` to Vercel. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS origin. Keep `SUPABASE_SECRET_KEY`, bootstrap passwords, and demo passwords server-only.
5. In Supabase Auth, set Site URL to the production origin and add the production `/login` callback/redirect origin. Add preview origins only when intentionally supported.
6. Verify `workspace-media` is public for reads and its operator write policies remain enabled.
7. Run `npm run bootstrap:superadmin` and, if required for a controlled demo, `npm run bootstrap:demo-customer` from a trusted environment.
8. Deploy through Vercel, then smoke-test anonymous marketplace access, all three role logins, hold expiry, simulated payment, operator status changes, cancellation/refund, and Super Admin metrics.

## Safety and rollback

Never expose the Supabase secret key in a `NEXT_PUBLIC_` variable or client component. Rotate any credential that is accidentally logged. Back up production data before schema changes. Roll back application code independently where possible; database rollback should use a reviewed forward migration rather than dropping booking records. No localhost URL is required in production.
