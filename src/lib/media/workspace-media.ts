import "server-only";
export const WORKSPACE_MEDIA_BUCKET = "workspace-media";
export function mediaPublicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base
    ? `${base}/storage/v1/object/public/${WORKSPACE_MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`
    : "";
}
export function isOwnedLocationPath(
  path: string,
  operatorId: string,
  locationId: string,
) {
  return path.startsWith(`operators/${operatorId}/locations/${locationId}/`);
}
export function isOwnedProductPath(
  path: string,
  operatorId: string,
  productId: string,
) {
  return path.startsWith(`operators/${operatorId}/products/${productId}/`);
}
