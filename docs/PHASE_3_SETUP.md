# Phase 3 setup

Phase 1 and Phase 2 must already be applied. Phase 3 adds the public marketplace, customer accounts, atomic holds, simulated payment, bookings, refunds, and notifications.

## Apply and verify

1. Apply `supabase/migrations/202607180003_phase3_booking_marketplace.sql` after the first two migrations.
2. Verify the five tables: `booking_holds`, `bookings`, `payments`, `notifications`, and `booking_status_history`.
3. Verify the booking/payment/notification enums and the functions `validate_booking_request`, `create_booking_hold`, `confirm_simulated_booking`, `release_booking_hold`, `transition_operator_booking`, and `cancel_booking`.
4. Confirm RLS is enabled on every new table. Test that anonymous access returns only approved, active, published locations and their active products.
5. Copy `.env.example` values to `.env.local`; add the demo customer values.
6. Run `npm run bootstrap:demo-customer`, then `npm run dev`.
7. Publish a complete location, browse it anonymously, create a hold as the customer, and simulate payment.
8. Verify the booking in Customer, Operator, and Super Admin views. Test check-in/completion and a separate cancellation/refund.

The hold duration is ten minutes. Tax is a clearly labelled 18% demo calculation. Payments and refunds use the `SIMULATED` provider and never collect payment credentials.

## Troubleshooting

- No listings: confirm location status is `ACTIVE`, review is `APPROVED`, publishing is enabled, and at least one product is `ACTIVE`.
- Email confirmation: either follow the Supabase email confirmation link or configure the demo bootstrap account, which is confirmed by the trusted Admin API.
- Hold expired: return to the product and select again. Expired holds do not reserve capacity.
- Workspace unavailable: another hold or confirmed booking overlaps; choose another time/unit.
- Images missing: verify the `workspace-media` bucket is public and the object path exists.
- RLS denied: verify the user role, active status, location assignment, and migration order.
- Operator cannot see a booking: ensure the operator user has an active `location_members` assignment to the booking location.
- Empty metrics: metrics use real bookings only; confirm the Phase 3 migration and create a simulated booking.
- Duplicate migration objects: do not rerun a partially edited migration. Inspect migration history and reconcile it before retrying; never drop production data.
