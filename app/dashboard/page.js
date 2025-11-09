'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, IndianRupee, Percent, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // 7 days by default

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices');
      const invoices = await response.json();
      
      // Filter by time range
      const now = new Date();
      const filteredInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const daysDiff = (now - invoiceDate) / (1000 * 60 * 60 * 24);
        
        if (timeRange === '7') return daysDiff <= 7;
        if (timeRange === '30') return daysDiff <= 30;
        if (timeRange === '90') return daysDiff <= 90;
        return true; // all time
      });
      
      setSalesData(filteredInvoices);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalSales = salesData.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
  const totalDiscount = salesData.reduce((sum, invoice) => {
    const discountAmount = invoice.subTotal * (invoice.discountPercent / 100);
    return sum + discountAmount;
  }, 0);
  const totalInvoices = salesData.length;
  
  // Calculate profit (assuming 30% margin for demo purposes)
  const totalProfit = totalSales * 0.3;
  
  // Prepare chart data
  const dailySalesData = salesData.reduce((acc, invoice) => {
    const date = format(new Date(invoice.date), 'MMM dd');
    if (!acc[date]) {
      acc[date] = { date, sales: 0, count: 0 };
    }
    acc[date].sales += invoice.grandTotal;
    acc[date].count += 1;
    return acc;
  }, {});
  
  const chartData = Object.values(dailySalesData);
  
  // Payment method distribution
  const paymentMethodData = salesData.reduce((acc, invoice) => {
    const method = invoice.paymentMode || 'Cash';
    if (!acc[method]) {
      acc[method] = { name: method, value: 0 };
    }
    acc[method].value += 1;
    return acc;
  }, {});
  
  const paymentData = Object.values(paymentMethodData);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Recent invoices
  const recentInvoices = salesData.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground">Track your sales, profits, and discounts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === '7' ? 'default' : 'outline'} 
            onClick={() => setTimeRange('7')}
          >
            7 Days
          </Button>
          <Button 
            variant={timeRange === '30' ? 'default' : 'outline'} 
            onClick={() => setTimeRange('30')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === '90' ? 'default' : 'outline'} 
            onClick={() => setTimeRange('90')}
          >
            90 Days
          </Button>
          <Button 
            variant={timeRange === 'all' ? 'default' : 'outline'} 
            onClick={() => setTimeRange('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">30% margin</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discounts Given</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalDiscount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across {salesData.filter(i => i.discountPercent > 0).length} invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">+8% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily sales over the selected period</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Sales']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution of payment methods</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Invoices']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentInvoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id.substring(0, 8)}</TableCell>
                    <TableCell>{format(new Date(invoice.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{invoice.customer?.name || 'Walk-in Customer'}</TableCell>
                    <TableCell>₹{invoice.grandTotal.toFixed(2)}</TableCell>
                    <TableCell>
                      {invoice.discountPercent > 0 ? (
                        <Badge variant="secondary">
                          {invoice.discountPercent}% (-₹{(invoice.subTotal * invoice.discountPercent / 100).toFixed(2)})
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.paymentMode || 'Cash'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}