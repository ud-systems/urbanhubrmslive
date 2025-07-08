import LeadStatusPage from "@/components/LeadStatusPage";
import { Users } from "lucide-react";

const DeadLeads = () => {
  return (
    <LeadStatusPage
      status="Dead"
      title="Dead Leads"
      description="Leads that are no longer interested or have been lost"
      icon={<Users className="w-6 h-6 text-red-600" />}
      bgColor="bg-red-50"
      textColor="text-red-700"
    />
  );
};

export default DeadLeads; 