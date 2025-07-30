import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, DollarSign, Building2, Search } from "lucide-react";
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

import { Studio } from "@/types";

interface ConversionModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (studentData: any) => void;
  studios: Studio[];
  studioViews: any[];
}

const ConversionModal = ({ lead, isOpen, onClose, onConvert, studios, studioViews }: ConversionModalProps) => {
  const [durationType, setDurationType] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [dailyRate, setDailyRate] = useState(45);
  const [weeklyRate, setWeeklyRate] = useState(320);
  const [customWeeks, setCustomWeeks] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedStudio, setSelectedStudio] = useState("");
  const [studioSearchTerm, setStudioSearchTerm] = useState("");
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState("");

  // Filter studios that are available and match the lead's room grade
  const availableStudios = studios.filter(studio => 
    !studio.occupied && 
    (studio.roomGrade === lead?.roomgrade || !studio.roomGrade || !lead?.roomgrade)
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDurationType("");
      setCheckInDate("");
      setCheckOutDate("");
      setDailyRate(45);
      setWeeklyRate(320);
      setCustomWeeks("");
      setTotalRevenue(0);
      setSelectedStudio("");
      setStudioSearchTerm("");
      setSelectedPaymentPlan("");
    }
  }, [isOpen]);

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
    console.log('ConversionModal: handleConvert called');
    console.log('Duration type:', durationType);
    console.log('Selected studio:', selectedStudio);
    console.log('Check in date:', checkInDate);
    console.log('Check out date:', checkOutDate);
    
    if (!selectedStudio) {
      console.error('No studio selected');
      return;
    }
    
    const conversionData = {
      leadId: lead?.id,
      name: lead?.name || '',
      phone: lead?.phone || '',
      email: lead?.email || '',
      room: selectedStudio,
      assignedto: selectedStudio,
      checkin: checkInDate || new Date().toISOString().split('T')[0],
      checkout: checkOutDate || checkInDate || new Date().toISOString().split('T')[0],
      duration: durationType === "45-weeks" ? "45 weeks" : durationType === "51-weeks" ? "51 weeks" : durationType === "custom" ? `${customWeeks} weeks` : durationType === "short" ? "short-term" : `${Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
      revenue: totalRevenue || 0,
      duration_weeks: durationType === "45-weeks" ? 45 : durationType === "51-weeks" ? 51 : durationType === "custom" ? parseInt(customWeeks) : null,
      payment_cycles: selectedPaymentPlan ? parseInt(selectedPaymentPlan) : null,
      payment_plan_id: selectedPaymentPlan ? parseInt(selectedPaymentPlan) : null
    };
    
    console.log('ConversionModal: conversionData prepared:', conversionData);
    console.log('ConversionModal: calling onConvert...');
    onConvert(conversionData);
    console.log('ConversionModal: onConvert called successfully');
    
    // Reset form state
    setDurationType("");
    setCheckInDate("");
    setCheckOutDate("");
    setDailyRate(45);
    setWeeklyRate(320);
    setCustomWeeks("");
    setTotalRevenue(0);
    setSelectedStudio("");
    setStudioSearchTerm("");
    setSelectedPaymentPlan("");
    
    onClose();
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Convert Lead
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Convert this lead into a student (long-term) or tourist (short-term) and assign them to a studio.
          </p>
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

          {/* Studio Selection with Search */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studio-search">Select Studio</Label>
              <div className="relative">
                <Input
                  id="studio-search"
                  type="text"
                  placeholder="Search studios..."
                  value={studioSearchTerm}
                  onChange={(e) => setStudioSearchTerm(e.target.value)}
                  className="pr-10"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            
            {studioSearchTerm && (
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {availableStudios
                  .filter(studio => 
                    studio.name.toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                    studio.view.toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                    studio.roomGrade?.toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                    studio.floor.toString().includes(studioSearchTerm)
                  ).length > 0 ? (
                  availableStudios
                    .filter(studio => 
                      studio.name.toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                      studio.view.toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                      studio.roomGrade?.toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                      studio.floor.toString().includes(studioSearchTerm)
                    )
                    .map((studio) => (
                      <div
                        key={studio.id}
                        onClick={() => {
                          console.log('Studio selected:', studio);
                          setSelectedStudio(studio.id);
                          setStudioSearchTerm(studio.name);
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{studio.name}</p>
                            <p className="text-sm text-slate-500">
                              Floor {studio.floor} • {studio.view} • {studio.roomGrade}
                            </p>
                          </div>
                          <Badge variant={studio.occupied ? "destructive" : "secondary"}>
                            {studio.occupied ? "Occupied" : "Available"}
                          </Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-3 text-sm text-slate-500">
                    No studios found matching "{studioSearchTerm}"
                  </div>
                )}
              </div>
            )}
            
            {selectedStudio && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✓ Studio selected: {studios.find(s => s.id === selectedStudio)?.name || selectedStudio}
                </p>
              </div>
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

          {/* Payment Plan Selection - Only for long-term stays */}
          {(durationType === "45-weeks" || durationType === "51-weeks" || durationType === "custom") && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Payment Plan</Label>
              <Select value={selectedPaymentPlan} onValueChange={setSelectedPaymentPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Cycle Plan</SelectItem>
                  <SelectItem value="4">4 Cycle Plan</SelectItem>
                  <SelectItem value="10">10 Cycle Plan</SelectItem>
                </SelectContent>
              </Select>
              {selectedPaymentPlan && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    ✓ Payment plan selected: {selectedPaymentPlan} Cycle Plan
                  </p>
                </div>
              )}
            </div>
          )}

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

          {/* Conversion Type Indicator */}
          {durationType && (
            <div className={`p-4 rounded-lg border ${
              durationType === "short" 
                ? "bg-blue-50 border-blue-200" 
                : "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  durationType === "short" ? "bg-blue-500" : "bg-green-500"
                }`}></span>
                <span className={`font-medium ${
                  durationType === "short" ? "text-blue-900" : "text-green-900"
                }`}>
                  Will create: {durationType === "short" ? "Tourist (Short-term)" : "Student (Long-term)"}
                </span>
              </div>
            </div>
          )}

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
              className={`flex-1 ${
                durationType === "short" 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={!durationType || !selectedStudio || (!checkInDate && durationType !== "45-weeks" && durationType !== "51-weeks") || ((durationType === "45-weeks" || durationType === "51-weeks" || durationType === "custom") && !selectedPaymentPlan)}
            >
              Convert to {durationType === "short" ? "Tourist" : "Student"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversionModal;

