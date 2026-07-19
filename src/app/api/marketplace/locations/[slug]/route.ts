import { apiError, apiSuccess } from "@/lib/api-response";
import { getMarketplaceLocation } from "@/lib/data/phase3";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try { const data = await getMarketplaceLocation((await params).slug); return data ? apiSuccess(data) : apiError("NOT_FOUND", "This workspace is not available.", 404); }
  catch { return apiError("SERVER_ERROR", "The workspace could not be loaded.", 500); }
}
