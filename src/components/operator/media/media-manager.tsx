"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { MediaImage } from "@/types/database";
type Props = {
  kind: "location" | "product";
  operatorId: string;
  locationId: string;
  productId?: string;
  images: MediaImage[];
  locked?: boolean;
};
export function MediaManager({
  kind,
  operatorId,
  locationId,
  productId,
  images,
  locked,
}: Props) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const max = kind === "location" ? 8 : 5;
  const endpoint =
    kind === "location"
      ? "/api/operator/location/images"
      : `/api/operator/products/${productId}/images`;
  const choose = (list: FileList | null) => {
    if (!list) return;
    const selected = Array.from(list);
    const invalid = selected.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      toast.error("Use JPG, PNG, or WebP images under 5 MB.");
      return;
    }
    if (images.length + selected.length > max) {
      toast.error(`You can upload up to ${max} images.`);
      return;
    }
    setFiles(selected);
  };
  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    try {
      for (const [index, file] of files.entries()) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const resource =
          kind === "location"
            ? `locations/${locationId}/gallery`
            : `products/${productId}`;
        const path = `operators/${operatorId}/${resource}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
          .from("workspace-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storagePath: path,
            altText: `${kind === "location" ? "Workspace location" : "Workspace product"} photo`,
            isCover: images.length === 0 && index === 0,
            sortOrder: images.length + index,
          }),
        });
        if (!response.ok) {
          await supabase.storage.from("workspace-media").remove([path]);
          const result = await response.json();
          throw new Error(
            result.error?.message ?? "Photo metadata could not be saved.",
          );
        }
      }
      setFiles([]);
      toast.success(
        files.length === 1
          ? "Photo uploaded"
          : `${files.length} photos uploaded`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Upload could not be completed.",
      );
    } finally {
      setUploading(false);
    }
  };
  const update = async (image: MediaImage, patch: Record<string, unknown>) => {
    const response = await fetch(`${endpoint}/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      const result = await response.json();
      toast.error(result.error?.message ?? "Photo could not be updated.");
      return;
    }
    toast.success(patch.isCover ? "Cover photo updated" : "Photo updated");
    router.refresh();
  };
  const remove = async (image: MediaImage) => {
    if (deleting !== image.id) {
      setDeleting(image.id);
      return;
    }
    const response = await fetch(`${endpoint}/${image.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const result = await response.json();
      toast.error(result.error?.message ?? "Photo could not be removed.");
    } else {
      toast.success("Photo removed");
      router.refresh();
    }
    setDeleting(null);
  };
  return (
    <div>
      <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ImagePlus />
        </span>
        <h3 className="mt-3 font-semibold">Add customer-ready photos</h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          JPG, PNG, or WebP. Maximum 5 MB each and {max} photos total.
        </p>
        <input
          ref={picker}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => choose(e.target.files)}
          disabled={locked}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => picker.current?.click()}
            disabled={locked || uploading || images.length >= max}
          >
            <ImagePlus />
            Choose photos
          </Button>
          {files.length > 0 && (
            <Button type="button" onClick={upload} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload {files.length} {files.length === 1 ? "photo" : "photos"}
            </Button>
          )}
        </div>
        {files.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Ready to upload: {files.map((file) => file.name).join(", ")}
          </p>
        )}
      </div>
      {images.length === 0 ? (
        <div className="mt-5 rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          No photos yet. Your first upload becomes the cover photo.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <article
              key={image.id}
              className="overflow-hidden rounded-xl border bg-card"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={image.public_url ?? ""}
                  alt={image.alt_text || "Workspace photo"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {image.is_cover && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-1 text-xs font-medium text-white">
                    <Star className="size-3 fill-current" />
                    Cover
                  </span>
                )}
              </div>
              <div className="space-y-3 p-3">
                <Input
                  defaultValue={image.alt_text ?? ""}
                  aria-label="Photo alt text"
                  placeholder="Describe this photo"
                  onBlur={(e) => {
                    if (e.target.value !== (image.alt_text ?? ""))
                      update(image, { altText: e.target.value });
                  }}
                  disabled={locked}
                />
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Move photo left"
                    disabled={locked || index === 0}
                    onClick={() => update(image, { sortOrder: index - 1 })}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Move photo right"
                    disabled={locked || index === images.length - 1}
                    onClick={() => update(image, { sortOrder: index + 1 })}
                  >
                    <ChevronRight />
                  </Button>
                  {!image.is_cover && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      disabled={locked}
                      onClick={() => update(image, { isCover: true })}
                    >
                      <Star />
                      Set cover
                    </Button>
                  )}
                  <Button
                    type="button"
                    size={deleting === image.id ? "sm" : "icon-sm"}
                    variant="destructive"
                    aria-label="Remove photo"
                    disabled={locked}
                    onClick={() => remove(image)}
                  >
                    {deleting === image.id ? (
                      <>
                        <Check />
                        Confirm
                      </>
                    ) : (
                      <Trash2 />
                    )}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
