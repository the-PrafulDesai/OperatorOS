import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { InventoryManager } from "@/components/operator/products/inventory-manager";
import { ProductForm } from "@/components/operator/products/product-form";
import { buttonVariants } from "@/components/ui/button";
import { getOwnedProduct } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const profile = await requireRole("OPERATOR_ADMIN");
  const owned = await getOwnedProduct(profile.id, (await params).productId);
  if (!owned)
    return (
      <main className="page-container">
        <div className="surface-card p-10 text-center">
          Workspace product not found.
        </div>
      </main>
    );
  const locked = owned.workspace.location.review_status === "IN_REVIEW";
  return (
    <main className="page-container max-w-5xl">
      <PageHeader
        eyebrow="Product management"
        title={owned.product.name}
        description="Refine customer details, pricing, availability, media, and category-specific inventory."
        actions={
          <Link
            href="/operator/products"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft />
            All products
          </Link>
        }
      />
      {locked ? (
        <div className="surface-card p-10 text-center">
          <LockKeyhole className="mx-auto text-primary" />
          <h2 className="mt-4 text-xl font-semibold">
            Editing paused during review
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The platform team is currently reviewing this location. Product
            editing will reopen after a decision.
          </p>
        </div>
      ) : (
        <>
          <ProductForm
            workspace={{ ...owned.workspace, context: owned.context }}
            product={owned.product}
          />
          {owned.product.type === "DEDICATED_DESK" && (
            <InventoryManager
              productId={owned.product.id}
              units={owned.product.inventory}
            />
          )}
        </>
      )}
    </main>
  );
}
