import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createInvoice, updateInvoice, deleteInvoice } from '@/lib/supabaseCrud';
import { Plus, Edit, Trash2, Eye } from "lucide-react";

interface Invoice {
  id?: number;
  invoice_number?: string;
  student_id?: number;
  tourist_id?: number;
  amount: number;
  currency?: string;
  status?: string;
  due_date: string;
  description?: string;
  notes?: string;
  student?: any;
  tourist?: any;
}

interface InvoiceManagementProps {
  invoices: Invoice[];
  students: any[];
  tourists: any[];
  onInvoiceChange: () => void;
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({
  invoices,
  students,
  tourists,
  onInvoiceChange
}) => {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<Invoice>({
    amount: 0,
    due_date: '',
    currency: 'GBP',
    status: 'pending',
    description: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      amount: 0,
      due_date: '',
      currency: 'GBP',
      status: 'pending',
      description: '',
      notes: ''
    });
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      
      if (!formData.amount || !formData.due_date) {
        toast({
          title: "Validation Error",
          description: "Amount and due date are required",
          variant: "destructive"
        });
        return;
      }

      if (!formData.student_id && !formData.tourist_id) {
        toast({
          title: "Validation Error", 
          description: "Please select either a student or tourist",
          variant: "destructive"
        });
        return;
      }

      const invoiceData = {
        ...formData,
        invoice_number: `INV-${Date.now()}`,
        issued_date: new Date().toISOString().split('T')[0]
      };

      await createInvoice(invoiceData);
      
      toast({
        title: "Success",
        description: "Invoice created successfully"
      });
      
      setIsCreateModalOpen(false);
      resetForm();
      onInvoiceChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      
      if (!selectedInvoice?.id) return;

      await updateInvoice(selectedInvoice.id, formData);
      
      toast({
        title: "Success",
        description: "Invoice updated successfully"
      });
      
      setIsEditModalOpen(false);
      setSelectedInvoice(null);
      resetForm();
      onInvoiceChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!invoice.id) return;
    
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await deleteInvoice(invoice.id);
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully"
      });
      
      onInvoiceChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      student_id: invoice.student_id,
      tourist_id: invoice.tourist_id,
      amount: invoice.amount,
      currency: invoice.currency || 'GBP',
      status: invoice.status || 'pending',
      due_date: invoice.due_date,
      description: invoice.description || '',
      notes: invoice.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Invoice Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a student or tourist
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-type">Customer Type</Label>
              <Select 
                value={formData.student_id ? 'student' : formData.tourist_id ? 'tourist' : ''}
                onValueChange={(value) => {
                  if (value === 'student') {
                    setFormData(prev => ({ ...prev, tourist_id: undefined }));
                  } else if (value === 'tourist') {
                    setFormData(prev => ({ ...prev, student_id: undefined }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="tourist">Tourist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={String(formData.student_id || formData.tourist_id || '')}
                onValueChange={(value) => {
                  if (formData.student_id !== undefined) {
                    setFormData(prev => ({ ...prev, student_id: Number(value) }));
                  } else {
                    setFormData(prev => ({ ...prev, tourist_id: Number(value) }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {formData.student_id !== undefined 
                    ? students.map(student => (
                        <SelectItem key={student.id} value={String(student.id)}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))
                    : tourists.map(tourist => (
                        <SelectItem key={tourist.id} value={String(tourist.id)}>
                          {tourist.name} ({tourist.email})
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Invoice description"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update invoice details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={selectedInvoice?.invoice_number || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Input 
                value={selectedInvoice?.student?.name || selectedInvoice?.tourist?.name || ''} 
                disabled 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Updating...' : 'Update Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View complete invoice information
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Invoice Number</Label>
                  <p>{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <Badge className={getStatusColor(selectedInvoice.status || '')}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Customer</Label>
                  <p>{selectedInvoice.student?.name || selectedInvoice.tourist?.name}</p>
                  <p className="text-sm text-gray-500">{selectedInvoice.student?.email || selectedInvoice.tourist?.email}</p>
                </div>
                <div>
                  <Label className="font-semibold">Amount</Label>
                  <p className="text-lg font-medium">{selectedInvoice.currency} {selectedInvoice.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Due Date</Label>
                  <p>{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Customer Type</Label>
                  <p>{selectedInvoice.student_id ? 'Student' : 'Tourist'}</p>
                </div>
              </div>
              
              {selectedInvoice.description && (
                <div>
                  <Label className="font-semibold">Description</Label>
                  <p>{selectedInvoice.description}</p>
                </div>
              )}
              
              {selectedInvoice.notes && (
                <div>
                  <Label className="font-semibold">Notes</Label>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action buttons for each invoice */}
      <div className="hidden">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openViewModal(invoice)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditModal(invoice)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(invoice)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export action buttons component for use in table
export const InvoiceActionButtons: React.FC<{
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}> = ({ invoice, onView, onEdit, onDelete }) => (
  <div className="flex gap-2">
    <Button size="sm" variant="outline" onClick={() => onView(invoice)}>
      <Eye className="w-4 h-4" />
    </Button>
    <Button size="sm" variant="outline" onClick={() => onEdit(invoice)}>
      <Edit className="w-4 h-4" />
    </Button>
    <Button size="sm" variant="destructive" onClick={() => onDelete(invoice)}>
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
);

export default InvoiceManagement; 