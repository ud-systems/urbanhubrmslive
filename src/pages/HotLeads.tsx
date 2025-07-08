import LeadStatusPage from "@/components/LeadStatusPage";
import { TrendingUp } from "lucide-react";

const HotLeads = () => {
  return (
    <LeadStatusPage
      status="Hot"
      title="Hot Leads"
      description="High-priority leads with strong interest and engagement"
      icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
      bgColor="bg-orange-50"
      textColor="text-orange-700"
    />
  );
};

export default HotLeads; 