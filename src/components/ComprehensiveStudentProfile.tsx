import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building2, 
  FileText, 
  Edit, 
  Save,
  X,
  CheckCircle, 
  AlertCircle,
  GraduationCap,
  Globe,
  CreditCard,
  Shield,
  Star,
  Upload,
  Download,
  Trash2,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { updateStudentWithAudit, createAuditTrailEntry } from "@/lib/supabaseCrud";
import { StudentApplication } from "@/types";
import FileUpload from "@/components/ui/file-upload";

interface ComprehensiveStudentProfileProps {
  studentId: number;
}

const ComprehensiveStudentProfile = ({ studentId }: ComprehensiveStudentProfileProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [applicationData, setApplicationData] = useState<StudentApplication | null>(null);
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  
  // Form data matching ALL application form fields
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    birthday: '',
    age: 0,
    ethnicity: '',
    gender: '',
    ucas_id: '',
    country: '',
    
    // Contact Information
    email: '',
    mobile: '',
    address_line_1: '',
    address_line_2: '',
    post_code: '',
    town: '',
    
    // Academic Information
    year_of_study: '',
    field_of_study: '',
    
    // Additional Information
    is_disabled: false,
    is_smoker: false,
    medical_requirements: '',
    entry_into_uk: '',
    
    // Payment Information
    wants_installments: false,
    selected_installment_plan: '',
    payment_installments: '',
    data_consent: false,
    deposit_paid: false,

    // Guarantor Information
    guarantor_name: '',
    guarantor_email: '',
    guarantor_phone: '',
    guarantor_date_of_birth: '',
    guarantor_relationship: '',

    // Document Uploads
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

  const fetchStudentProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentError) throw studentError;
      setStudentData(student);

      const calculateAge = (birthday: string) => {
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

      // Fetch application data if user_id exists
      if (student.user_id) {
        const { data: application, error: appError } = await supabase
          .from('student_applications')
          .select('*')
          .eq('user_id', student.user_id)
          .single();
        
        if (application) {
          setApplicationData(application);
          const newFormData = {
            // ✅ FIXED: Use consistent field mapping
            first_name: application.first_name || student.name || '',
            last_name: application.last_name || '',
            birthday: application.birthday || '',
            age: application.age || calculateAge(application.birthday || ''),
            ethnicity: application.ethnicity || '',
            gender: application.gender || '',
            ucas_id: application.ucas_id || '',
            country: application.country || '',
            // ✅ FIXED: Use application data first, fallback to student data
            email: application.email || student.email || '',
            mobile: application.mobile || student.phone || '',
            address_line_1: application.address_line_1 || '',
            address_line_2: application.address_line_2 || '',
            post_code: application.post_code || '',
            town: application.town || '',
            year_of_study: application.year_of_study || '',
            field_of_study: application.field_of_study || '',
            is_disabled: application.is_disabled || false,
            is_smoker: application.is_smoker || false,
            medical_requirements: application.medical_requirements || '',
            entry_into_uk: application.entry_into_uk || '',
            wants_installments: application.wants_installments || false,
            selected_installment_plan: application.selected_installment_plan || '',
            payment_installments: application.payment_installments || '',
            data_consent: application.data_consent || false,
            deposit_paid: application.deposit_paid || student.deposit_paid || false,
            guarantor_name: application.guarantor_name || '',
            guarantor_email: application.guarantor_email || '',
            guarantor_phone: application.guarantor_phone || '',
            guarantor_date_of_birth: application.guarantor_date_of_birth || '',
            guarantor_relationship: application.guarantor_relationship || '',
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
          };
          
          setFormData(newFormData);

          // Fetch documents
          const { data: docs } = await supabase
            .from('application_documents')
            .select('*')
            .eq('application_id', application.id);
          
          if (docs) setDocumentsData(docs);
        } else {
          // Create application record if it doesn't exist
          const newApplication = {
            user_id: student.user_id,
            first_name: student.name || '',
            last_name: '',
            email: student.email || '',
            mobile: student.phone || '',
            deposit_paid: student.deposit_paid || false,
            current_step: 1,
            is_complete: false
          };

          const { data: createdApplication, error: createError } = await supabase
            .from('student_applications')
            .insert([newApplication])
            .select()
            .single();

          if (createError) {
            console.error('Error creating application:', createError);
          } else {
            setApplicationData(createdApplication);
            const newFormData = {
              first_name: createdApplication.first_name || '',
              last_name: '',
              birthday: '',
              age: 0,
              ethnicity: '',
              gender: '',
              ucas_id: '',
              country: '',
              email: createdApplication.email || '',
              mobile: createdApplication.mobile || '',
              address_line_1: '',
              address_line_2: '',
              post_code: '',
              town: '',
              year_of_study: '',
              field_of_study: '',
              is_disabled: false,
              is_smoker: false,
              medical_requirements: '',
              entry_into_uk: '',
              wants_installments: false,
              selected_installment_plan: '',
              payment_installments: '',
              data_consent: false,
              deposit_paid: createdApplication.deposit_paid || false,
              guarantor_name: '',
              guarantor_email: '',
              guarantor_phone: '',
              guarantor_date_of_birth: '',
              guarantor_relationship: '',
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
            };
            
            setFormData(newFormData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId, fetchStudentProfile]);

  // Add a refetch mechanism for data persistence
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStudentProfile();
      }
    };

    const handleFocus = () => {
      fetchStudentProfile();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `student-profile-${studentId}`) {
        fetchStudentProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [studentId, fetchStudentProfile]);

  // Add interval to periodically refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchStudentProfile();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [studentId, fetchStudentProfile]);

  // Save form data to localStorage for persistence
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      localStorage.setItem(`student-profile-${studentId}`, JSON.stringify({
        formData,
        timestamp: Date.now()
      }));
    }
  }, [formData, studentId]);

  const handleFieldUpdate = async (fieldName: string, value: any) => {
    try {
      setSaving(true);
      
      console.log('🔄 Starting field update:', { fieldName, value, studentData, applicationData });
      
      // Calculate age if birthday is being updated
      let updatedValue = value;
      let ageUpdate = null;
      
      if (fieldName === 'birthday' && value) {
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        updatedValue = value;
        ageUpdate = age;
        console.log('📅 Age calculated:', { birthday: value, age });
      }
      
      // ✅ FIXED: Update both tables for consistency
      const updatePromises = [];
      const updateResults = [];
      
      // Update application data if exists
      if (applicationData) {
        const appUpdateData: any = { 
          [fieldName]: updatedValue, 
          updated_at: new Date().toISOString() 
        };
        
        // If updating birthday, also update age
        if (ageUpdate !== null) {
          appUpdateData.age = ageUpdate;
        }
        
        console.log('📝 Updating student_applications:', { id: applicationData.id, data: appUpdateData });
        
        const appUpdatePromise = supabase
          .from('student_applications')
          .update(appUpdateData)
          .eq('id', applicationData.id);
        
        updatePromises.push(appUpdatePromise);
      }

      // ✅ FIXED: Also update students table for basic fields
      if (studentData) {
        const studentUpdateData: any = {};
        
        // Map application fields to student fields
        const fieldMapping: { [key: string]: string } = {
          'first_name': 'name',
          'email': 'email', 
          'mobile': 'phone'
        };
        
        if (fieldMapping[fieldName]) {
          studentUpdateData[fieldMapping[fieldName]] = updatedValue;
          studentUpdateData.updated_at = new Date().toISOString();
          
          console.log('👤 Updating students table:', { id: studentData.id, data: studentUpdateData });
          
          const studentUpdatePromise = supabase
            .from('students')
            .update(studentUpdateData)
            .eq('id', studentData.id);
          
          updatePromises.push(studentUpdatePromise);
        }
      }
      
      // Execute all updates
      console.log('🚀 Executing', updatePromises.length, 'updates...');
      const results = await Promise.all(updatePromises);
      
      // Check for errors
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.error) {
          console.error(`❌ Update ${i + 1} failed:`, result.error);
          throw result.error;
        } else {
          console.log(`✅ Update ${i + 1} successful:`, result.data);
        }
      }

      // Create audit trail entry
      if (applicationData) {
        try {
          await createAuditTrailEntry({
            entity_type: 'application',
            entity_id: applicationData.id,
            action: 'updated',
            field_name: fieldName,
            old_value: formData[fieldName as keyof typeof formData],
            new_value: updatedValue,
            user_id: user?.id,
            user_role: user?.role,
            user_name: user?.name || user?.email
          });
          console.log('📊 Audit trail entry created');
        } catch (auditError) {
          console.warn('⚠️ Failed to create audit trail:', auditError);
        }

        // Update local application data
        setApplicationData(prev => prev ? { ...prev, [fieldName]: updatedValue } : null);
      }

      // Update local student data if applicable
      if (studentData && ['first_name', 'email', 'mobile'].includes(fieldName)) {
        const fieldMapping: { [key: string]: string } = {
          'first_name': 'name',
          'email': 'email',
          'mobile': 'phone'
        };
        
        setStudentData(prev => prev ? { 
          ...prev, 
          [fieldMapping[fieldName]]: updatedValue 
        } : null);
      }

      // Update local form data
      setFormData(prev => ({ 
        ...prev, 
        [fieldName]: updatedValue,
        ...(ageUpdate !== null && { age: ageUpdate })
      }));
      setEditingField(null);
      
      console.log('✅ Field update completed successfully');
      toast({ 
        title: 'Updated', 
        description: `${fieldName.replace('_', ' ')} updated successfully` 
      });
    } catch (error) {
      console.error('❌ Error updating field:', error);
      
      // Provide more detailed error information
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          message: (error as any).message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint
        });
      }
      
      toast({ 
        title: 'Error', 
        description: `Failed to update ${fieldName.replace('_', ' ')}: ${(error as any)?.message || 'Unknown error'}`, 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    try {
      setUploadingDocument(documentType);
      
      const fileName = `${documentType}_${Date.now()}_${file.name}`;
      const filePath = `student-documents/${studentId}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('student-documents')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(filePath);
      
      // Update application with document URL
      const fieldName = `${documentType}_url`;
      const filenameField = `${documentType}_filename`;
      
      await handleFieldUpdate(fieldName, urlData.publicUrl);
      await handleFieldUpdate(filenameField, file.name);
      
      toast({
        title: 'Document Uploaded',
        description: `${documentType.replace('_', ' ')} uploaded successfully`
      });
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setUploadingDocument(null);
    }
  };

  const calculateProfileCompletion = () => {
    const requiredFields = [
      'first_name', 'last_name', 'birthday', 'age', 'ethnicity', 'gender', 'ucas_id', 'country',
      'email', 'mobile', 'address_line_1', 'address_line_2', 'post_code', 'town',
      'year_of_study', 'field_of_study', 'medical_requirements', 'entry_into_uk',
      'payment_installments', 'guarantor_name', 'guarantor_email', 'guarantor_phone',
      'guarantor_date_of_birth', 'guarantor_relationship'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    }).length;
    
    const documentCompletion = Math.min(documentsData.length * 10, 30);
    const fieldCompletion = (filledFields / requiredFields.length) * 70;
    
    return Math.min(Math.round(fieldCompletion + documentCompletion), 100);
  };

  const renderEditableField = (
    fieldName: keyof typeof formData,
    label: string,
    type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const isEditing = editingField === fieldName;
    const value = formData[fieldName];

    if (isEditing) {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">{label}</Label>
          <div className="flex items-center space-x-2">
            {type === 'select' && options ? (
              <Select 
                value={String(value)} 
                onValueChange={(newValue) => handleFieldUpdate(fieldName, newValue)}
              >
                <SelectTrigger className="flex-1 border-2 border-blue-300 focus:border-blue-500">
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === 'textarea' ? (
              <div className="flex-1 space-y-2">
                <Textarea
                  value={String(value)}
                  onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
                  className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleFieldUpdate(fieldName, formData[fieldName])}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingField(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : type === 'checkbox' ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => handleFieldUpdate(fieldName, checked)}
                />
                <span className="text-sm">{label}</span>
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                <Input
                  type={type}
                  value={type === 'number' ? Number(value) : String(value)}
                  onChange={(e) => {
                    const newValue = type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
                    setFormData(prev => ({ ...prev, [fieldName]: newValue }));
                  }}
                  className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleFieldUpdate(fieldName, formData[fieldName])}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingField(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-600">{label}</Label>
        <div className="flex items-center justify-between p-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <p className="text-slate-900">
            {type === 'checkbox' 
              ? (value ? 'Yes' : 'No')
              : (value || 'Not provided')
            }
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingField(fieldName)}
            className="hover:bg-slate-100"
          >
            <Edit className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profileCompletion = calculateProfileCompletion();
  const ethnicityOptions = [
    { value: 'asian', label: 'Asian' },
    { value: 'black', label: 'Black' },
    { value: 'white', label: 'White' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  const yearOfStudyOptions = [
    { value: '1st_year', label: '1st Year' },
    { value: '2nd_year', label: '2nd Year' },
    { value: '3rd_year', label: '3rd Year' },
    { value: '4th_year', label: '4th Year' },
    { value: 'masters', label: 'Masters' },
    { value: 'phd', label: 'PhD' }
  ];

  const paymentInstallmentOptions = [
    { value: '3_cycles', label: '3 Cycles' },
    { value: '4_cycles', label: '4 Cycles' },
    { value: '10_cycles', label: '10 Cycles' }
  ];

  const guarantorRelationshipOptions = [
    { value: 'Mother', label: 'Mother' },
    { value: 'Father', label: 'Father' },
    { value: 'Guardian', label: 'Guardian' },
    { value: 'Sibling', label: 'Sibling' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">

      {/* Personal Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderEditableField('first_name', 'Full Name', 'text')}
            {renderEditableField('birthday', 'Birthday', 'date')}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600">Age</Label>
              <div className="flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-slate-900">
                  {formData.age || 'Auto-calculated from birthday'}
                </p>
                <span className="text-xs text-slate-500">Auto-calculated</span>
              </div>
            </div>
            {renderEditableField('ethnicity', 'Ethnicity', 'select', ethnicityOptions)}
            {renderEditableField('gender', 'Gender', 'select', genderOptions)}
            {renderEditableField('ucas_id', 'UCAS ID', 'text')}
            {renderEditableField('country', 'Country', 'text')}
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
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderEditableField('email', 'Email', 'email')}
            {renderEditableField('mobile', 'Mobile Phone', 'text')}
            {renderEditableField('address_line_1', 'Address Line 1', 'text')}
            {renderEditableField('address_line_2', 'Address Line 2', 'text')}
            {renderEditableField('post_code', 'Post Code', 'text')}
            {renderEditableField('town', 'Town/City', 'text')}
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
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderEditableField('year_of_study', 'Year of Study', 'select', yearOfStudyOptions)}
            {renderEditableField('field_of_study', 'Field of Study', 'text')}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-orange-600" />
            <span>Additional Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderEditableField('is_disabled', 'Disability Status', 'checkbox')}
            {renderEditableField('is_smoker', 'Smoker Status', 'checkbox')}
            {renderEditableField('entry_into_uk', 'Entry into UK', 'text')}
          </div>
          <div className="col-span-full">
            {renderEditableField('medical_requirements', 'Medical Requirements', 'textarea')}
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span>Payment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderEditableField('wants_installments', 'Do you want to pay in Installments?', 'checkbox')}
            {formData.wants_installments && (
              <div className="col-span-2">
                {renderEditableField('selected_installment_plan', 'Choose Payment Installments', 'select', paymentInstallmentOptions)}
              </div>
            )}
            {renderEditableField('payment_installments', 'Payment Plan', 'select', paymentInstallmentOptions)}
            {renderEditableField('deposit_paid', 'Deposit Paid', 'checkbox')}
            {renderEditableField('data_consent', 'Data Consent', 'checkbox')}
          </div>
        </CardContent>
      </Card>

      {/* Guarantor Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-red-600" />
            <span>Guarantor Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderEditableField('guarantor_name', 'Guarantor Name', 'text')}
            {renderEditableField('guarantor_email', 'Guarantor Email', 'email')}
            {renderEditableField('guarantor_phone', 'Guarantor Phone', 'text')}
            {renderEditableField('guarantor_date_of_birth', 'Guarantor Date of Birth', 'date')}
            {renderEditableField('guarantor_relationship', 'Guarantor Relationship', 'select', guarantorRelationshipOptions)}
          </div>
        </CardContent>
      </Card>

      {/* Document Uploads */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span>Document Uploads</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Utility Bill */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-600">Utility Bill (Less than 3 months old) *</Label>
              {formData.utility_bill_url ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">{formData.utility_bill_filename}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.utility_bill_url, '_blank')}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.utility_bill_url, '_blank')}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <FileUpload
                  label="Upload Utility Bill"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  onFileSelect={(file) => file && handleDocumentUpload('utility_bill', file)}
                  uploading={uploadingDocument === 'utility_bill'}
                />
              )}
            </div>

            {/* Identity Document */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-600">Driver's License / Passport / Birth Certificate *</Label>
              {formData.identity_document_url ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">{formData.identity_document_filename}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.identity_document_url, '_blank')}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.identity_document_url, '_blank')}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <FileUpload
                  label="Upload Identity Document"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  onFileSelect={(file) => file && handleDocumentUpload('identity_document', file)}
                  uploading={uploadingDocument === 'identity_document'}
                />
              )}
            </div>

            {/* Bank Statement */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-600">Bank Statement *</Label>
              {formData.bank_statement_url ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">{formData.bank_statement_filename}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.bank_statement_url, '_blank')}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.bank_statement_url, '_blank')}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <FileUpload
                  label="Upload Bank Statement"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  onFileSelect={(file) => file && handleDocumentUpload('bank_statement', file)}
                  uploading={uploadingDocument === 'bank_statement'}
                />
              )}
            </div>

            {/* Passport */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-600">Passport *</Label>
              {formData.passport_url ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">{formData.passport_filename}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.passport_url, '_blank')}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.passport_url, '_blank')}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <FileUpload
                  label="Upload Passport"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  onFileSelect={(file) => file && handleDocumentUpload('passport', file)}
                  uploading={uploadingDocument === 'passport'}
                />
              )}
            </div>

            {/* Current Visa */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-600">Current Visa *</Label>
              {formData.current_visa_url ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">{formData.current_visa_filename}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.current_visa_url, '_blank')}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(formData.current_visa_url, '_blank')}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <FileUpload
                  label="Upload Current Visa"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  onFileSelect={(file) => file && handleDocumentUpload('current_visa', file)}
                  uploading={uploadingDocument === 'current_visa'}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveStudentProfile;