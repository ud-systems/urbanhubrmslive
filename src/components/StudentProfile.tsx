import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building2, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Camera,
  GraduationCap,
  Globe,
  CreditCard,
  Shield,
  Clock,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  academicInfo?: {
    institution: string;
    course: string;
    level: string;
    startDate: string;
    endDate: string;
  };
  documents: Document[];
  profileCompletion: number;
  room?: string;
  assignedto?: string;
  duration?: string;
  revenue?: number;
  checkin?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'passport' | 'visa' | 'academic' | 'financial' | 'other';
  url: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  size: number;
}

const StudentProfile = ({ studentId }: { studentId: number }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('other');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    academicInfo: {
      institution: '',
      course: '',
      level: '',
      startDate: '',
      endDate: ''
    }
  });

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch student data from database
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        throw studentError;
      }

      // Fetch student application data if user_id exists
      let applicationData = null;
      let documentsData = [];
      
      if (studentData.user_id) {
        try {
          const { data: appData } = await supabase
            .from('student_applications')
            .select('*')
            .eq('user_id', studentData.user_id)
            .single();
          
          if (appData) {
            applicationData = appData;
            
            // Fetch documents
            const { data: docs } = await supabase
              .from('application_documents')
              .select('*')
              .eq('application_id', appData.id);
            
            if (docs) {
              documentsData = docs;
            }
          }
        } catch (appError) {
          console.warn('Could not fetch application data:', appError);
        }
      }

      // Build profile from real data
      const profile: StudentProfile = {
        id: studentData.id,
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone || '',
        dateOfBirth: applicationData?.birthday || '',
        nationality: applicationData?.country || '',
        passportNumber: '', // Not in current schema
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        academicInfo: {
          institution: '',
          course: applicationData?.field_of_study || '',
          level: applicationData?.year_of_study || '',
          startDate: '',
          endDate: ''
        },
        documents: documentsData.map(doc => ({
          id: doc.id.toString(),
          name: doc.filename,
          type: doc.document_type as any,
          url: doc.file_url || '#',
          uploadedAt: doc.uploaded_at,
          status: doc.status,
          size: doc.file_size || 0
        })),
        profileCompletion: calculateProfileCompletion(applicationData, documentsData),
        room: studentData.room || '',
        assignedto: studentData.assignedto || '',
        duration: studentData.duration || '',
        revenue: studentData.revenue || 0,
        checkin: studentData.checkin || ''
      };

      setProfile(profile);
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth || '',
        nationality: profile.nationality || '',
        passportNumber: profile.passportNumber || '',
        emergencyContact: profile.emergencyContact || { name: '', phone: '', relationship: '' },
        academicInfo: profile.academicInfo || { institution: '', course: '', level: '', startDate: '', endDate: '' }
      });
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Update student data in database
      const { error: studentError } = await supabase
        .from('students')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        })
        .eq('id', studentId);

      if (studentError) {
        throw studentError;
      }

      // Update application data if exists
      if (profile?.user_id) {
        const { error: appError } = await supabase
          .from('student_applications')
          .update({
            first_name: formData.name.split(' ')[0] || '',
            last_name: formData.name.split(' ').slice(1).join(' ') || '',
            birthday: formData.dateOfBirth,
            country: formData.nationality,
            field_of_study: formData.academicInfo.course,
            year_of_study: formData.academicInfo.level
          })
          .eq('user_id', profile.user_id);

        if (appError) {
          console.warn('Could not update application data:', appError);
        }
      }
      
      // Refresh profile data
      await fetchStudentProfile();
      
      setIsEditMode(false);
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const calculateProfileCompletion = (applicationData: any, documentsData: any[]) => {
    if (!applicationData) return 0;
    
    // Define all required fields
    const requiredFields = [
      'first_name', 'last_name', 'birthday', 'age', 'ethnicity', 'gender', 'ucas_id', 'country',
      'email', 'mobile', 'address_line_1', 'address_line_2', 'post_code', 'town',
      'year_of_study', 'field_of_study', 'is_disabled', 'is_smoker', 'medical_requirements', 'entry_into_uk',
      'payment_installments', 'data_consent'
    ];
    
    // Count filled fields
    const filledFields = requiredFields.filter(field => {
      const value = applicationData[field];
      return value !== null && value !== undefined && value !== '' && value !== false;
    }).length;
    
    // Add document completion (assuming 3 required documents = 10% each)
    const documentCompletion = Math.min(documentsData.length * 10, 30); // Max 30% for documents
    
    // Calculate total completion
    const fieldCompletion = (filledFields / requiredFields.length) * 70; // 70% for fields
    const totalCompletion = Math.round(fieldCompletion + documentCompletion);
    
    return Math.min(totalCompletion, 100);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      // TODO: Replace with actual file upload API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument: Document = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: documentType as any,
        url: '#',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'pending',
        size: selectedFile.size
      };

      setProfile(prev => prev ? {
        ...prev,
        documents: [...prev.documents, newDocument]
      } : null);

      setSelectedFile(null);
      setDocumentType('other');
      setIsUploadDialogOpen(false);
      toast({ title: 'Success', description: 'Document uploaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload document', variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // TODO: Replace with actual API call
      setProfile(prev => prev ? {
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId)
      } : null);
      
      toast({ title: 'Success', description: 'Document deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'passport': return 'bg-blue-100 text-blue-800';
      case 'visa': return 'bg-green-100 text-green-800';
      case 'academic': return 'bg-purple-100 text-purple-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Profile not found</h3>
        <p className="text-slate-600">The requested student profile could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-2xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                <p className="text-slate-600">{profile.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="bg-white/50">
                    <Building2 className="w-3 h-3 mr-1" />
                    {profile.room} Studio
                  </Badge>
                  <Badge variant="outline" className="bg-white/50">
                    <Clock className="w-3 h-3 mr-1" />
                    {profile.duration}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-sm text-slate-600">Profile Completion</p>
                <p className="text-2xl font-bold text-slate-900">{profile.profileCompletion}%</p>
              </div>
              <Progress value={profile.profileCompletion} className="w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Alert */}
      {profile.profileCompletion < 100 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Complete Your Profile</p>
                <p className="text-sm text-yellow-700">
                  Please complete your profile to ensure all information is up to date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditMode ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{profile.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.dateOfBirth || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.nationality}
                      onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.nationality || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Passport Number</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.passportNumber}
                      onChange={(e) => setFormData({...formData, passportNumber: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.passportNumber || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {isEditMode && (
                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-red-600" />
                <span>Emergency Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: {...formData.emergencyContact, name: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.emergencyContact?.name || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: {...formData.emergencyContact, phone: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.emergencyContact?.phone || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.emergencyContact?.relationship || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <span>Academic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.academicInfo.institution}
                      onChange={(e) => setFormData({
                        ...formData, 
                        academicInfo: {...formData.academicInfo, institution: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.academicInfo?.institution || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.academicInfo.course}
                      onChange={(e) => setFormData({
                        ...formData, 
                        academicInfo: {...formData.academicInfo, course: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.academicInfo?.course || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  {isEditMode ? (
                    <Select
                      value={formData.academicInfo.level}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        academicInfo: {...formData.academicInfo, level: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-slate-900">{profile.academicInfo?.level || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={formData.academicInfo.startDate}
                      onChange={(e) => setFormData({
                        ...formData, 
                        academicInfo: {...formData.academicInfo, startDate: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="text-slate-900">{profile.academicInfo?.startDate || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span>Documents</span>
              </CardTitle>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Select a document to upload. Supported formats: PDF, DOC, DOCX, JPG, PNG.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="academic">Academic Certificate</SelectItem>
                          <SelectItem value="financial">Financial Statement</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>File</Label>
                      <Input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleFileUpload} 
                        disabled={!selectedFile || uploadingFile}
                        className="flex-1"
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsUploadDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.documents.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No documents uploaded</p>
                </div>
              ) : (
                profile.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getDocumentTypeColor(doc.type)}>
                            {doc.type}
                          </Badge>
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatFileSize(doc.size)} • {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{doc.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDocument(doc.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Documents</span>
                <span className="font-medium">{profile.documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Approved</span>
                <span className="font-medium text-green-600">
                  {profile.documents.filter(d => d.status === 'approved').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {profile.documents.filter(d => d.status === 'pending').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile; 