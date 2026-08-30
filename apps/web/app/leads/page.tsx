import { Download, Plus } from "lucide-react";
import { LeadExplorer } from "@/components/lead-explorer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getLeads } from "@/lib/data";

export const metadata = { title: "Lead Explorer" };

export default async function LeadsPage() {
  const leads = await getLeads();
  return <div className="animate-enter space-y-6"><PageHeader title="Lead Explorer" description="İşletme gücü ve dijital görünürlük açığına göre yüksek potansiyelli fırsatları keşfedin." actions={<><Button variant="secondary"><Download className="size-4"/>CSV dışa aktar</Button><Button><Plus className="size-4"/>Yeni lead</Button></>} /><LeadExplorer leads={leads}/></div>;
}
