import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle,
  Building2,
  User,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentPlan, Student, StudentPaymentProgress } from '@/types';
import { 
  getStudentsByPaymentCycles, 
  getStudentPaymentProgress 
} from '@/lib/supabaseCrud';
import LoadingSpinner from '@/components/LoadingSpinner';

const PaymentPlanDetail = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentProgress, setPaymentProgress] = useState<StudentPaymentProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (planId) {
      fetchPaymentPlanDetails();
    }
  }, [planId]);

  const fetchPaymentPlanDetails = async () => {
    try {
      setLoading(true);
      
      if (!planId) return;
      
      const cycles = parseInt(planId);
      setCycleCount(cycles);
      
      // Fetch students in this payment cycle group
      const studentsData = await getStudentsByPaymentCycles(cycles);
      setStudents(studentsData);
      
      // Fetch payment progress for these students
      const progressData = await getStudentPaymentProgress(cycles);
      setPaymentProgress(progressData);
      
    } catch (error) {
      console.error('Error fetching payment plan details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment plan details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.assignedto && student.assignedto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get payment progress for a specific student
  const getStudentProgress = (studentId: number) => {
    return paymentProgress.find(p => p.student_id === studentId);
  };

  // Calculate progress percentage
  const calculateProgressPercentage = (progress: StudentPaymentProgress | undefined) => {
    if (!progress) return 0;
    return Math.round((progress.paid_installments / progress.total_installments) * 100);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading payment plan details..." />;
  }

  if (!cycleCount) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Plan Not Found</h1>
          <Button onClick={() => navigate('/finance')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finance
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{cycleCount} Cycle Plan</h1>
          <p className="text-slate-600 mt-1">Pay accommodation fees in {cycleCount} installments for 45 or 51 week stays</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Students
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/finance')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Finance</span>
          </Button>
        </div>
      </div>

      {/* Payment Plan Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Payment Cycles</p>
                <p className="text-2xl font-bold">{cycleCount} installments</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Duration Options</p>
                <p className="text-2xl font-bold">45 & 51 weeks</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Students with Deposit Paid</p>
                <p className="text-2xl font-bold">{students.filter(s => s.deposit_paid).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <User className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Students in {cycleCount} Cycle Plan
            </CardTitle>
            <div className="flex space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Studio Allocated</TableHead>
                  <TableHead>Deposit Paid</TableHead>
                  <TableHead>Payment Progress</TableHead>
                  <TableHead>Next Payment Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      {searchTerm ? 'No students found matching your search.' : 'No students in this payment plan yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const progress = getStudentProgress(student.id);
                    const progressPercentage = calculateProgressPercentage(progress);
                    
                    return (
                      <TableRow key={student.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">{student.name}</div>
                            <div className="text-sm text-slate-500">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{student.assignedto || student.room || 'Not Assigned'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {student.deposit_paid ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 font-medium">Yes</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-600 font-medium">No</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>
                                {progress?.paid_installments || 0} / {progress?.total_installments || cycleCount}
                              </span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {progress?.next_payment_due ? (
                            <Badge variant="outline">
                              {new Date(progress.next_payment_due).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={progressPercentage === 100 ? "default" : progressPercentage > 0 ? "secondary" : "destructive"}
                          >
                            {progressPercentage === 100 ? 'Completed' : progressPercentage > 0 ? 'In Progress' : 'Not Started'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPlanDetail;