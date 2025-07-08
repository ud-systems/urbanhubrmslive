import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, DollarSign, Building2 } from "lucide-react";
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

interface Studio {
  id: string;
  name: string;
  view: string;
  floor: number;
  occupied: boolean;
  occupiedby: number | null;
}

interface ConversionModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (studentData: any) => void;
  studios: Studio[];
}

const ConversionModal = ({ lead, isOpen, onClose, onConvert, studios }: ConversionModalProps) => {
  const [durationType, setDurationType] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [dailyRate, setDailyRate] = useState(45);
  const [weeklyRate, setWeeklyRate] = useState(320);
  const [customWeeks, setCustomWeeks] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedStudio, setSelectedStudio] = useState("");

  const availableStudios = studios.filter(studio => !studio.occupied);

  const calculateRevenue = () => {
    if (durationType === "short" && checkInDate && checkOutDate) {
      const days = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
      setTotalRevenue(days * dailyRate);
    } else if (durationType === "45-weeks") {
      setTotalRevenue(45 * weeklyRate);
    } else if (durationType === "51-weeks") {
      setTotalRevenue(51 * weeklyRate);
    } else if (durationType === "custom" && customWeeks) {
      setTotalRevenue(parseInt(customWeeks) * weeklyRate);
    }
  };

  const handleConvert = () => {
    const studentData = {
      name: lead?.name,
      phone: lead?.phone,
      email: lead?.email,
      room: lead?.roomgrade || "TBD",
      checkin: checkInDate || new Date().toISOString().split('T')[0],
      duration: durationType === "45-weeks" ? "45 weeks" : durationType === "51-weeks" ? "51 weeks" : durationType === "custom" ? `${customWeeks} weeks` : `${Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
      revenue: totalRevenue
    };
    onConvert(studentData);
    onClose();
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Convert Lead to Student
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-2">Lead Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>
                <span className="ml-2 font-medium">{lead.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <span className="ml-2 font-medium">{lead.phone}</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <span className="ml-2 font-medium">{lead.email}</span>
              </div>
              <div>
                <span className="text-slate-500">Room Grade:</span>
                <Badge variant="secondary" className="ml-2">{lead.roomgrade}</Badge>
              </div>
            </div>
          </div>

          {/* Studio Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Studio Assignment</Label>
            <Select value={selectedStudio} onValueChange={setSelectedStudio}>
              <SelectTrigger>
                <SelectValue placeholder="Select available studio" />
              </SelectTrigger>
              <SelectContent>
                {availableStudios.map(studio => (
                  <SelectItem key={studio.id} value={studio.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {studio.name} - {studio.view} (Floor {studio.floor})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableStudios.length === 0 && (
              <p className="text-sm text-red-600">No studios available for assignment</p>
            )}
          </div>

          {/* Duration Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Booking Duration</Label>
            <Select value={durationType} onValueChange={setDurationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short Stay (Daily)</SelectItem>
                <SelectItem value="45-weeks">45 Weeks</SelectItem>
                <SelectItem value="51-weeks">51 Weeks</SelectItem>
                <SelectItem value="custom">Custom Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Inputs */}
          {(durationType === "short" || durationType === "custom") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in Date</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out Date</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {durationType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="weeks">Number of Weeks</Label>
              <Input
                id="weeks"
                type="number"
                placeholder="Enter number of weeks"
                value={customWeeks}
                onChange={(e) => setCustomWeeks(e.target.value)}
              />
            </div>
          )}

          {/* Rate Configuration */}
          <div className="grid grid-cols-2 gap-4">
            {durationType === "short" && (
              <div className="space-y-2">
                <Label htmlFor="daily-rate">Daily Rate (£)</Label>
                <Input
                  id="daily-rate"
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value))}
                />
              </div>
            )}
            {(durationType === "45-weeks" || durationType === "51-weeks" || durationType === "custom") && (
              <div className="space-y-2">
                <Label htmlFor="weekly-rate">Weekly Rate (£)</Label>
                <Input
                  id="weekly-rate"
                  type="number"
                  value={weeklyRate}
                  onChange={(e) => setWeeklyRate(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <Button onClick={calculateRevenue} variant="outline" className="w-full">
            <DollarSign className="w-4 h-4 mr-2" />
            Calculate Total Revenue
          </Button>

          {/* Total Revenue Display */}
          {totalRevenue > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-green-900 font-medium">Total Revenue:</span>
                <span className="text-2xl font-bold text-green-900">£{totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConvert} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!durationType || !selectedStudio || (!checkInDate && durationType !== "45-weeks" && durationType !== "51-weeks")}
            >
              Convert to Student
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversionModal;

