import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Studio {
  id: string;
  name: string;
  view: string;
  floor: number;
  occupied: boolean;
  occupiedby: number | null;
  roomGrade: string;
}

interface BulkEditStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudios: Studio[];
  onBulkUpdate: (updates: Partial<Studio>) => void;
  floorOptions: number[];
  roomGrades: any[];
}

const BulkEditStudioModal = ({
  isOpen,
  onClose,
  selectedStudios,
  onBulkUpdate,
  floorOptions,
  roomGrades,
}: BulkEditStudioModalProps) => {
  const [bulkUpdates, setBulkUpdates] = useState<Partial<Studio>>({});
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
          <DialogTitle>Bulk Edit Studios ({selectedStudios.length} selected)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Selected studios:</span>
            {selectedStudios.slice(0, 5).map(studio => (
              <Badge key={studio.id} variant="secondary" className="text-xs">
                {studio.name}
              </Badge>
            ))}
            {selectedStudios.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedStudios.length - 5} more
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select
                value={bulkUpdates.floor?.toString() || ""}
                onValueChange={value => setBulkUpdates(prev => ({ ...prev, floor: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new floor" />
                </SelectTrigger>
                <SelectContent>
                  {floorOptions.map(floor => (
                    <SelectItem key={floor} value={floor.toString()}>{floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>View</Label>
              <Select
                value={bulkUpdates.view || ""}
                onValueChange={value => setBulkUpdates(prev => ({ ...prev, view: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sea">Sea</SelectItem>
                  <SelectItem value="City">City</SelectItem>
                  <SelectItem value="Garden">Garden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room Grade</Label>
              <Select
                value={bulkUpdates.roomGrade || ""}
                onValueChange={value => setBulkUpdates(prev => ({ ...prev, roomGrade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new room grade" />
                </SelectTrigger>
                <SelectContent>
                  {roomGrades.map(grade => (
                    <SelectItem key={grade.id} value={grade.name}>{grade.name}</SelectItem>
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
              {loading ? 'Updating...' : `Update ${selectedStudios.length} Studios`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditStudioModal; 