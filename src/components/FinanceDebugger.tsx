import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, DollarSign, RefreshCw } from 'lucide-react';
import { getInvoices, getStudents, getTourists, createStudentInvoice, createTouristInvoice } from '@/lib/supabaseCrud';
import { toast } from '@/hooks/use-toast';

const FinanceDebugger = () => {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [tourists, setTourists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [invoicesData, studentsData, touristsData] = await Promise.all([
        getInvoices(),
        getStudents(),
        getTourists()
      ]);

      setInvoices(invoicesData || []);
      setStudents(studentsData || []);
      setTourists(touristsData || []);
      setLastRefresh(new Date());

      console.log('Finance Debug - Data loaded:', {
        invoices: invoicesData?.length || 0,
        students: studentsData?.length || 0,
        tourists: touristsData?.length || 0
      });

    } catch (error) {
      console.error('Error refreshing finance data:', error);
      toast({
        title: "Error",
        description: "Failed to load finance data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testStudentInvoice = async () => {
    if (students.length === 0) {
      toast({
        title: "No Students",
        description: "Create a student first to test invoice generation",
        variant: "destructive"
      });
      return;
    }

    try {
      const student = students[0];
      console.log('Creating test invoice for student:', student);
      
      const invoice = await createStudentInvoice(student);
      console.log('Created invoice:', invoice);

      toast({
        title: "Test Invoice Created",
        description: `Invoice created for student: ${student.name}`,
        variant: "default"
      });

      await refreshData();
    } catch (error) {
      console.error('Error creating test student invoice:', error);
      toast({
        title: "Invoice Creation Failed",
        description: error.message || "Failed to create test invoice",
        variant: "destructive"
      });
    }
  };

  const testTouristInvoice = async () => {
    if (tourists.length === 0) {
      toast({
        title: "No Tourists",
        description: "Create a tourist first to test invoice generation",
        variant: "destructive"
      });
      return;
    }

    try {
      const tourist = tourists[0];
      console.log('Creating test invoice for tourist:', tourist);
      
      const invoice = await createTouristInvoice(tourist);
      console.log('Created invoice:', invoice);

      toast({
        title: "Test Invoice Created",
        description: `Invoice created for tourist: ${tourist.name}`,
        variant: "default"
      });

      await refreshData();
    } catch (error) {
      console.error('Error creating test tourist invoice:', error);
      toast({
        title: "Invoice Creation Failed",
        description: error.message || "Failed to create test invoice",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const studentsWithInvoices = students.filter(student => 
    invoices.some(invoice => invoice.student_id === student.id)
  );

  const touristsWithInvoices = tourists.filter(tourist => 
    invoices.some(invoice => invoice.tourist_id === tourist.id)
  );

  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Finance Integration Debug</span>
          </CardTitle>
          <p className="text-slate-600">
            Test and verify that invoices are automatically created for students and tourists
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-800">{invoices.length}</div>
                <div className="text-sm text-blue-600">Total Invoices</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-800">£{totalInvoiceAmount.toLocaleString()}</div>
                <div className="text-sm text-green-600">Total Amount</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-800">{studentsWithInvoices.length}/{students.length}</div>
                <div className="text-sm text-purple-600">Students w/ Invoices</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-800">{touristsWithInvoices.length}/{tourists.length}</div>
                <div className="text-sm text-orange-600">Tourists w/ Invoices</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={refreshData} 
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button 
              onClick={testStudentInvoice} 
              disabled={students.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Student Invoice
            </Button>
            
            <Button 
              onClick={testTouristInvoice} 
              disabled={tourists.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Test Tourist Invoice
            </Button>
          </div>

          {lastRefresh && (
            <div className="text-sm text-slate-500">
              Last refreshed: {lastRefresh.toLocaleTimeString()}
            </div>
          )}

          {/* Status Indicators */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {invoices.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">Invoice System</span>
              <Badge variant={invoices.length > 0 ? "secondary" : "destructive"}>
                {invoices.length > 0 ? 'Working' : 'No Data'}
              </Badge>
            </div>

            <div className="flex items-center space-x-3">
              {studentsWithInvoices.length === students.length && students.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">Student Integration</span>
              <Badge variant={studentsWithInvoices.length === students.length && students.length > 0 ? "secondary" : "destructive"}>
                {students.length === 0 ? 'No Students' : `${studentsWithInvoices.length}/${students.length} have invoices`}
              </Badge>
            </div>

            <div className="flex items-center space-x-3">
              {touristsWithInvoices.length === tourists.length && tourists.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">Tourist Integration</span>
              <Badge variant={touristsWithInvoices.length === tourists.length && tourists.length > 0 ? "secondary" : "destructive"}>
                {tourists.length === 0 ? 'No Tourists' : `${touristsWithInvoices.length}/${tourists.length} have invoices`}
              </Badge>
            </div>
          </div>

          {/* Recent Invoices */}
          {invoices.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Recent Invoices</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-sm text-slate-600">
                        {invoice.student_id ? 'Student' : 'Tourist'}: {invoice.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">£{invoice.amount}</div>
                      <Badge variant="outline" className="text-xs">
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDebugger; 