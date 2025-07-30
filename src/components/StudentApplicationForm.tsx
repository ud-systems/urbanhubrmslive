import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Shield,
  CreditCard,
  Calendar,
  Globe,
  Building2
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import FilePreview from "@/components/ui/file-preview";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getApplicationOptions,
  getStudentApplication,
  createStudentApplication,
  updateStudentApplication,
  submitStudentApplication,
  getApplicationDocuments,
  uploadApplicationDocument,
  deleteApplicationDocument,
  updateApplicationProgress,
  getApplicationProgress
} from "@/lib/supabaseCrud";

interface ApplicationFormData {
  // Step 1: Personal Information
  first_name: string;
  last_name: string;
  birthday: string;
  age: number;
  ethnicity: string;
  gender: string;
  ucas_id: string;
  country: string;
  
  // Step 2: Contact Information
  email: string;
  mobile: string;
  address_line_1: string;
  address_line_2: string;
  post_code: string;
  town: string;
  
  // Step 3: Academic Information
  year_of_study: string;
  field_of_study: string;
  
  // Step 4: Additional Information
  is_disabled: boolean;
  is_smoker: boolean;
  medical_requirements: string;
  entry_into_uk: string;
  
  // Step 5: Payment Information
  payment_installments: string;
  data_consent: boolean;
}

interface ApplicationOptions {
  ethnicities: any[];
  genders: any[];
  countries: any[];
  years: any[];
  entries: any[];
  installments: any[];
}

const StudentApplicationForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<ApplicationOptions | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    first_name: '',
    last_name: '',
    birthday: '',
    age: 0,
    ethnicity: '',
    gender: '',
    ucas_id: '',
    country: '',
    email: '',
    mobile: '',
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
    payment_installments: '',
    data_consent: false
  });

  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: File | null}>({});

  const totalSteps = 6;
  const stepNames = [
    'Personal Information',
    'Contact Information', 
    'Academic Information',
    'Additional Information',
    'Documentation',
    'Payment Plans'
  ];

  useEffect(() => {
    loadApplicationData();
  }, [user]);

  const loadApplicationData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [optionsData, existingApplication, progressData] = await Promise.all([
        getApplicationOptions(),
        getStudentApplication(user.id),
        user.id ? getApplicationProgress(0) : Promise.resolve([])
      ]);

      setOptions(optionsData);
      
      if (existingApplication) {
        setApplication(existingApplication);
        setFormData({
          first_name: existingApplication.first_name || '',
          last_name: existingApplication.last_name || '',
          birthday: existingApplication.birthday || '',
          age: existingApplication.age || 0,
          ethnicity: existingApplication.ethnicity || '',
          gender: existingApplication.gender || '',
          ucas_id: existingApplication.ucas_id || '',
          country: existingApplication.country || '',
          email: existingApplication.email || '',
          mobile: existingApplication.mobile || '',
          address_line_1: existingApplication.address_line_1 || '',
          address_line_2: existingApplication.address_line_2 || '',
          post_code: existingApplication.post_code || '',
          town: existingApplication.town || '',
          year_of_study: existingApplication.year_of_study || '',
          field_of_study: existingApplication.field_of_study || '',
          is_disabled: existingApplication.is_disabled || false,
          is_smoker: existingApplication.is_smoker || false,
          medical_requirements: existingApplication.medical_requirements || '',
          entry_into_uk: existingApplication.entry_into_uk || '',
          payment_installments: existingApplication.payment_installments || '',
          data_consent: existingApplication.data_consent || false
        });
        setCurrentStep(existingApplication.current_step || 1);
        
        if (existingApplication.id) {
          const docs = await getApplicationDocuments(existingApplication.id);
          setDocuments(docs);
        }
      }
      
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading application data:', error);
      toast({ title: 'Error', description: 'Failed to load application data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ApplicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Information
        return !!(formData.first_name && formData.last_name && formData.birthday && formData.age && formData.ethnicity && formData.gender && formData.country);
      case 2: // Contact Information
        return !!(formData.email && formData.address_line_1 && formData.address_line_2 && formData.post_code && formData.town);
      case 3: // Academic Information
        return !!(formData.year_of_study && formData.field_of_study);
      case 4: // Additional Information
        return !!(formData.is_disabled !== undefined && formData.is_smoker !== undefined && formData.entry_into_uk);
      case 5: // Documentation
        return documents.length >= 2; // At least passport and visa
      case 6: // Payment Plans
        return !!(formData.payment_installments && formData.data_consent);
      default:
        return false;
    }
  };

  const saveStep = async (step: number) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const stepData = {
        ...formData,
        user_id: user.id,
        current_step: step,
        completed_steps: Array.from(new Set([...(application?.completed_steps || []), step]))
      };

      let savedApplication;
      if (application?.id) {
        savedApplication = await updateStudentApplication(application.id, stepData);
      } else {
        savedApplication = await createStudentApplication(stepData);
        setApplication(savedApplication);
      }

      await updateApplicationProgress(
        savedApplication.id,
        step,
        stepNames[step - 1],
        true,
        formData
      );

      setApplication(savedApplication);
      toast({ title: 'Success', description: 'Step saved successfully' });
    } catch (error) {
      console.error('Error saving step:', error);
      toast({ title: 'Error', description: 'Failed to save step', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    await saveStep(currentStep);
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = async (documentType: string) => {
    const file = selectedFiles[documentType];
    if (!file || !application?.id) return;

    try {
      setUploadingFiles(prev => ({ ...prev, [documentType]: true }));
      
      const documentData = {
        applicationId: application.id,
        documentType: documentType,
        file: file,
        fileName: file.name
      };

      const result = await uploadApplicationDocument(documentData);
      
      if (result?.success) {
        setDocuments(prev => [...prev, result.document]);
        setSelectedFiles(prev => ({ ...prev, [documentType]: null }));
        toast({ title: 'Success', description: 'Document uploaded successfully' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({ title: 'Error', description: 'Failed to upload document', variant: 'destructive' });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleFileSelect = (documentType: string, file: File | null) => {
    setSelectedFiles(prev => ({ ...prev, [documentType]: file }));
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await deleteApplicationDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast({ title: 'Success', description: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    }
  };

  const handleSubmitApplication = async () => {
    if (!application?.id) return;

    try {
      setSubmitting(true);
      await submitStudentApplication(application.id);
      setApplication(prev => ({ ...prev, status: 'submitted', submitted_at: new Date().toISOString() }));
      toast({ title: 'Success', description: 'Application submitted successfully!' });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({ title: 'Error', description: 'Failed to submit application', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (!options) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load form options. Please refresh the page.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Student Application</h1>
            <p className="text-slate-600">Step {currentStep} of {totalSteps}: {stepNames[currentStep - 1]}</p>
          </div>
          <Progress value={calculateProgress()} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-slate-600">
            {stepNames.map((name, index) => (
              <span key={index} className={index < currentStep ? 'text-blue-600 font-medium' : ''}>
                {index + 1}. {name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application Status Alert */}
      {application?.status === 'submitted' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your application has been submitted and is under review. You will be notified of any updates.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday *</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                    placeholder="Your Age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ethnicity">Ethnicity *</Label>
                  <Select value={formData.ethnicity} onValueChange={(value) => handleInputChange('ethnicity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="--- Select Ethnicity ---" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.ethnicities.map((ethnicity) => (
                        <SelectItem key={ethnicity.id} value={ethnicity.name}>
                          {ethnicity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="--- Select Gender ---" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.genders.map((gender) => (
                        <SelectItem key={gender.id} value={gender.name}>
                          {gender.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ucas_id">UCAS ID</Label>
                  <Input
                    id="ucas_id"
                    value={formData.ucas_id}
                    onChange={(e) => handleInputChange('ucas_id', e.target.value)}
                    placeholder="UCAS ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="--- Select Country ---" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter Your Email Address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="050 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line_1">Address Line 1 *</Label>
                  <Input
                    id="address_line_1"
                    value={formData.address_line_1}
                    onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                    placeholder="Enter Address Line 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line_2">Address Line 2 *</Label>
                  <Input
                    id="address_line_2"
                    value={formData.address_line_2}
                    onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                    placeholder="Enter Address Line 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_code">Post Code *</Label>
                  <Input
                    id="post_code"
                    value={formData.post_code}
                    onChange={(e) => handleInputChange('post_code', e.target.value)}
                    placeholder="Your Postal Code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="town">Town *</Label>
                  <Input
                    id="town"
                    value={formData.town}
                    onChange={(e) => handleInputChange('town', e.target.value)}
                    placeholder="Your Home Town"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year_of_study">Year of Study *</Label>
                  <Select value={formData.year_of_study} onValueChange={(value) => handleInputChange('year_of_study', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="--- Select Year of Study ---" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.years.map((year) => (
                        <SelectItem key={year.id} value={year.name}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_of_study">Field of Study *</Label>
                  <Input
                    id="field_of_study"
                    value={formData.field_of_study}
                    onChange={(e) => handleInputChange('field_of_study', e.target.value)}
                    placeholder="Field of Study"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="is_disabled">Are you disabled? *</Label>
                  <Select value={formData.is_disabled ? 'Yes' : 'No'} onValueChange={(value) => handleInputChange('is_disabled', value === 'Yes')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Are you disabled ?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_smoker">Are you a Smoker? *</Label>
                  <Select value={formData.is_smoker ? 'Yes' : 'No'} onValueChange={(value) => handleInputChange('is_smoker', value === 'Yes')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Are you a Smoker ?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medical_requirements">Medical Requirements</Label>
                  <Textarea
                    id="medical_requirements"
                    value={formData.medical_requirements}
                    onChange={(e) => handleInputChange('medical_requirements', e.target.value)}
                    placeholder="Medical Requirements if Any"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry_into_uk">Entry into UK *</Label>
                  <Select value={formData.entry_into_uk} onValueChange={(value) => handleInputChange('entry_into_uk', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Entry into UK" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.entries.map((entry) => (
                        <SelectItem key={entry.id} value={entry.name}>
                          {entry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Documentation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload
                  label="Upload your Passport *"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  onFileSelect={(file) => handleFileSelect('passport', file)}
                  selectedFile={selectedFiles['passport']}
                  uploading={uploadingFiles['passport']}
                />
                <FileUpload
                  label="Upload Current Visa *"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  onFileSelect={(file) => handleFileSelect('visa', file)}
                  selectedFile={selectedFiles['visa']}
                  uploading={uploadingFiles['visa']}
                />
              </div>
              
              {/* Upload Buttons */}
              <div className="flex space-x-4">
                {selectedFiles['passport'] && (
                  <Button 
                    onClick={() => handleFileUpload('passport')}
                    disabled={uploadingFiles['passport']}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingFiles['passport'] ? 'Uploading Passport...' : 'Upload Passport'}</span>
                  </Button>
                )}
                {selectedFiles['visa'] && (
                  <Button 
                    onClick={() => handleFileUpload('visa')}
                    disabled={uploadingFiles['visa']}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingFiles['visa'] ? 'Uploading Visa...' : 'Upload Visa'}</span>
                  </Button>
                )}
              </div>
              
              {/* Uploaded Documents */}
              {documents.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-slate-900 mb-3">Uploaded Documents</h3>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <FilePreview
                        key={doc.id}
                        document={doc}
                        onDelete={handleDeleteDocument}
                        showActions={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Plans</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_installments">Do you want to pay in Installments? *</Label>
                  <Select value={formData.payment_installments} onValueChange={(value) => handleInputChange('payment_installments', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment option" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.installments.map((installment) => (
                        <SelectItem key={installment.id} value={installment.name}>
                          {installment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="data_consent"
                    checked={formData.data_consent}
                    onCheckedChange={(checked) => handleInputChange('data_consent', checked)}
                  />
                  <Label htmlFor="data_consent" className="text-sm">
                    Yes, I provide consent that am submitting this information to Urban Hub Student Accommodation *
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={saving}>
                  {saving ? 'Saving...' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      onClick={handleSubmitApplication} 
                      disabled={submitting || application?.status === 'submitted'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to submit your application? You won't be able to make changes after submission.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmitApplication}>
                        Submit Application
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentApplicationForm; 