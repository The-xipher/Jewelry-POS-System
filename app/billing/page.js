'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Trash2, Plus, Minus, ShoppingBag, Share2, Printer } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useSettingsStore from '@/store/settingsStore';

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const { shopInfo } = useSettingsStore();

  const { items, addItem, updateQuantity, removeItem, clearCart } = useCartStore();

  const subTotal = items.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);
  const discountAmount = subTotal * (discount / 100);
  const amountAfterDiscount = subTotal - discountAmount;
  const gstAmount = amountAfterDiscount * (gstPercent / 100);
  const grandTotal = amountAfterDiscount + gstAmount;

  // Load shop info on mount
  useEffect(() => {
    useSettingsStore.getState().loadShopInfo();
  }, []);

  // Search products
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/products?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast.error('Failed to search products');
    } finally {
      setIsSearching(false);
    }
  };

  // Search by barcode
  const handleBarcodeSearch = async (barcode) => {
    try {
      const response = await fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();
      if (data.length > 0) {
        addItem(data[0]);
        toast.success(`Added ${data[0].name} to cart`);
        setBarcodeInput('');
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Failed to search by barcode');
    }
  };

  // Handle barcode input
  const handleBarcodeInput = (e) => {
    if (e.key === 'Enter') {
      if (barcodeInput.trim()) {
        handleBarcodeSearch(barcodeInput.trim());
      }
    }
  };

  // Generate invoice
  const handleGenerateInvoice = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Please enter customer details');
      return;
    }

    try {
      const invoiceData = {
        customer: {
          name: customerName,
          whatsapp: customerPhone
        },
        discountPercent: discount,
        gstPercent: gstPercent,
        paymentMode: paymentMode,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.sellPrice,
          qty: item.qty
        })),
        subTotal,
        grandTotal
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      const data = await response.json();

      if (response.ok) {
        setWhatsappLink(data.whatsappLink || '');
        setCurrentInvoice(data.invoice);
        setShowSuccessModal(true);
        clearCart();
        setCustomerName('');
        setCustomerPhone('');
        setDiscount(0);
        setSearchResults([]);
        toast.success('Invoice created successfully!');
      } else {
        toast.error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Invoice error:', error);
      toast.error('Failed to create invoice');
    }
  };

  // Share on WhatsApp
  const handleShareOnWhatsApp = () => {
    if (whatsappLink) {
      window.open(whatsappLink, '_blank');
    }
  };

  // Print Thermal PDF directly using window.open with print trigger
  const handlePrintThermalPDF = () => {
    if (currentInvoice?.id) {
      // Open thermal PDF in new window with inline display
      const printWindow = window.open(`/api/invoices/${currentInvoice.id}/pdf-thermal`, '_blank');
      
      // Try to print automatically after a short delay
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          // If auto-print fails, user can manually press Ctrl+P
          console.log('Auto-print failed, please use Ctrl+P to print');
        }
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Billing</h1>
        <ShoppingBag className="h-8 w-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Product Search */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode Scanner Input */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Scan barcode or enter manually..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeInput}
                className="text-lg"
                autoFocus
              />
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, code, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono">{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>₹{product.sellPrice}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                addItem(product);
                                toast.success(`Added ${product.name}`);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
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

          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Cart Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Cart is empty</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>₹{item.sellPrice}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.qty - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.qty}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.qty + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">₹{(item.sellPrice * item.qty).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Customer & Summary */}
        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">WhatsApp Number</Label>
                <Input
                  id="customerPhone"
                  placeholder="91XXXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstPercent">GST (%)</Label>
                <Input
                  id="gstPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Net Banking">Net Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">₹{subTotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({discount}%):</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount after discount:</span>
                  <span className="font-semibold">₹{amountAfterDiscount.toFixed(2)}</span>
                </div>
                {gstPercent > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({gstPercent}%):</span>
                    <span>+₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerateInvoice}
                disabled={items.length === 0}
              >
                Generate Bill
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Created Successfully!</DialogTitle>
            <DialogDescription>
              The invoice has been generated and saved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-2xl font-bold text-green-600">✓ Success</p>
            {currentInvoice && (
              <>
                <p className="text-center mt-2">Total: ₹{currentInvoice.grandTotal.toFixed(2)}</p>
                <p className="text-center mt-1">Payment Mode: {currentInvoice.paymentMode}</p>
              </>
            )}
          </div>
          <DialogFooter className="flex-col space-y-2">
            <Button
              className="w-full"
              onClick={handlePrintThermalPDF}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Thermal Receipt
            </Button>
            {whatsappLink && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShareOnWhatsApp}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share on WhatsApp
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}