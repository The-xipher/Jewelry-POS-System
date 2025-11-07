'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileText, Eye } from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Invoice History</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices found</p>
              <Button className="mt-4" onClick={() => router.push('/billing')}>
                Create Your First Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customer?.name || 'Walk-in'}</p>
                          {invoice.customer?.whatsapp && (
                            <p className="text-xs text-muted-foreground">{invoice.customer.whatsapp}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.items.length}</TableCell>
                      <TableCell>
                        {invoice.discountPercent > 0 ? `${invoice.discountPercent}%` : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{invoice.grandTotal.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/invoices/${invoice.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
