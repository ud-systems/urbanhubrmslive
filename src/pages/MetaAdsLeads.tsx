import LeadSourcePage from "@/components/LeadSourcePage";
import { Facebook } from "lucide-react";

const MetaAdsLeads = () => {
  return (
    <LeadSourcePage
      source="Meta Ads"
      title="Meta Ads Leads"
      description="Leads generated through Facebook and Instagram advertising"
      icon={<Facebook className="w-6 h-6 text-blue-600" />}
      bgColor="bg-blue-50"
      textColor="text-blue-700"
    />
  );
};

export default MetaAdsLeads; 