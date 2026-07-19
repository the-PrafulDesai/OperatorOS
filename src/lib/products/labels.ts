import type { PricingUnit, WorkspaceProductType } from "@/types/database";
export const productTypeLabel: Record<WorkspaceProductType,string>={DAY_PASS:"Day Pass",MEETING_ROOM:"Meeting Room",DEDICATED_DESK:"Dedicated Desk",PRIVATE_CABIN:"Private Cabin"};
export const pricingUnitLabel: Record<PricingUnit,string>={PER_PERSON_PER_DAY:"per person / day",PER_HOUR:"per hour",PER_MONTH:"per month"};
export const currency=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);
