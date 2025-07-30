import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FilePreview from '@/components/ui/file-preview';
import { 
  getAllStudentApplications, 
  reviewApplication,
  getDocumentUrl,
  updateDocumentStatus
} from '@/lib/supabaseCrud';

interface DocumentManagementProps {
  className?: string;
}

interface ApplicationDocument {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  uploaded_at: string;
  review_notes?: string;
}

interface StudentApplication {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  application_documents: ApplicationDocument[];
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ className }) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<ApplicationDocument | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getAllStudentApplications();
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDocument = async (documentId: number, status: 'approved' | 'rejected') => {
    if (!selectedDocument) return;

    try {
      setReviewing(true);
      
      // Update document status in the database
      await updateDocumentStatus(documentId, status, reviewNotes);
      
      // Update local state
      setApplications(prev => prev.map(app => ({
        ...app,
        application_documents: app.application_documents.map(doc => 
          doc.id === documentId 
            ? { ...doc, status, review_notes: reviewNotes }
            : doc
        )
      })));

      setSelectedDocument(null);
      setReviewNotes('');
      
      toast({
        title: 'Success',
        description: `Document ${status} successfully`
      });
    } catch (error) {
      console.error('Error reviewing document:', error);
      toast({
        title: 'Error',
        description: 'Failed to review document',
        variant: 'destructive'
      });
    } finally {
      setReviewing(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    const hasDocumentType = documentTypeFilter === 'all' || 
      app.application_documents.some(doc => doc.document_type === documentTypeFilter);
    
    return matchesSearch && matchesStatus && hasDocumentType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Document Management</h2>
          <p className="text-slate-600">Review and manage student application documents</p>
        </div>
        <Button onClick={loadApplications} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="ucas_statement">UCAS Statement</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {filteredApplications.length} applications
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {application.first_name} {application.last_name}
                      </h3>
                      <p className="text-sm text-slate-600">{application.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(application.status)}>
                      {getStatusIcon(application.status)}
                      <span className="ml-1">{application.status}</span>
                    </Badge>
                    <div className="text-xs text-slate-500">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {formatDate(application.created_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {application.application_documents.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No documents uploaded</p>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Documents</h4>
                    {application.application_documents.map((document) => (
                      <FilePreview
                        key={document.id}
                        document={document}
                        showActions={false}
                        className="border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Review Document</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocument(null)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <FilePreview
                document={selectedDocument}
                showActions={false}
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Review Notes
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes (optional)..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleReviewDocument(selectedDocument.id, 'approved')}
                  disabled={reviewing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReviewDocument(selectedDocument.id, 'rejected')}
                  disabled={reviewing}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement; 