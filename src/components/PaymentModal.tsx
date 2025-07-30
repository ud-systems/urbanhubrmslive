import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, DollarSign, X } from 'lucide-react';
import { getStripe } from '@/lib/stripe';
import StripePaymentForm from './StripePaymentForm';
import { createPayment } from '@/lib/supabaseCrud';
import { toast } from '@/hooks/use-toast';

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  currency: string;
  description: string;
  due_date: string;
  status: string;
  issued_date: string;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  studentId: number;
  onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  invoice,
  studentId,
  onPaymentSuccess
}) => {
  const [processing, setProcessing] = useState(false);
  const stripePromise = getStripe();

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setProcessing(true);
      
      // Record payment in database
      await createPayment({
        invoice_id: invoice?.id,
        amount: invoice?.amount,
        payment_method: 'card',
        transaction_id: paymentIntent.id,
        status: 'completed',
        notes: `Payment for invoice ${invoice?.invoice_number}`
      });

      toast({
        title: "Payment Successful!",
        description: `Payment of £${invoice?.amount.toFixed(2)} has been processed successfully.`,
      });

      onPaymentSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Payment Recorded but Error Occurred",
        description: "Payment was successful but couldn't be recorded. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  if (!invoice) return null;

  const isOverdue = new Date(invoice.due_date) < new Date();
  const daysUntilDue = Math.ceil((new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Make Payment</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Complete your payment for invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Invoice Number</p>
                  <p className="text-slate-900">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    £{invoice.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Due Date</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-900">{new Date(invoice.due_date).toLocaleDateString()}</span>
                    {isOverdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : daysUntilDue <= 7 ? (
                      <Badge variant="secondary">Due Soon</Badge>
                    ) : (
                      <Badge variant="outline">On Time</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Status</p>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              {invoice.description && (
                <div>
                  <p className="text-sm font-medium text-slate-600">Description</p>
                  <p className="text-slate-900">{invoice.description}</p>
                </div>
              )}

              {isOverdue && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ This invoice is overdue by {Math.abs(daysUntilDue)} days. 
                    Please make payment as soon as possible to avoid any service interruption.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          {invoice.status !== 'paid' && (
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                amount={invoice.amount}
                currency={invoice.currency.toLowerCase()}
                description={`Invoice ${invoice.invoice_number}`}
                studentId={studentId}
                invoiceId={invoice.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}

          {invoice.status === 'paid' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Invoice Already Paid
                  </h3>
                  <p className="text-green-700">
                    This invoice has already been paid. Thank you!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal; 