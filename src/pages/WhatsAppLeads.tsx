import LeadSourcePage from "@/components/LeadSourcePage";
import { MessageSquare } from "lucide-react";

const WhatsAppLeads = () => {
  return (
    <LeadSourcePage
      source="WhatsApp"
      title="WhatsApp Leads"
      description="Leads generated through WhatsApp marketing and communication"
      icon={<MessageSquare className="w-6 h-6 text-green-600" />}
      bgColor="bg-green-50"
      textColor="text-green-700"
    />
  );
};

export default WhatsAppLeads; 