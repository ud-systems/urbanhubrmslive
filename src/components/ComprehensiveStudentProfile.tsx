import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  FileText, 
  Edit, 
  Save,
  X,
  CheckCircle, 
  AlertCircle,
  GraduationCap,
  CreditCard,
  Shield,
  Upload,
  Download,
  Eye,
  RefreshCw,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

// File upload configuration
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ComprehensiveStudentProfileProps {
  studentId: number;
}

const ComprehensiveStudentProfile = ({ studentId }: ComprehensiveStudentProfileProps) => {
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    birthday: '',
    age: 0,
    address_line_1: '',
    post_code: '',
    town: '',
    country: '',
    year_of_study: '',
    field_of_study: '',
    deposit_paid: false,
    guarantor_name: '',
    guarantor_email: '',
    guarantor_phone: '',
    // Document URLs and filenames
    utility_bill_url: '',
    utility_bill_filename: '',
    identity_document_url: '',
    identity_document_filename: '',
    bank_statement_url: '',
    bank_statement_filename: '',
    passport_url: '',
    passport_filename: '',
    current_visa_url: '',
    current_visa_filename: ''
  });

  // Validate studentId
  if (!studentId || isNaN(studentId) || studentId <= 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <h3 className="text-red-800 font-medium mb-2">Invalid Student ID</h3>
            <p className="text-red-700">The provided student ID is not valid.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate age from birthday
  const calculateAge = (birthday: string): number => {
    if (!birthday) return 0;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch student profile data
  const fetchStudentProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching student profile for ID:', studentId);
      
      // Get student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentError) {
        console.error('❌ Student data error:', studentError);
        setError(`Failed to load student data: ${studentError.message}`);
        return;
      }
      
      console.log('✅ Student data loaded:', student);
      setStudentData(student);

      // Fetch application data if user_id exists
      if (student.user_id) {
        const { data: application, error: appError } = await supabase
          .from('student_applications')
          .select('*')
          .eq('user_id', student.user_id)
          .single();
        
        if (appError && appError.code !== 'PGRST116') {
          console.error('❌ Application data error:', appError);
        } else if (application) {
          console.log('✅ Application data loaded:', application);
          setApplicationData(application);
          
          // Update form data with application data
          setFormData({
            first_name: application.first_name || student.name || '',
            last_name: application.last_name || '',
            email: application.email || student.email || '',
            mobile: application.mobile || student.phone || '',
            birthday: application.birthday || '',
            age: application.age || calculateAge(application.birthday || ''),
            address_line_1: application.address_line_1 || '',
            post_code: application.post_code || '',
            town: application.town || '',
            country: application.country || '',
            year_of_study: application.year_of_study || '',
            field_of_study: application.field_of_study || '',
            deposit_paid: application.deposit_paid || student.deposit_paid || false,
            guarantor_name: application.guarantor_name || '',
            guarantor_email: application.guarantor_email || '',
            guarantor_phone: application.guarantor_phone || '',
            // Document URLs and filenames
            utility_bill_url: application.utility_bill_url || '',
            utility_bill_filename: application.utility_bill_filename || '',
            identity_document_url: application.identity_document_url || '',
            identity_document_filename: application.identity_document_filename || '',
            bank_statement_url: application.bank_statement_url || '',
            bank_statement_filename: application.bank_statement_filename || '',
            passport_url: application.passport_url || '',
            passport_filename: application.passport_filename || '',
            current_visa_url: application.current_visa_url || '',
            current_visa_filename: application.current_visa_filename || ''
          });
        } else {
          // No application data, use student data only
          setFormData({
            first_name: student.name || '',
            last_name: '',
            email: student.email || '',
            mobile: student.phone || '',
            birthday: '',
            age: 0,
            address_line_1: '',
            post_code: '',
            town: '',
            country: '',
            year_of_study: '',
            field_of_study: '',
            deposit_paid: student.deposit_paid || false,
            guarantor_name: '',
            guarantor_email: '',
            guarantor_phone: '',
            // Document URLs and filenames
            utility_bill_url: '',
            utility_bill_filename: '',
            identity_document_url: '',
            identity_document_filename: '',
            bank_statement_url: '',
            bank_statement_filename: '',
            passport_url: '',
            passport_filename: '',
            current_visa_url: '',
            current_visa_filename: ''
          });
        }
      } else {
        // No user_id, use student data only
        setFormData({
          first_name: student.name || '',
          last_name: '',
          email: student.email || '',
          mobile: student.phone || '',
          birthday: '',
          age: 0,
          address_line_1: '',
          post_code: '',
          town: '',
          country: '',
          year_of_study: '',
          field_of_study: '',
          deposit_paid: student.deposit_paid || false,
          guarantor_name: '',
          guarantor_email: '',
          guarantor_phone: '',
          // Document URLs and filenames
          utility_bill_url: '',
          utility_bill_filename: '',
          identity_document_url: '',
          identity_document_filename: '',
          bank_statement_url: '',
          bank_statement_filename: '',
          passport_url: '',
          passport_filename: '',
          current_visa_url: '',
          current_visa_filename: ''
        });
      }
      
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('An unexpected error occurred while loading the profile.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Handle field updates
  const handleFieldUpdate = async (fieldName: string, value: any) => {
    try {
      setSaving(true);
      
      console.log('🔄 Updating field:', { fieldName, value });
      
      // Calculate age if birthday is being updated
      let updatedValue = value;
      let ageUpdate = null;
      
      if (fieldName === 'birthday' && value) {
        ageUpdate = calculateAge(value);
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        [fieldName]: updatedValue,
        ...(ageUpdate !== null && { age: ageUpdate })
      }));
      
      // Update application data if exists
      if (applicationData) {
        const appUpdateData: any = { 
          [fieldName]: updatedValue, 
          updated_at: new Date().toISOString() 
        };
        
        if (ageUpdate !== null) {
          appUpdateData.age = ageUpdate;
        }
        
        const { error: appError } = await supabase
          .from('student_applications')
          .update(appUpdateData)
          .eq('id', applicationData.id);
        
        if (appError) {
          console.error('❌ Application update error:', appError);
          toast({
            title: "Update Failed",
            description: `Failed to update ${fieldName}: ${appError.message}`,
            variant: "destructive"
          });
          return;
        }
      }

      // Update students table for basic fields
      if (studentData) {
        const fieldMapping: { [key: string]: string } = {
          'first_name': 'name',
          'email': 'email', 
          'mobile': 'phone'
        };
        
        if (fieldMapping[fieldName]) {
          const studentUpdateData = {
            [fieldMapping[fieldName]]: updatedValue,
            updated_at: new Date().toISOString()
          };
          
          const { error: studentError } = await supabase
            .from('students')
            .update(studentUpdateData)
            .eq('id', studentData.id);
          
          if (studentError) {
            console.error('❌ Student update error:', studentError);
            toast({
              title: "Update Failed",
              description: `Failed to update ${fieldName}: ${studentError.message}`,
              variant: "destructive"
            });
            return;
          }
        }
      }
      
      toast({
        title: "Success",
        description: `${fieldName} updated successfully`,
      });
      
    } catch (error) {
      console.error('❌ Update error:', error);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  };

  // File upload functions
  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      setUploadingFile(documentType);
      setUploadProgress(0);
      
      // Validate file
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload JPEG, PNG, or PDF files only",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}_${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `student-documents/${studentId}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('❌ File upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // Update form data
      const urlField = `${documentType}_url`;
      const filenameField = `${documentType}_filename`;
      
      setFormData(prev => ({
        ...prev,
        [urlField]: urlData.publicUrl,
        [filenameField]: file.name
      }));
      
      // Update database
      if (applicationData) {
        const updateData = {
          [urlField]: urlData.publicUrl,
          [filenameField]: file.name,
          updated_at: new Date().toISOString()
        };
        
        const { error: dbError } = await supabase
          .from('student_applications')
          .update(updateData)
          .eq('id', applicationData.id);
        
        if (dbError) {
          console.error('❌ Database update error:', dbError);
          toast({
            title: "Database Update Failed",
            description: dbError.message,
            variant: "destructive"
          });
          return;
        }
      }
      
      toast({
        title: "Upload Successful",
        description: `${documentType.replace('_', ' ')} uploaded successfully`,
      });
      
    } catch (error) {
      console.error('❌ File upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  const handleFileDelete = async (documentType: string) => {
    try {
      const urlField = `${documentType}_url`;
      const filenameField = `${documentType}_filename`;
      const currentUrl = formData[urlField as keyof typeof formData] as string;
      
      if (!currentUrl) return;
      
      // Extract file path from URL
      const urlParts = currentUrl.split('/');
      const filePath = urlParts.slice(-3).join('/'); // Get last 3 parts
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      if (storageError) {
        console.error('❌ File deletion error:', storageError);
        toast({
          title: "Deletion Failed",
          description: storageError.message,
          variant: "destructive"
        });
        return;
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        [urlField]: '',
        [filenameField]: ''
      }));
      
      // Update database
      if (applicationData) {
        const updateData = {
          [urlField]: '',
          [filenameField]: '',
          updated_at: new Date().toISOString()
        };
        
        const { error: dbError } = await supabase
          .from('student_applications')
          .update(updateData)
          .eq('id', applicationData.id);
        
        if (dbError) {
          console.error('❌ Database update error:', dbError);
          toast({
            title: "Database Update Failed",
            description: dbError.message,
            variant: "destructive"
          });
          return;
        }
      }
      
      toast({
        title: "File Deleted",
        description: `${documentType.replace('_', ' ')} deleted successfully`,
      });
      
    } catch (error) {
      console.error('❌ File deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    const requiredFields = [
      'first_name', 'last_name', 'email', 'mobile', 'birthday',
      'address_line_1', 'post_code', 'town', 'country'
    ];
    
    const completedFields = requiredFields.filter(field => 
      formData[field as keyof typeof formData] && 
      String(formData[field as keyof typeof formData]).trim() !== ''
    );
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // Render editable field
  const renderEditableField = (fieldName: string, label: string, type: 'text' | 'email' | 'number' | 'date' = 'text') => {
    const isEditing = editingField === fieldName;
    const value = formData[fieldName as keyof typeof formData];
    
    if (isEditing) {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{label}</Label>
          <Input
            type={type}
            value={String(value)}
            onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
            disabled={saving}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleFieldUpdate(fieldName, formData[fieldName as keyof typeof formData])}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingField(null)}
              disabled={saving}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-600">{label}</Label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingField(fieldName)}
            disabled={saving}
            className="h-6 w-6 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
        </div>
        <div className="text-sm text-slate-900">
          {value ? String(value) : 'Not provided'}
        </div>
      </div>
    );
  };

  // Load data on component mount
  useEffect(() => {
    fetchStudentProfile();
  }, [fetchStudentProfile]);

  // Loading state
  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800">Loading student profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <h3 className="text-red-800 font-medium mb-2">Error Loading Profile</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button 
              onClick={fetchStudentProfile}
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Profile</h2>
          <p className="text-slate-600">Manage student information and documents</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Profile Completion Progress */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">Profile Completion</span>
            <span className="text-sm text-green-700">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
          <p className="text-xs text-green-600 mt-2">
            {profileCompletion < 100 ? 'Complete all required fields to finish profile setup' : 'Profile is complete!'}
          </p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEditableField('first_name', 'First Name')}
            {renderEditableField('last_name', 'Last Name')}
            {renderEditableField('birthday', 'Date of Birth', 'date')}
            {renderEditableField('age', 'Age', 'number')}
            {renderEditableField('country', 'Country')}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-green-600" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEditableField('email', 'Email Address', 'email')}
            {renderEditableField('mobile', 'Mobile Number')}
            {renderEditableField('address_line_1', 'Address Line 1')}
            {renderEditableField('post_code', 'Post Code')}
            {renderEditableField('town', 'Town/City')}
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <span>Academic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEditableField('year_of_study', 'Year of Study')}
            {renderEditableField('field_of_study', 'Field of Study')}
          </div>
        </CardContent>
      </Card>

      {/* Guarantor Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-teal-600" />
            <span>Guarantor Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEditableField('guarantor_name', 'Guarantor Name')}
            {renderEditableField('guarantor_email', 'Guarantor Email', 'email')}
            {renderEditableField('guarantor_phone', 'Guarantor Phone')}
          </div>
        </CardContent>
      </Card>

      {/* Document Management */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-red-600" />
            <span>Document Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Utility Bill */}
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-6 h-6 text-slate-400" />
                <Badge variant={formData.utility_bill_url ? "default" : "secondary"}>
                  {formData.utility_bill_url ? "Uploaded" : "Required"}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-900">Utility Bill</p>
              <p className="text-xs text-slate-500 mb-2">Less than 3 months old</p>
              
              {uploadingFile === 'utility_bill' && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-600">Uploading...</p>
                </div>
              )}
              
              {formData.utility_bill_url ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 truncate">{formData.utility_bill_filename}</p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(formData.utility_bill_url, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(formData.utility_bill_url, '_blank')}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleFileDelete('utility_bill')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    id="utility_bill_upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'utility_bill');
                    }}
                    className="hidden"
                    disabled={uploadingFile === 'utility_bill'}
                  />
                  <label htmlFor="utility_bill_upload">
                    <Button size="sm" variant="outline" className="w-full" disabled={uploadingFile === 'utility_bill'}>
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {/* Identity Document */}
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-6 h-6 text-slate-400" />
                <Badge variant={formData.identity_document_url ? "default" : "secondary"}>
                  {formData.identity_document_url ? "Uploaded" : "Required"}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-900">Identity Document</p>
              <p className="text-xs text-slate-500 mb-2">Passport or driving license</p>
              
              {uploadingFile === 'identity_document' && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-600">Uploading...</p>
                </div>
              )}
              
              {formData.identity_document_url ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 truncate">{formData.identity_document_filename}</p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(formData.identity_document_url, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(formData.identity_document_url, '_blank')}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleFileDelete('identity_document')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    id="identity_document_upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'identity_document');
                    }}
                    className="hidden"
                    disabled={uploadingFile === 'identity_document'}
                  />
                  <label htmlFor="identity_document_upload">
                    <Button size="sm" variant="outline" className="w-full" disabled={uploadingFile === 'identity_document'}>
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {/* Bank Statement */}
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-6 h-6 text-slate-400" />
                <Badge variant={formData.bank_statement_url ? "default" : "secondary"}>
                  {formData.bank_statement_url ? "Uploaded" : "Required"}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-900">Bank Statement</p>
              <p className="text-xs text-slate-500 mb-2">Last 3 months</p>
              
              {uploadingFile === 'bank_statement' && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-600">Uploading...</p>
                </div>
              )}
              
              {formData.bank_statement_url ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 truncate">{formData.bank_statement_filename}</p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(formData.bank_statement_url, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(formData.bank_statement_url, '_blank')}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleFileDelete('bank_statement')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    id="bank_statement_upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'bank_statement');
                    }}
                    className="hidden"
                    disabled={uploadingFile === 'bank_statement'}
                  />
                  <label htmlFor="bank_statement_upload">
                    <Button size="sm" variant="outline" className="w-full" disabled={uploadingFile === 'bank_statement'}>
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      {saving && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-800">Saving changes...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComprehensiveStudentProfile; 