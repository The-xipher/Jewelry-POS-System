'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Download } from 'lucide-react';

export default function InvoiceViewPage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        toast.error('Invoice not found');
        router.push('/invoices');
      }
    } catch (error) {
      toast.error('Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = (type) => {
    window.open(`/api/invoices/${params.id}/pdf-${type}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice Details</h1>
            <p className="text-sm text-muted-foreground">ID: {invoice.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => downloadPDF('a4')}>
            <Download className="h-4 w-4 mr-2" />
            A4 PDF
          </Button>
          <Button variant="outline" onClick={() => downloadPDF('thermal')}>
            <Download className="h-4 w-4 mr-2" />
            Thermal PDF
          </Button>
        </div>
      </div>

      {/* Invoice Info */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">
              {new Date(invoice.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invoice ID</p>
            <p className="font-mono text-sm">{invoice.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{invoice.customer?.name || 'Walk-in Customer'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">WhatsApp</p>
            <p className="font-medium">{invoice.customer?.whatsapp || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items ({invoice.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{(item.price * item.qty).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">₹{invoice.subTotal.toFixed(2)}</span>
          </div>
          {invoice.discountPercent > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount ({invoice.discountPercent}%)</span>
              <span>-₹{(invoice.subTotal * invoice.discountPercent / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>Grand Total</span>
            <span>₹{invoice.grandTotal.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
