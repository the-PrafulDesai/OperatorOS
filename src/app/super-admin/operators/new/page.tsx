import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateOperatorForm } from "@/components/super-admin/create-operator-form";
import { PageHeader } from "@/components/common/page-header";
import { buttonVariants } from "@/components/ui/button";
export const metadata = { title: "Create Operator | OperatorOS" };
export default function NewOperatorPage() {
  return (
    <div className="page-container max-w-5xl">
      <PageHeader
        eyebrow="Guided provisioning"
        title="Create a new operator"
        description="Set up the company, its primary administrator, and an initial location in one secure workflow."
        actions={
          <Link
            href="/super-admin/operators"
            className={buttonVariants({ variant: "ghost" })}
          >
            <ArrowLeft />
            Back to operators
          </Link>
        }
      />
      <CreateOperatorForm />
    </div>
  );
}
