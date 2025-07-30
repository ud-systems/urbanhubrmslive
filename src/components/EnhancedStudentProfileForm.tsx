import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building2, 
  GraduationCap,
  Globe,
  CreditCard,
  Shield,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApplicationOptions } from '@/lib/supabaseCrud';

interface StudentProfileData {
  // Personal Information
  first_name: string;
  last_name: string;
  birthday: string;
  age: number;
  ethnicity: string;
  gender: string;
  ucas_id: string;
  country: string;
  
  // Contact Information
  email: string;
  mobile: string;
  address_line_1: string;
  address_line_2: string;
  post_code: string;
  town: string;
  
  // Academic Information
  year_of_study: string;
  field_of_study: string;
  
  // Additional Information
  is_disabled: boolean;
  is_smoker: boolean;
  medical_requirements: string;
  entry_into_uk: string;
  
  // Payment Information
  wants_installments: boolean;
  selected_installment_plan: string;
  payment_installments: string;
  data_consent: boolean;
  deposit_paid: boolean;

  // Guarantor Information
  guarantor_name: string;
  guarantor_email: string;
  guarantor_phone: string;
  guarantor_date_of_birth: string;
  guarantor_relationship: string;
}

interface EnhancedStudentProfileFormProps {
  initialData?: Partial<StudentProfileData>;
  leadData?: any; // Lead data for pre-population
  onSubmit: (data: StudentProfileData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'lead-conversion' | 'direct-creation' | 'edit';
}

const EnhancedStudentProfileForm: React.FC<EnhancedStudentProfileFormProps> = ({
  initialData = {},
  leadData,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [options, setOptions] = useState<any>(null);
  const [formData, setFormData] = useState<StudentProfileData>({
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

    ...initialData
  });

  // Load application options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const appOptions = await getApplicationOptions();
        setOptions(appOptions);
      } catch (error) {
        console.error('Error loading options:', error);
      }
    };
    loadOptions();
  }, []);

  // Pre-populate from lead data if available
  useEffect(() => {
    if (leadData && mode === 'lead-conversion') {
      setFormData(prev => ({
        ...prev,
        first_name: leadData.name || '',
        email: leadData.email || '',
        mobile: leadData.phone || '',
        // Map lead source to country if relevant
        country: leadData.source === 'international' ? 'International' : '',
        // Pre-fill basic contact info
        address_line_1: leadData.address || '',
        // Set deposit paid based on lead status
        deposit_paid: leadData.status === 'converted' || false
      }));
    }
  }, [leadData, mode]);

  // Calculate age from birthday
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

  // Handle birthday change
  const handleBirthdayChange = (birthday: string) => {
    setFormData(prev => ({
      ...prev,
      birthday,
      age: calculateAge(birthday)
    }));
  };

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const requiredFields = [
      'first_name', 'email', 'mobile', 'birthday', 'country',
      'year_of_study', 'field_of_study', 'entry_into_uk'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof StudentProfileData];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    }).length;
    
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const completion = calculateProfileCompletion();
    if (completion < 50) {
      toast({
        title: 'Incomplete Profile',
        description: 'Please fill in at least 50% of the required fields.',
        variant: 'destructive'
      });
      return;
    }

    onSubmit(formData);
  };

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {mode === 'lead-conversion' ? 'Convert Lead to Student' : 
             mode === 'direct-creation' ? 'Create New Student' : 'Edit Student Profile'}
          </h2>
          <p className="text-slate-600 mt-1">
            {mode === 'lead-conversion' ? 'Complete the student profile with additional information' :
             mode === 'direct-creation' ? 'Fill in all required student information' :
             'Update student profile information'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-slate-600">Profile Completion</p>
            <p className="text-lg font-semibold text-slate-900">{profileCompletion}%</p>
          </div>
          <Progress value={profileCompletion} className="w-24" />
        </div>
      </div>

      {/* Lead Info Banner */}
      {mode === 'lead-conversion' && leadData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Lead Information Pre-filled</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Name:</span>
                <span className="ml-2 font-medium">{leadData.name}</span>
              </div>
              <div>
                <span className="text-blue-700">Email:</span>
                <span className="ml-2 font-medium">{leadData.email}</span>
              </div>
              <div>
                <span className="text-blue-700">Phone:</span>
                <span className="ml-2 font-medium">{leadData.phone}</span>
              </div>
              <div>
                <span className="text-blue-700">Source:</span>
                <Badge variant="secondary" className="ml-2">{leadData.source}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Additional
            </TabsTrigger>
            <TabsTrigger value="guarantor" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Guarantor
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Full Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthday">Date of Birth *</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => handleBirthdayChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      readOnly
                      className="bg-slate-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.genders?.map((gender: any) => (
                          <SelectItem key={gender.id} value={gender.name}>
                            {gender.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ethnicity">Ethnicity</Label>
                    <Select value={formData.ethnicity} onValueChange={(value) => setFormData(prev => ({ ...prev, ethnicity: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.ethnicities?.map((ethnicity: any) => (
                          <SelectItem key={ethnicity.id} value={ethnicity.name}>
                            {ethnicity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.countries?.map((country: any) => (
                          <SelectItem key={country.id} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ucas_id">UCAS ID</Label>
                    <Input
                      id="ucas_id"
                      value={formData.ucas_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, ucas_id: e.target.value }))}
                      placeholder="Enter UCAS ID"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line_1">Address Line 1</Label>
                    <Input
                      id="address_line_1"
                      value={formData.address_line_1}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                      placeholder="Enter address line 1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input
                      id="address_line_2"
                      value={formData.address_line_2}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
                      placeholder="Enter address line 2 (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="town">Town/City</Label>
                    <Input
                      id="town"
                      value={formData.town}
                      onChange={(e) => setFormData(prev => ({ ...prev, town: e.target.value }))}
                      placeholder="Enter town or city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="post_code">Post Code</Label>
                    <Input
                      id="post_code"
                      value={formData.post_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, post_code: e.target.value }))}
                      placeholder="Enter post code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Information Tab */}
          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year_of_study">Year of Study *</Label>
                    <Select value={formData.year_of_study} onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year of study" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.years?.map((year: any) => (
                          <SelectItem key={year.id} value={year.name}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="field_of_study">Field of Study *</Label>
                    <Input
                      id="field_of_study"
                      value={formData.field_of_study}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_of_study: e.target.value }))}
                      placeholder="Enter field of study"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional Information Tab */}
          <TabsContent value="additional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry_into_uk">Entry into UK *</Label>
                    <Select value={formData.entry_into_uk} onValueChange={(value) => setFormData(prev => ({ ...prev, entry_into_uk: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.entries?.map((entry: any) => (
                          <SelectItem key={entry.id} value={entry.name}>
                            {entry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_installments">Payment Installments</Label>
                    <Select value={formData.payment_installments} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_installments: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.installments?.map((installment: any) => (
                          <SelectItem key={installment.id} value={installment.name}>
                            {installment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_disabled"
                      checked={formData.is_disabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_disabled: checked as boolean }))}
                    />
                    <Label htmlFor="is_disabled">Has Disability</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_smoker"
                      checked={formData.is_smoker}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_smoker: checked as boolean }))}
                    />
                    <Label htmlFor="is_smoker">Smoker</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wants_installments"
                      checked={formData.wants_installments}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, wants_installments: checked as boolean }))}
                    />
                    <Label htmlFor="wants_installments">Wants Payment Installments</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="data_consent"
                      checked={formData.data_consent}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, data_consent: checked as boolean }))}
                    />
                    <Label htmlFor="data_consent">Data Consent *</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deposit_paid"
                      checked={formData.deposit_paid}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, deposit_paid: checked as boolean }))}
                    />
                    <Label htmlFor="deposit_paid">Deposit Paid</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="medical_requirements">Medical Requirements</Label>
                  <Textarea
                    id="medical_requirements"
                    value={formData.medical_requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, medical_requirements: e.target.value }))}
                    placeholder="Enter any medical requirements or special needs"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guarantor Information Tab */}
          <TabsContent value="guarantor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Guarantor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guarantor_name">Guarantor Name</Label>
                    <Input
                      id="guarantor_name"
                      value={formData.guarantor_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantor_name: e.target.value }))}
                      placeholder="Enter guarantor full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guarantor_email">Guarantor Email</Label>
                    <Input
                      id="guarantor_email"
                      type="email"
                      value={formData.guarantor_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantor_email: e.target.value }))}
                      placeholder="Enter guarantor email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guarantor_phone">Guarantor Phone</Label>
                    <Input
                      id="guarantor_phone"
                      value={formData.guarantor_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantor_phone: e.target.value }))}
                      placeholder="Enter guarantor phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guarantor_date_of_birth">Guarantor Date of Birth</Label>
                    <Input
                      id="guarantor_date_of_birth"
                      type="date"
                      value={formData.guarantor_date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantor_date_of_birth: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="guarantor_relationship">Relationship to Student</Label>
                    <Input
                      id="guarantor_relationship"
                      value={formData.guarantor_relationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, guarantor_relationship: e.target.value }))}
                      placeholder="e.g., Parent, Guardian, Relative"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-2">
            <Badge variant={profileCompletion >= 80 ? 'default' : profileCompletion >= 50 ? 'secondary' : 'destructive'}>
              {profileCompletion >= 80 ? 'Complete' : profileCompletion >= 50 ? 'Good' : 'Incomplete'}
            </Badge>
            <span className="text-sm text-slate-600">
              {profileCompletion}% profile completion
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || profileCompletion < 50}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : mode === 'lead-conversion' ? 'Convert Lead' : 'Save Student'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EnhancedStudentProfileForm; 