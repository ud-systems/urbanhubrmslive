import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  User, 
  FileText, 
  Calendar, 
  Building2, 
  DollarSign, 
  Bell, 
  Settings, 
  LogOut,
  Home,
  BookOpen,
  MessageSquare,
  HelpCircle,
  CreditCard,
  Shield,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Wrench,
  Edit,
  Eye,
  Download
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ComprehensiveStudentProfile from "@/components/ComprehensiveStudentProfile";
import PaymentModal from "@/components/PaymentModal";
import MaintenanceRequestModal from "@/components/MaintenanceRequestModal";
import { getInvoices, getMaintenanceRequestsByStudent, getStudentRecentActivity } from "@/lib/supabaseCrud";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { 
  getStudentApplication,
  getApplicationDocuments,
  createStudentUserAccount
} from "@/lib/supabaseCrud";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  room: string;
  assignedto: string;
  duration: string;
  revenue: number;
  checkin: string;
  profileCompletion: number;
  user_id?: string;
  studio?: {
    id: string;
    name: string;
    view: string;
    floor: string;
    roomGrade: string;
  };
  utility_bill_url?: string;
  utility_bill_filename?: string;
  identity_document_url?: string;
  identity_document_filename?: string;
  bank_statement_url?: string;
  bank_statement_filename?: string;
  passport_url?: string;
  passport_filename?: string;
  current_visa_url?: string;
  current_visa_filename?: string;
}

