import LeadStatusPage from "@/components/LeadStatusPage";
import { UserCheck } from "lucide-react";

const ConvertedLeads = () => {
  return (
    <LeadStatusPage
      status="Converted"
      title="Converted Leads"
      description="Successfully converted leads that became customers"
      icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
      bgColor="bg-emerald-50"
      textColor="text-emerald-700"
    />
  );
};

export default ConvertedLeads; 