import LeadStatusPage from "@/components/LeadStatusPage";
import { Users } from "lucide-react";

const NewLeads = () => {
  return (
    <LeadStatusPage
      status="New"
      title="New Leads"
      description="Recently added leads that need attention"
      icon={<Users className="w-6 h-6 text-green-600" />}
      bgColor="bg-green-50"
      textColor="text-green-700"
    />
  );
};

export default NewLeads; 