const StudentPortal = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [maintenanceRequestModalOpen, setMaintenanceRequestModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('No user found');
      }

      const targetStudentId = studentId || user.id;
      
      if (!targetStudentId) {
        throw new Error('No student ID or user ID available');
      }

      // Check if the targetStudentId is a UUID (user_id) or numeric ID (student.id)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetStudentId);

      let studentData, error;
      
      if (isUuid) {
        // Query by user_id
        const result = await supabase
          .from('students')
          .select('*')
          .eq('user_id', targetStudentId)
          .single();
        studentData = result.data;
        error = result.error;
      } else {
        // Try to parse as integer ID
        const numericId = parseInt(targetStudentId);
        if (isNaN(numericId)) {
          throw new Error(`Invalid student ID format: ${targetStudentId}`);
        }
        
        const result = await supabase
          .from('students')
          .select('*')
          .eq('id', numericId)
          .single();
        studentData = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // If no student found, that's okay - user might not have a student record yet
        if (error.code === 'PGRST116') {
          console.log('No student record found for user, using fallback data');
        } else {
          throw error;
        }
      }

      if (studentData) {
        // Get studio information if student has a room assigned
        let studioInfo = null;
        if (studentData.room && studentData.room !== 'Not assigned') {
          try {
            const { data: studioData } = await supabase
              .from('studios')
              .select('*')
              .eq('id', studentData.room)
              .single();
            
            if (studioData) {
              studioInfo = {
                id: studioData.id,
                name: studioData.name,
                view: studioData.view || 'Not specified',
                floor: studioData.floor || 'Not specified',
                roomGrade: studioData.roomGrade || 'Not specified'
              };
            }
          } catch (studioError) {
            console.warn('Could not fetch studio info:', studioError);
          }
        }

        // Use real student data from database
        const student: Student = {
          id: studentData.id,
          name: studentData.name,
          email: studentData.email,
          phone: studentData.phone || '',
          room: studentData.room || 'Not assigned',
          assignedto: studentData.assignedto || 'Not assigned',
          duration: studentData.duration || 'Not set',
          revenue: studentData.revenue || 0,
          checkin: studentData.checkin || 'Not set',
          profileCompletion: 0, // We'll calculate this based on available data
          user_id: studentData.user_id,
          studio: studioInfo
        };

        // Fetch application data to get document URLs and other fields
        if (studentData.user_id) {
          try {
            const { data: applicationData } = await supabase
              .from('student_applications')
              .select('*')
              .eq('user_id', studentData.user_id)
              .single();
            
            if (applicationData) {
              // Update student with application data
              student.utility_bill_url = applicationData.utility_bill_url;
              student.utility_bill_filename = applicationData.utility_bill_filename;
              student.identity_document_url = applicationData.identity_document_url;
              student.identity_document_filename = applicationData.identity_document_filename;
              student.bank_statement_url = applicationData.bank_statement_url;
              student.bank_statement_filename = applicationData.bank_statement_filename;
              student.passport_url = applicationData.passport_url;
              student.passport_filename = applicationData.passport_filename;
              student.current_visa_url = applicationData.current_visa_url;
              student.current_visa_filename = applicationData.current_visa_filename;
              
              // Calculate profile completion
              const documents = [
                applicationData.utility_bill_url,
                applicationData.identity_document_url,
                applicationData.bank_statement_url,
                applicationData.passport_url,
                applicationData.current_visa_url
              ].filter(Boolean);
              
              student.profileCompletion = calculateProfileCompletion(applicationData, documents);
            }
          } catch (appError) {
            console.warn('Could not fetch application data:', appError);
          }
        }
        
        setStudent(student);
        
        // Fetch invoices for this student
        try {
          const studentInvoices = await getInvoices();
          const filteredInvoices = studentInvoices.filter(invoice => 
            invoice.student_id === student.id
          );
          setInvoices(filteredInvoices);
        } catch (invoiceError) {
          console.error('Error fetching invoices:', invoiceError);
        }

        // Fetch maintenance requests for this student
        try {
          const studentMaintenanceRequests = await getMaintenanceRequestsByStudent(student.id);
          setMaintenanceRequests(studentMaintenanceRequests);
        } catch (maintenanceError) {
          console.error('Error fetching maintenance requests:', maintenanceError);
        }

        // Fetch recent activity for this student
        try {
          const studentActivity = await getStudentRecentActivity(student.id);
          setRecentActivity(studentActivity);
        } catch (activityError) {
          console.error('Error fetching recent activity:', activityError);
        }
      } else {
        // Fallback to basic user data if no student record found
        console.log('No student record found, using user data as fallback');
        const student: Student = {
          id: parseInt(targetStudentId || "1"),
          name: user.name || 'Student',
          email: user.email || '',
          phone: '',
          room: 'Not assigned',
          assignedto: 'Not assigned',
          duration: 'Not set',
          revenue: 0,
          checkin: 'Not set',
          profileCompletion: 0,
          user_id: targetStudentId
        };
        
        setStudent(student);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      // Provide more detailed error information
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error message:', error.message);
        console.error('Error code:', (error as any).code);
      }
      toast({ title: 'Error', description: 'Failed to load student data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (application: any, documents: any[]) => {
    if (!application) return 0;
    
    // Define all required fields
    const requiredFields = [
      'first_name', 'last_name', 'birthday', 'age', 'ethnicity', 'gender', 'ucas_id', 'country',
      'email', 'mobile', 'address_line_1', 'address_line_2', 'post_code', 'town',
      'year_of_study', 'field_of_study', 'is_disabled', 'is_smoker', 'medical_requirements', 'entry_into_uk',
      'payment_installments', 'data_consent', 'guarantor_name', 'guarantor_email', 'guarantor_phone',
      'guarantor_date_of_birth', 'guarantor_relationship'
    ];
    
    // Count filled fields
    const filledFields = requiredFields.filter(field => {
      const value = application[field];
      return value !== null && value !== undefined && value !== '' && value !== false;
    }).length;
    
    // Add document completion (assuming 3 required documents = 10% each)
    const documentCompletion = Math.min(documents.length * 10, 30); // Max 30% for documents
    
    // Calculate total completion
    const fieldCompletion = (filledFields / requiredFields.length) * 70; // 70% for fields
    const totalCompletion = Math.min(Math.round(fieldCompletion + documentCompletion), 100);
    
    return totalCompletion;
  };

  const handleCreateUserAccount = async () => {
    if (!student) return;
    
    try {
      // Check if student already has a user account
      if (student.user_id) {
        toast({ 
          title: 'User Account Exists', 
          description: 'This student already has a user account.', 
          variant: 'destructive' 
        });
        return;
      }

      // Create user account for the student
      const userAccount = await createStudentUserAccount({
        name: student.name,
        email: student.email,
        phone: student.phone
      });
      
      if (userAccount?.success) {
        // Update student record with user_id
        await supabase
          .from('students')
          .update({ user_id: userAccount.user.id })
          .eq('id', student.id);

        toast({ 
          title: 'User Account Created', 
          description: `Student account created with email: ${student.email}. Default password: ${userAccount.defaultPassword}` 
        });
        
        // Refresh student data
        fetchStudentData();
      } else {
        toast({ 
          title: 'Creation Failed', 
          description: 'Failed to create user account for student.', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create user account for student.', 
        variant: 'destructive' 
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to logout', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading student portal...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Student not found</h3>
        <p className="text-slate-600">The requested student could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Student Portal</h1>
              <p className="text-sm text-slate-500">Welcome back, {student.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active Student
            </Badge>
            {/* Show Create User Account button for admin/manager/salesperson viewing student */}
            {user?.role !== 'student' && !student?.user_id && (
              <Button 
                variant="outline" 
                onClick={handleCreateUserAccount}
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                <User className="w-4 h-4 mr-2" />
                Create User Account
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Student Overview Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-green-600 to-green-700 text-white text-xl">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
                    <p className="text-slate-600">{student.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="bg-white/50">
                        <Building2 className="w-3 h-3 mr-1" />
                        {student.studio ? student.studio.name : (student.room || 'Not assigned')}
                      </Badge>
                      <Badge variant="outline" className="bg-white/50">
                        <Clock className="w-3 h-3 mr-1" />
                        {student.duration}
                      </Badge>
                      {student.studio && (
                        <Badge variant="outline" className="bg-white/50">
                          <Star className="w-3 h-3 mr-1" />
                          {student.studio.roomGrade}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-sm text-slate-600">Duration</p>
                    <p className="text-2xl font-bold text-slate-900">{student.duration}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-white/50">
                      <Clock className="w-3 h-3 mr-1" />
                      {student.duration}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">£{student.revenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Check-in Date</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {new Date(student.checkin).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Studio</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {student.studio ? student.studio.name : (student.room || 'Not assigned')}
                    </p>
                    {student.studio && (
                      <p className="text-sm text-slate-500">
                        {student.studio.view} • Floor {student.studio.floor}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Profile Completion</p>
                    <p className="text-2xl font-bold text-slate-900">{student.profileCompletion}%</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${student.profileCompletion}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-md border border-slate-200/60 p-1 shadow-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                <Home className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                <Wrench className="w-4 h-4 mr-2" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.slice(0, 5).map((activity, index) => {
                        const getActivityIcon = (action: string) => {
                          switch (action.toLowerCase()) {
                            case 'created':
                              return <CheckCircle className="w-4 h-4 text-green-600" />;
                            case 'updated':
                              return <Edit className="w-4 h-4 text-blue-600" />;
                            case 'uploaded':
                              return <FileText className="w-4 h-4 text-purple-600" />;
                            case 'assigned':
                              return <Building2 className="w-4 h-4 text-orange-600" />;
                            default:
                              return <Bell className="w-4 h-4 text-gray-600" />;
                          }
                        };

                        const getActivityColor = (action: string) => {
                          switch (action.toLowerCase()) {
                            case 'created':
                              return 'bg-green-50';
                            case 'updated':
                              return 'bg-blue-50';
                            case 'uploaded':
                              return 'bg-purple-50';
                            case 'assigned':
                              return 'bg-orange-50';
                            default:
                              return 'bg-gray-50';
                          }
                        };

                        const getActivityDescription = (activity: any) => {
                          const field = activity.field_name ? ` (${activity.field_name})` : '';
                          return `${activity.entity_type} ${activity.action}${field}`;
                        };

                        const getTimeAgo = (dateString: string) => {
                          const date = new Date(dateString);
                          const now = new Date();
                          const diffMs = now.getTime() - date.getTime();
                          const diffMins = Math.floor(diffMs / (1000 * 60));
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                          if (diffMins < 60) {
                            return `${diffMins} minutes ago`;
                          } else if (diffHours < 24) {
                            return `${diffHours} hours ago`;
                          } else {
                            return `${diffDays} days ago`;
                          }
                        };

                        return (
                          <div key={index} className={`flex items-center space-x-3 p-3 ${getActivityColor(activity.action)} rounded-lg`}>
                            <div className={`w-8 h-8 ${getActivityColor(activity.action).replace('50', '100')} rounded-full flex items-center justify-center`}>
                              {getActivityIcon(activity.action)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 capitalize">
                                {getActivityDescription(activity)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {getTimeAgo(activity.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/application')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Complete Application
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setMaintenanceRequestModalOpen(true)}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Report Issue
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => {
                        const unpaidInvoice = invoices.find(inv => inv.status === 'pending');
                        if (unpaidInvoice) {
                          setSelectedInvoice(unpaidInvoice);
                          setPaymentModalOpen(true);
                        } else {
                          toast({
                            title: "No Outstanding Invoices",
                            description: "You have no pending payments at this time.",
                          });
                        }
                      }}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Make Payment
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <User className="w-4 h-4 mr-2" />
                      Update Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>


            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              {student && (
                <ComprehensiveStudentProfile 
                  key={`profile-${student.id}`} 
                  studentId={student.id} 
                />
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span>Document Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Manage your documents and ensure all required files are uploaded and approved.
                  </p>
                  
                  {/* Application Documents */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Application Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Utility Bill */}
                      <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-6 h-6 text-slate-400" />
                          <Badge variant={student.utility_bill_url ? "default" : "secondary"}>
                            {student.utility_bill_url ? "Uploaded" : "Required"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Utility Bill</p>
                        <p className="text-xs text-slate-500 mb-2">Less than 3 months old</p>
                        {student.utility_bill_url ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 truncate">{student.utility_bill_filename}</p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.utility_bill_url, '_blank')}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.utility_bill_url, '_blank')}
                                className="flex-1"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500">Not uploaded</p>
                        )}
                      </div>

                      {/* Identity Document */}
                      <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-6 h-6 text-slate-400" />
                          <Badge variant={student.identity_document_url ? "default" : "secondary"}>
                            {student.identity_document_url ? "Uploaded" : "Required"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Identity Document</p>
                        <p className="text-xs text-slate-500 mb-2">Passport / Driver's License / Birth Certificate</p>
                        {student.identity_document_url ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 truncate">{student.identity_document_filename}</p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.identity_document_url, '_blank')}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.identity_document_url, '_blank')}
                                className="flex-1"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500">Not uploaded</p>
                        )}
                      </div>

                      {/* Bank Statement */}
                      <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-6 h-6 text-slate-400" />
                          <Badge variant={student.bank_statement_url ? "default" : "secondary"}>
                            {student.bank_statement_url ? "Uploaded" : "Required"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Bank Statement</p>
                        <p className="text-xs text-slate-500 mb-2">Recent bank statement</p>
                        {student.bank_statement_url ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 truncate">{student.bank_statement_filename}</p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.bank_statement_url, '_blank')}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.bank_statement_url, '_blank')}
                                className="flex-1"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500">Not uploaded</p>
                        )}
                      </div>

                      {/* Passport */}
                      <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-6 h-6 text-slate-400" />
                          <Badge variant={student.passport_url ? "default" : "secondary"}>
                            {student.passport_url ? "Uploaded" : "Required"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Passport</p>
                        <p className="text-xs text-slate-500 mb-2">Valid passport document</p>
                        {student.passport_url ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 truncate">{student.passport_filename}</p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.passport_url, '_blank')}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.passport_url, '_blank')}
                                className="flex-1"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500">Not uploaded</p>
                        )}
                      </div>

                      {/* Current Visa */}
                      <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-6 h-6 text-slate-400" />
                          <Badge variant={student.current_visa_url ? "default" : "secondary"}>
                            {student.current_visa_url ? "Uploaded" : "Required"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Current Visa</p>
                        <p className="text-xs text-slate-500 mb-2">Current valid visa document</p>
                        {student.current_visa_url ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 truncate">{student.current_visa_filename}</p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.current_visa_url, '_blank')}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(student.current_visa_url, '_blank')}
                                className="flex-1"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500">Not uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium text-slate-900 mb-2">Total Amount</h4>
                      <p className="text-2xl font-bold text-slate-900">£{student.revenue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium text-slate-900 mb-2">Monthly Payment</h4>
                      <p className="text-2xl font-bold text-slate-900">£{(student.revenue / 45 * 4.33).toFixed(0)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium text-slate-900 mb-2">Next Due</h4>
                      <p className="text-2xl font-bold text-slate-900">Feb 1, 2024</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      const unpaidInvoice = invoices.find(inv => inv.status === 'pending');
                      if (unpaidInvoice) {
                        setSelectedInvoice(unpaidInvoice);
                        setPaymentModalOpen(true);
                      } else {
                        toast({
                          title: "No Outstanding Invoices",
                          description: "You have no pending payments at this time.",
                        });
                      }
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Make Payment
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Maintenance Requests</h2>
                <Button 
                  onClick={() => setMaintenanceRequestModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Report New Issue
                </Button>
              </div>

              {maintenanceRequests.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceRequests.map((request) => (
                    <Card key={request.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{request.title}</h3>
                            <p className="text-sm text-slate-600 capitalize">{request.category}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={request.priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                                            request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'}>
                              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                            </Badge>
                            <Badge className={request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-4">{request.description}</p>
                        <div className="flex justify-between items-center text-sm text-slate-500">
                          <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                          {request.resolved_at && (
                            <span>Resolved: {new Date(request.resolved_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Maintenance Requests</h3>
                      <p className="text-slate-600 mb-4">You haven't submitted any maintenance requests yet.</p>
                      <Button 
                        onClick={() => setMaintenanceRequestModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        Report an Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    <span>Support & Help</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="w-full justify-start h-auto p-4" variant="outline">
                      <MessageSquare className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Contact Support</p>
                        <p className="text-sm text-slate-500">Get help with any issues</p>
                      </div>
                    </Button>
                    <Button className="w-full justify-start h-auto p-4" variant="outline">
                      <BookOpen className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">FAQ</p>
                        <p className="text-sm text-slate-500">Common questions & answers</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </div>
      </main>
      
      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        studentId={student?.id || 0}
        onPaymentSuccess={() => {
          // Refresh invoices after successful payment
          if (student?.id) {
            getInvoices().then(allInvoices => {
              const filteredInvoices = allInvoices.filter(invoice => 
                invoice.student_id === student.id
              );
              setInvoices(filteredInvoices);
            });
          }
        }}
      />

      {/* Maintenance Request Modal */}
      <MaintenanceRequestModal
        open={maintenanceRequestModalOpen}
        onClose={() => setMaintenanceRequestModalOpen(false)}
        studentId={student?.id || 0}
        studioId={student?.studio?.id}
        studioName={student?.studio?.name}
        onRequestCreated={() => {
          // Refresh maintenance requests after successful submission
          if (student?.id) {
            getMaintenanceRequestsByStudent(student.id).then(allRequests => {
              setMaintenanceRequests(allRequests);
            });
          }
        }}
      />
    </div>
  );
};

export default StudentPortal; 