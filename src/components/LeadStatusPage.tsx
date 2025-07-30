import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Clock,
  Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLeads, getResponseCategories, updateLead, deleteLead } from "@/lib/supabaseCrud";
import { useToast } from "@/hooks/use-toast";
import LeadDetailsModal from "./LeadDetailsModal";
import ProfileDropdown from "./ProfileDropdown";

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

interface LeadStatusPageProps {
  status: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

const LeadStatusPage = ({ status, title, description, icon, bgColor, textColor }: LeadStatusPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [responseCategories, setResponseCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResponseCategory, setSelectedResponseCategory] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsData, categoriesData] = await Promise.all([
        getLeads(),
        getResponseCategories()
      ]);
      
      // Filter leads by the specific status
      const filteredLeads = leadsData.filter((lead: Lead) => lead.status === status);
      setLeads(filteredLeads);
      setResponseCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate response category stats
  const responseStats = () => {
    const stats: { [key: string]: number } = {};
    responseCategories.forEach(category => {
      stats[category.name] = leads.filter(lead => lead.responsecategory === category.name).length;
    });
    return stats;
  };

  // Filter leads based on search and response category
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (lead.phone || '').includes(searchTerm);
    const matchesResponse = selectedResponseCategory === "all" || lead.responsecategory === selectedResponseCategory;
    return matchesSearch && matchesResponse;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-orange-100 text-orange-800";
      case "Converted": return "bg-green-100 text-green-800";
      case "Cold": return "bg-blue-100 text-blue-800";
      case "Dead": return "bg-red-100 text-red-800";
      case "New": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      await updateLead(updatedLead.id, updatedLead);
      await fetchData();
      setIsEditModalOpen(false);
      setEditingLead(null);
      toast({
        title: "Success",
        description: "Lead updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await deleteLead(leadId);
        await fetchData();
        toast({
          title: "Success",
          description: "Lead deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete lead",
          variant: "destructive"
        });
      }
    }
  };

  const stats = responseStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading {title}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 font-inter-tight">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Student Accommodation Hub</h1>
              <p className="text-sm text-slate-500">Lead & Booking Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${bgColor}`}>
                {icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                <p className="text-slate-600">{description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={`${bgColor} ${textColor} text-sm font-medium`}>
                {leads.length} leads
              </Badge>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 bg-white/80 hover:bg-white shadow-sm border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
          </div>

      {/* Response Category Stats Carousel */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Response Categories</h3>
          <span className="text-sm text-slate-500">Click to filter leads</span>
        </div>
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4 py-4">
              {responseCategories.map((category) => (
                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Card 
                    className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full ${
                      selectedResponseCategory === category.name ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedResponseCategory(
                      selectedResponseCategory === category.name ? "all" : category.name
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">{category.name}</CardTitle>
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">{stats[category.name] || 0}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        {leads.length > 0 ? Math.round(((stats[category.name] || 0) / leads.length) * 100) : 0}% of {title}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg border border-slate-200" />
            <CarouselNext className="right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg border border-slate-200" />
          </Carousel>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search leads by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedResponseCategory} onValueChange={setSelectedResponseCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                {responseCategories.map(category => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-semibold">Lead</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Response</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold">Revenue</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{lead.name}</p>
                        <p className="text-sm text-slate-500">ID: {lead.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{lead.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{lead.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {lead.responsecategory || 'Not specified'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {lead.source || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-slate-900">£{lead.revenue || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-slate-600">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(lead.dateofinquiry).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewLead(lead)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLead(lead)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedLead(null);
          }}
        />
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>
                Update the lead information below. All changes will be saved automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingLead.name}
                    onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editingLead.email}
                    onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue</Label>
                  <Input
                    type="number"
                    value={editingLead.revenue}
                    onChange={(e) => setEditingLead({...editingLead, revenue: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Response Category</Label>
                  <Select 
                    value={editingLead.responsecategory} 
                    onValueChange={(value) => setEditingLead({...editingLead, responsecategory: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {responseCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input
                    value={editingLead.source}
                    onChange={(e) => setEditingLead({...editingLead, source: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingLead.notes}
                  onChange={(e) => setEditingLead({...editingLead, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateLead(editingLead)}>
                  Update Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
        </div>
      </main>
    </div>
  );
};

export default LeadStatusPage; 