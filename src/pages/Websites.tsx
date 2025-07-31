import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Website, WebsiteFormData } from "@/types";
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Eye,
  ArrowLeft,
  Search,
  Filter,
  MoreHorizontal,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const Websites = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<WebsiteFormData>({
    name: "",
    url: "",
    description: "",
    status: "active",
    type: "landing_page",
    analytics_enabled: false,
    seo_optimized: false
  });

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchWebsites();
  }, []);

  const validateForm = (data: WebsiteFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = "Website name is required";
    } else if (data.name.length < 2) {
      errors.name = "Website name must be at least 2 characters";
    }

    if (!data.url.trim()) {
      errors.url = "URL is required";
    } else {
      try {
        new URL(data.url);
      } catch {
        errors.url = "Please enter a valid URL";
      }
    }

    if (data.description && data.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    return errors;
  };

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message);
      }
      
      setWebsites(data || []);
    } catch (error) {
      console.error('Error fetching websites:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch websites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const { error } = await supabase
        .from('websites')
        .insert([{
          ...formData,
          created_by: user?.id
        }]);

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Website added successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchWebsites();
    } catch (error) {
      console.error('Error adding website:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add website",
        variant: "destructive",
      });
    }
  };

  const handleEditWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebsite) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const { error } = await supabase
        .from('websites')
        .update({
          ...formData,
          updated_by: user?.id
        })
        .eq('id', selectedWebsite.id);

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Website updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedWebsite(null);
      resetForm();
      fetchWebsites();
    } catch (error) {
      console.error('Error updating website:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update website",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Website deleted successfully",
      });
      fetchWebsites();
    } catch (error) {
      console.error('Error deleting website:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete website",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (website: Website) => {
    setSelectedWebsite(website);
    setFormData({
      name: website.name,
      url: website.url,
      description: website.description,
      status: website.status,
      type: website.type,
      analytics_enabled: website.analytics_enabled,
      seo_optimized: website.seo_optimized
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      description: "",
      status: "active",
      type: "landing_page",
      analytics_enabled: false,
      seo_optimized: false
    });
    setFormErrors({});
  };

  const handleFormChange = (field: keyof WebsiteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const filteredWebsites = websites.filter(website => {
    const matchesSearch = website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         website.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || website.status === statusFilter;
    const matchesType = typeFilter === "all" || website.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'landing_page': return 'bg-blue-100 text-blue-800';
      case 'booking_site': return 'bg-purple-100 text-purple-800';
      case 'marketing_site': return 'bg-pink-100 text-pink-800';
      case 'portal': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Website Management</h1>
              <p className="text-slate-600 text-xs sm:text-sm">Manage your property websites and landing pages</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Link to="/modules" className="w-full sm:w-auto">
              <Button variant="outline" className="flex items-center justify-center space-x-2 border-2 w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Back to Modules</span>
              </Button>
            </Link>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Add Website</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-lg">Add New Website</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddWebsite} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">Website Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={formErrors.name ? "border-red-500" : ""}
                      placeholder="Enter website name"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="url" className="text-sm">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => handleFormChange('url', e.target.value)}
                      className={formErrors.url ? "border-red-500" : ""}
                      placeholder="https://example.com"
                    />
                    {formErrors.url && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {formErrors.url}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      placeholder="Brief description of the website"
                      className={formErrors.description ? "border-red-500" : ""}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {formErrors.description}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type" className="text-sm">Type</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: any) => handleFormChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landing_page">Landing Page</SelectItem>
                          <SelectItem value="booking_site">Booking Site</SelectItem>
                          <SelectItem value="marketing_site">Marketing Site</SelectItem>
                          <SelectItem value="portal">Portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-sm">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: any) => handleFormChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="analytics"
                        checked={formData.analytics_enabled}
                        onCheckedChange={(checked) => handleFormChange('analytics_enabled', checked)}
                      />
                      <Label htmlFor="analytics" className="text-sm">Analytics Enabled</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="seo"
                        checked={formData.seo_optimized}
                        onCheckedChange={(checked) => handleFormChange('seo_optimized', checked)}
                      />
                      <Label htmlFor="seo" className="text-sm">SEO Optimized</Label>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                    <Button type="submit" className="flex-1">Add Website</Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search websites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status-filter" className="text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type-filter" className="text-sm">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                    <SelectItem value="booking_site">Booking Site</SelectItem>
                    <SelectItem value="marketing_site">Marketing Site</SelectItem>
                    <SelectItem value="portal">Portal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                  className="w-full text-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Websites Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Websites ({filteredWebsites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredWebsites.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No websites found</h3>
                <p className="text-slate-600 mb-4 text-sm">
                  {websites.length === 0 ? "Get started by adding your first website." : "Try adjusting your search or filters."}
                </p>
                {websites.length === 0 && (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Website
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Name</TableHead>
                      <TableHead className="text-sm">URL</TableHead>
                      <TableHead className="text-sm">Type</TableHead>
                      <TableHead className="text-sm">Status</TableHead>
                      <TableHead className="text-sm">Created</TableHead>
                      <TableHead className="text-right text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWebsites.map((website) => (
                      <TableRow key={website.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{website.name}</div>
                            <div className="text-xs text-slate-500">{website.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a 
                            href={website.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                          >
                            <span>Visit</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getTypeColor(website.type)} text-xs`}>
                            {website.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(website.status)} text-xs`}>
                            {website.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-500">
                            {new Date(website.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(website)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWebsite(website.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Website</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditWebsite} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm">Website Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className={formErrors.name ? "border-red-500" : ""}
                placeholder="Enter website name"
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formErrors.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-url" className="text-sm">URL *</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => handleFormChange('url', e.target.value)}
                className={formErrors.url ? "border-red-500" : ""}
                placeholder="https://example.com"
              />
              {formErrors.url && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formErrors.url}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-sm">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                placeholder="Brief description of the website"
                className={formErrors.description ? "border-red-500" : ""}
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formErrors.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type" className="text-sm">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => handleFormChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                    <SelectItem value="booking_site">Booking Site</SelectItem>
                    <SelectItem value="marketing_site">Marketing Site</SelectItem>
                    <SelectItem value="portal">Portal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status" className="text-sm">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => handleFormChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-analytics"
                  checked={formData.analytics_enabled}
                  onCheckedChange={(checked) => handleFormChange('analytics_enabled', checked)}
                />
                <Label htmlFor="edit-analytics" className="text-sm">Analytics Enabled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-seo"
                  checked={formData.seo_optimized}
                  onCheckedChange={(checked) => handleFormChange('seo_optimized', checked)}
                />
                <Label htmlFor="edit-seo" className="text-sm">SEO Optimized</Label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
              <Button type="submit" className="flex-1">Update Website</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Websites; 