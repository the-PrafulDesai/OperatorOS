import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { OperatorsList } from "@/components/super-admin/operators-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOperators } from "@/lib/data/operators";
export const metadata = { title: "Operators | OperatorOS" };
export default async function OperatorsPage() {
  const operators = await getOperators();
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Platform directory"
        title="Operators"
        description="Manage workspace companies, their administrators, and initial locations."
        actions={
          <Link
            href="/super-admin/operators/new"
            className={cn(buttonVariants(), "h-10")}
          >
            <Plus />
            Create Operator
          </Link>
        }
      />
      <OperatorsList operators={operators} />
    </div>
  );
}
