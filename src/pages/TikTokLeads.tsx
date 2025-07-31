import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { getLeads, updateLead, deleteLead } from '@/lib/supabaseCrud';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  assignedto: string;
  dateofinquiry: string;
  notes: string;
  followupstage: string;
  responsecategory: string;
  roomgrade: string;
  duration: string;
  revenue: number;
  checkin: string;
  checkout: string;
  created_at: string;
  updated_at: string;
}

const TikTokLeads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<any[]>([]);
  const [followUpStages, setFollowUpStages] = useState<any[]>([]);
  const [responseCategories, setResponseCategories] = useState<any[]>([]);
  const [roomGrades, setRoomGrades] = useState<any[]>([]);
  const [stayDurations, setStayDurations] = useState<any[]>([]);

  useEffect(() => {
    fetchLeads();
    fetchOptions();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const allLeads = await getLeads();
      const tiktokLeads = allLeads.filter(lead => 
        lead.source?.toLowerCase().includes('tiktok') ||
        lead.source?.toLowerCase().includes('tiktok ads') ||
        lead.source?.toLowerCase().includes('tiktok marketing')
      );
      setLeads(tiktokLeads);
    } catch (error) {
      console.error('Error fetching TikTok leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch TikTok leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      // Fetch all the options data
      const [
        sources,
        statuses,
        stages,
        categories,
        grades,
        durations
      ] = await Promise.all([
        getLeadSources(),
        getLeadStatus(),
        getFollowUpStages(),
        getResponseCategories(),
        getRoomGrades(),
        getStayDurations()
      ]);

      setLeadSources(sources || []);
      setLeadStatuses(statuses || []);
      setFollowUpStages(stages || []);
      setResponseCategories(categories || []);
      setRoomGrades(grades || []);
      setStayDurations(durations || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setEditModalOpen(true);
  };

  const handleUpdateLead = async (updatedData: Partial<Lead>) => {
    if (!editingLead) return;

    try {
      await updateLead(editingLead.id, updatedData);
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });
      setEditModalOpen(false);
      setEditingLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    try {
      await deleteLead(leadId);
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
      });
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;

    try {
      await Promise.all(selectedLeads.map(id => deleteLead(id)));
      toast({
        title: 'Success',
        description: `${selectedLeads.length} leads deleted successfully`,
      });
      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      console.error('Error bulk deleting leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete some leads',
        variant: 'destructive',
      });
    }
  };

  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-orange-100 text-orange-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    if (source?.toLowerCase().includes('tiktok')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading TikTok leads...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TikTok Leads</h1>
          <p className="text-gray-600 mt-1">Manage leads from TikTok marketing campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {leadStatuses.map(status => (
                  <SelectItem key={status.id} value={status.name}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {leadSources.map(source => (
                  <SelectItem key={source.id} value={source.name}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLeads.length > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedLeads.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>TikTok Leads ({filteredLeads.length})</span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Select</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-2 font-medium">{lead.name}</td>
                    <td className="p-2">
                      <div>
                        <div>{lead.email}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getSourceColor(lead.source)}>
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {lead.revenue ? `£${lead.revenue.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2 text-sm text-gray-500">
                      {new Date(lead.dateofinquiry || lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => navigate(`/lead/${lead.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No TikTok leads found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit TikTok Lead</DialogTitle>
            <DialogDescription>
              Update the lead information below
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <EditLeadForm
              lead={editingLead}
              onSave={handleUpdateLead}
              onCancel={() => setEditModalOpen(false)}
              leadSources={leadSources}
              leadStatuses={leadStatuses}
              followUpStages={followUpStages}
              responseCategories={responseCategories}
              roomGrades={roomGrades}
              stayDurations={stayDurations}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Edit Lead Form Component
interface EditLeadFormProps {
  lead: Lead;
  onSave: (data: Partial<Lead>) => void;
  onCancel: () => void;
  leadSources: any[];
  leadStatuses: any[];
  followUpStages: any[];
  responseCategories: any[];
  roomGrades: any[];
  stayDurations: any[];
}

const EditLeadForm: React.FC<EditLeadFormProps> = ({
  lead,
  onSave,
  onCancel,
  leadSources,
  leadStatuses,
  followUpStages,
  responseCategories,
  roomGrades,
  stayDurations
}) => {
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    source: lead.source || '',
    status: lead.status || '',
    assignedto: lead.assignedto || '',
    notes: lead.notes || '',
    followupstage: lead.followupstage || '',
    responsecategory: lead.responsecategory || '',
    roomgrade: lead.roomgrade || '',
    duration: lead.duration || '',
    revenue: lead.revenue || 0,
    checkin: lead.checkin || '',
    checkout: lead.checkout || '',
    dateofinquiry: lead.dateofinquiry || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {leadSources.map(source => (
                <SelectItem key={source.id} value={source.name}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {leadStatuses.map(status => (
                <SelectItem key={status.id} value={status.name}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="assignedto">Assigned To</Label>
          <Input
            id="assignedto"
            value={formData.assignedto}
            onChange={(e) => setFormData(prev => ({ ...prev, assignedto: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="revenue">Revenue</Label>
          <Input
            id="revenue"
            type="number"
            value={formData.revenue}
            onChange={(e) => setFormData(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="roomgrade">Room Grade</Label>
          <Select value={formData.roomgrade} onValueChange={(value) => setFormData(prev => ({ ...prev, roomgrade: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select room grade" />
            </SelectTrigger>
            <SelectContent>
              {roomGrades.map(grade => (
                <SelectItem key={grade.id} value={grade.name}>
                  {grade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {stayDurations.map(duration => (
                <SelectItem key={duration.id} value={duration.name}>
                  {duration.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="checkin">Check-in Date</Label>
          <Input
            id="checkin"
            type="date"
            value={formData.checkin}
            onChange={(e) => setFormData(prev => ({ ...prev, checkin: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="checkout">Check-out Date</Label>
          <Input
            id="checkout"
            type="date"
            value={formData.checkout}
            onChange={(e) => setFormData(prev => ({ ...prev, checkout: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="dateofinquiry">Date of Inquiry</Label>
          <Input
            id="dateofinquiry"
            type="date"
            value={formData.dateofinquiry}
            onChange={(e) => setFormData(prev => ({ ...prev, dateofinquiry: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="followupstage">Follow-up Stage</Label>
          <Select value={formData.followupstage} onValueChange={(value) => setFormData(prev => ({ ...prev, followupstage: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select follow-up stage" />
            </SelectTrigger>
            <SelectContent>
              {followUpStages.map(stage => (
                <SelectItem key={stage.id} value={stage.name}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="responsecategory">Response Category</Label>
          <Select value={formData.responsecategory} onValueChange={(value) => setFormData(prev => ({ ...prev, responsecategory: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select response category" />
            </SelectTrigger>
            <SelectContent>
              {responseCategories.map(category => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

// Import the missing functions
const getLeadSources = async () => {
  // This would be imported from supabaseCrud.ts
  return [];
};

const getLeadStatus = async () => {
  // This would be imported from supabaseCrud.ts
  return [];
};

const getFollowUpStages = async () => {
  // This would be imported from supabaseCrud.ts
  return [];
};

const getResponseCategories = async () => {
  // This would be imported from supabaseCrud.ts
  return [];
};

const getRoomGrades = async () => {
  // This would be imported from supabaseCrud.ts
  return [];
};

const getStayDurations = async () => {
  // This would be imported from supabaseCrud.ts
  return [];
};

export default TikTokLeads; 