import LeadStatusPage from "@/components/LeadStatusPage";
import { Users } from "lucide-react";

const ColdLeads = () => {
  return (
    <LeadStatusPage
      status="Cold"
      title="Cold Leads"
      description="Leads that have shown minimal interest or engagement"
      icon={<Users className="w-6 h-6 text-blue-600" />}
      bgColor="bg-blue-50"
      textColor="text-blue-700"
    />
  );
};

export default ColdLeads; 