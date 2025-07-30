import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  roomgrade: string;
  duration: string;
  revenue: number;
  assignedto: string;
  notes: string;
  dateofinquiry: string;
  responsecategory: string;
  followupstage: string;
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Lead[];
  onBulkUpdate: (updates: Partial<Lead>) => void;
  responseCategories: any[];
  followUpStages: any[];
  salespeople: any[];
}

const BulkEditModal = ({ 
  isOpen, 
  onClose, 
  selectedLeads, 
  onBulkUpdate, 
  responseCategories, 
  followUpStages,
  salespeople
}: BulkEditModalProps) => {
  const [bulkUpdates, setBulkUpdates] = useState<Partial<Lead>>({});
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async () => {
    if (Object.keys(bulkUpdates).length > 0) {
      setLoading(true);
      await onBulkUpdate(bulkUpdates);
      setBulkUpdates({});
      setLoading(false);
      onClose();
    }
  };

  const handleClose = () => {
    setBulkUpdates({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Edit Leads ({selectedLeads.length} selected)</DialogTitle>
          <DialogDescription>
            Update multiple leads at once. Leave fields blank to skip changes for that field.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Selected leads:</span>
            {selectedLeads.slice(0, 5).map(lead => (
              <Badge key={lead.id} variant="secondary" className="text-xs">
                {lead.name}
              </Badge>
            ))}
            {selectedLeads.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedLeads.length - 5} more
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={bulkUpdates.status || ""} 
                onValueChange={(value) => setBulkUpdates(prev => ({...prev, status: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Dead">Dead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select 
                value={bulkUpdates.source || ""} 
                onValueChange={(value) => setBulkUpdates(prev => ({...prev, source: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Response Category</Label>
              <Select 
                value={bulkUpdates.responsecategory || ""} 
                onValueChange={(value) => setBulkUpdates(prev => ({...prev, responsecategory: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select response category" />
                </SelectTrigger>
                <SelectContent>
                  {responseCategories.map(option => (
                    <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Follow Up Stage</Label>
              <Select 
                value={bulkUpdates.followupstage || ""} 
                onValueChange={(value) => setBulkUpdates(prev => ({...prev, followupstage: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select follow up stage" />
                </SelectTrigger>
                <SelectContent>
                  {followUpStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select
                value={bulkUpdates.assignedto || ""}
                onValueChange={value => setBulkUpdates(prev => ({ ...prev, assignedto: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespeople.map(user => (
                    <SelectItem key={user.id} value={user.name || user.email}>{user.name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              disabled={Object.keys(bulkUpdates).length === 0 || loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {loading ? 'Updating...' : `Update ${selectedLeads.length} Leads`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditModal;
