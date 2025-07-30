import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getInvoices, 
  getPayments, 
  getPaymentPlans, 
  getStudents, 
  getTourists 
} from '@/lib/supabaseCrud';
import { PaymentPlan } from '@/types';
import InvoiceManagement, { InvoiceActionButtons } from '@/components/InvoiceManagement';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  Users, 
  Calendar,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  ArrowLeft
} from "lucide-react";

interface Invoice {
  id: number;
  invoice_number: string;
  student_id?: number;
  tourist_id?: number;
  payment_plan_id: number;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  student?: any;
  tourist?: any;
  payment_plan?: any;
}

interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  status: string;
  payment_date: string;
  notes?: string;
}



const Finance = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [tourists, setTourists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Stats
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    totalPayments: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from database
      const [invoicesData, paymentsData, paymentPlansData, studentsData, touristsData] = await Promise.all([
        getInvoices(),
        getPayments(),
        getPaymentPlans(),
        getStudents(),
        getTourists()
      ]);

      setInvoices(invoicesData || []);
      setPayments(paymentsData || []);
      setPaymentPlans(paymentPlansData || []);
      setStudents(studentsData || []);
      setTourists(touristsData || []);
      
      // Calculate stats from real data
      const totalInvoices = invoicesData?.length || 0;
      const totalAmount = invoicesData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const paidAmount = invoicesData
        ?.filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const pendingAmount = invoicesData
        ?.filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const overdueAmount = invoicesData
        ?.filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

      setStats({
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        totalPayments: paymentsData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer': return <DollarSign className="w-4 h-4" />;
      case 'cash': return <Receipt className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.student?.name || invoice.tourist?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-slate-600">Loading Finance Module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Finance & Accounts</h1>
          <p className="text-slate-600 mt-2">Manage invoices, payments, and financial reporting</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">£{stats.totalAmount.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending Amount</p>
                <p className="text-2xl font-bold">£{stats.pendingAmount.toLocaleString()}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Overdue Amount</p>
                <p className="text-2xl font-bold">£{stats.overdueAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-md border border-slate-200/60 p-1 shadow-sm">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="payment-plans">Payment Plans</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-900">Invoices</CardTitle>
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Invoice Management Component */}
              <div className="mb-6">
                <InvoiceManagement
                  invoices={invoices}
                  students={students}
                  tourists={tourists}
                  onInvoiceChange={fetchData}
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invoice.student?.name || invoice.tourist?.name || 'No Customer'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {invoice.student?.email || invoice.tourist?.email || 'No Email'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {invoice.student_id ? `Student ID: ${invoice.student_id}` : 
                             invoice.tourist_id ? `Tourist ID: ${invoice.tourist_id}` : 
                             'No Customer Assigned'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.currency || '£'}{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <InvoiceActionButtons
                          invoice={invoice}
                          onView={(inv) => console.log('View invoice:', inv)}
                          onEdit={(inv) => console.log('Edit invoice:', inv)}
                          onDelete={(inv) => console.log('Delete invoice:', inv)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">#{payment.id}</TableCell>
                      <TableCell>INV-2024-{payment.invoice_id.toString().padStart(6, '0')}</TableCell>
                      <TableCell>£{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Plans Tab */}
        <TabsContent value="payment-plans" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-900">Payment Plans</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  // Group plans by payment cycles
                  const groupedPlans = paymentPlans.reduce((acc, plan) => {
                    const key = plan.payment_cycles;
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(plan);
                    return acc;
                  }, {} as Record<number, typeof paymentPlans>);

                  // Create simplified plan cards
                  return Object.entries(groupedPlans).map(([cycles, plans]) => {
                    const firstPlan = plans[0]; // Use first plan for basic info
                    const totalStudents = plans.length; // Count of plans in this cycle group
                    
                    return (
                      <Card 
                        key={`cycle-${cycles}`}
                        className="border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer hover:bg-slate-50"
                        onClick={() => navigate(`/finance/payment-plan/${cycles}`)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{cycles} Cycle Plan</CardTitle>
                            <Badge variant="default">
                              Active
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-slate-600">Pay accommodation fees in {cycles} installments for 45 or 51 week stays</p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Students Enrolled:</span>
                              <span className="font-semibold">{totalStudents}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Payment Cycles:</span>
                              <span>{cycles} installments</span>
                            </div>
                                                    <div className="flex justify-between">
                          <span className="text-slate-500">Duration Options:</span>
                          <span>45 & 51 weeks</span>
                        </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Currency:</span>
                              <span>{firstPlan.currency}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-800">£{stats.totalAmount.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm text-yellow-600">Pending Revenue</p>
                      <p className="text-2xl font-bold text-yellow-800">£{stats.pendingAmount.toLocaleString()}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-red-600">Overdue Revenue</p>
                      <p className="text-2xl font-bold text-red-800">£{stats.overdueAmount.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Monthly Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Outstanding Invoices
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Payment History
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Financial Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance; 