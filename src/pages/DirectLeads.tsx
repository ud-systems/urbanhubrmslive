import LeadSourcePage from "@/components/LeadSourcePage";
import { Users } from "lucide-react";

const DirectLeads = () => {
  return (
    <LeadSourcePage
      source="Direct"
      title="Direct Leads"
      description="Leads that came directly through website or referrals"
      icon={<Users className="w-6 h-6 text-purple-600" />}
      bgColor="bg-purple-50"
      textColor="text-purple-700"
    />
  );
};

export default DirectLeads; 