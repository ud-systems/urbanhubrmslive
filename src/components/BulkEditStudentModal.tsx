import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: number;
  name: string;
  phone: string;
  email: string;
  room: string;
  checkin: string;
  duration: string;
  revenue: number;
  // Temporarily removed assignedto to test
}

interface BulkEditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
  onBulkUpdate: (updates: Partial<Student>) => void;
  roomGrades: any[];
  stayDurations: any[];
  vacantStudios: any[];
}

const BulkEditStudentModal = ({
  isOpen,
  onClose,
  selectedStudents,
  onBulkUpdate,
  roomGrades,
  stayDurations,
  vacantStudios
}: BulkEditStudentModalProps) => {
  const [bulkUpdates, setBulkUpdates] = useState<Partial<Student>>({});
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
          <DialogTitle>Bulk Edit Students ({selectedStudents.length} selected)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Selected students:</span>
            {selectedStudents.slice(0, 5).map(student => (
              <Badge key={student.id} variant="secondary" className="text-xs">
                {student.name}
              </Badge>
            ))}
            {selectedStudents.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedStudents.length - 5} more
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room</Label>
              <Select
                value={bulkUpdates.room || ""}
                onValueChange={value => setBulkUpdates(prev => ({ ...prev, room: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new room" />
                </SelectTrigger>
                <SelectContent>
                  {roomGrades.map(grade => (
                    <SelectItem key={grade.name} value={grade.name}>{grade.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={bulkUpdates.duration || ""}
                onValueChange={value => setBulkUpdates(prev => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new duration" />
                </SelectTrigger>
                <SelectContent>
                  {stayDurations.map(duration => (
                    <SelectItem key={duration.name} value={duration.name}>{duration.name}</SelectItem>
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
              {loading ? 'Updating...' : `Update ${selectedStudents.length} Students`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditStudentModal; 