import LeadSourcePage from "@/components/LeadSourcePage";
import { Video } from "lucide-react";

const TikTokLeads = () => {
  return (
    <LeadSourcePage
      source="TikTok"
      title="TikTok Leads"
      description="Leads generated through TikTok advertising and content"
      icon={<Video className="w-6 h-6 text-pink-600" />}
      bgColor="bg-pink-50"
      textColor="text-pink-700"
    />
  );
};

export default TikTokLeads; 