# OperatorOS Phase 2 setup

Phase 1 must already be complete and its migration must have been applied successfully. Phase 2 extends the existing schema without deleting or recreating Phase 1 data.

## Apply the Phase 2 foundation

1. Open the Supabase SQL Editor for the OperatorOS project.
2. Run the complete contents of:

   ```text
   supabase/migrations/202607180002_phase2_operator_management.sql
   ```

3. In **Table Editor**, verify these tables exist:

   - `location_operating_hours`
   - `location_images`
   - `workspace_products`
   - `inventory_units`
   - `product_images`
   - `availability_schedules`

4. Verify Row-Level Security is enabled on every table above.
5. In **Storage**, verify that `workspace-media` exists, is public-read, allows JPG/PNG/WebP, and has a 5 MB file limit.
6. Start the application:

   ```bash
   npm run dev
   ```

## Demo verification

1. Log in as a Phase 1 Operator Admin.
2. Complete the assigned location overview, amenities, hours, policies, and photos.
3. Create a Day Pass, Meeting Room, Dedicated Desk, and Private Cabin.
4. Add individual inventory units to the Dedicated Desk product.
5. Activate each complete product and inspect `/operator/preview`.
6. Submit the location for review from the Publishing tab.
7. Log out and sign in as the Super Admin.
8. Open **Locations**, inspect the submitted listing, and request changes or approve and publish it.

## Storage security model

Marketing media is publicly readable so Phase 3 can use stable public image URLs. Upload, update, and delete operations require an authenticated account and are restricted by Storage RLS to the Operator’s assigned operator/location or product path. The application generates UUID filenames and never includes email addresses in paths.

## Troubleshooting

### Storage upload denied by RLS

Confirm the migration was applied, the user has active operator and location memberships, and the path starts with `operators/{assignedOperatorId}/locations/{assignedLocationId}/` or `operators/{assignedOperatorId}/products/{ownedProductId}/`.

### Unsupported image format

Use JPEG, PNG, or WebP. Other formats are rejected before upload and by the bucket configuration.

### Image is too large

Reduce the file below 5 MB. Both the UI and Storage bucket enforce this limit.

### Location cannot be submitted

Open the Publishing tab and complete every missing checklist item. Completion is recalculated server-side from saved data; it is not stored or accepted from the browser.

### Product cannot be activated

The error identifies missing category requirements. All products need a meaningful description and image. Day Passes and Meeting Rooms need availability; Dedicated Desks need an available inventory unit.

### Operator sees no assigned location

Verify the Phase 1 `location_members` row is active and references the Operator Admin’s authenticated user ID.

### Migration was run before Phase 1

Apply `202607180001_phase1_foundation.sql` first. The Phase 2 migration intentionally stops with an explanatory error when `public.locations` is missing.

### Duplicate migration objects

Do not repeatedly run a partially applied migration. Because the migration is transactional, a failure should roll back. Resolve the reported conflict, confirm the transaction rolled back, then run the complete file once.

Remote migrations and Storage changes are intentionally manual. Final deployment will occur after Phase 3.
