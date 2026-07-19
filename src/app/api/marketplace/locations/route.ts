import { apiError, apiSuccess } from "@/lib/api-response";
import { getMarketplaceLocations } from "@/lib/data/phase3";
import { marketplaceQuerySchema } from "@/validations/marketplace";
export async function GET(request: Request) {
  const url = new URL(request.url); const parsed = marketplaceQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return apiError("INVALID_INPUT", "Check the marketplace filters.", 400);
  try { return apiSuccess(await getMarketplaceLocations(parsed.data)); } catch { return apiError("SERVER_ERROR", "Locations could not be loaded.", 500); }
}
