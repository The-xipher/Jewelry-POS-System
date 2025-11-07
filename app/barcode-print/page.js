'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Printer, Plus, Minus } from 'lucide-react';

export default function BarcodePrintPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`/api/products?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast.error('Failed to search products');
    }
  };

  const handleBarcodeSearch = async (barcode) => {
    try {
      const response = await fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();
      if (data.length > 0) {
        setSelectedProduct(data[0]);
        toast.success('Product loaded');
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Failed to search by barcode');
    }
  };

  const handlePrint = () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <Printer className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Barcode Label Printing</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Scan Barcode or Enter Product Code</Label>
              <Input
                placeholder="Scan or type..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    handleBarcodeSearch(e.target.value);
                  }
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Search by Name/Code</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Product name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setSelectedProduct(product);
                      setSearchResults([]);
                      toast.success(`Selected ${product.name}`);
                    }}
                  >
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.code}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Print Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProduct && (
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">Code: {selectedProduct.code}</p>
                <p className="text-sm text-muted-foreground">Price: ₹{selectedProduct.sellPrice}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Number of Labels</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="text-center"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity(Math.min(100, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📌 Optimized for Retsol R220 Thermal Printer (100mm × 15mm)
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePrint}
              disabled={!selectedProduct}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print {quantity} Label{quantity > 1 ? 's' : ''}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Print Preview */}
      {selectedProduct && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <LabelPreview product={selectedProduct} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Area */}
      {selectedProduct && (
        <div className="hidden print:block">
          {Array.from({ length: quantity }).map((_, index) => (
            <LabelPreview key={index} product={selectedProduct} />
          ))}
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
          }
          @page {
            size: 100mm 15mm;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

function LabelPreview({ product }) {
  return (
    <div className="relative bg-white text-black" style={{ width: '100mm', height: '15mm', border: '1px solid #ccc' }}>
      {/* Left Section - Product Info */}
      <div className="absolute left-0 top-0 bottom-0" style={{ width: '48mm', padding: '2mm' }}>
        <div className="text-xs font-bold" style={{ fontSize: '8pt', lineHeight: '1.2' }}>
          {product.name.substring(0, 30)}
        </div>
        <div className="text-xs" style={{ fontSize: '7pt', marginTop: '1mm' }}>
          Code: {product.code}
        </div>
      </div>

      {/* Center Perforation Line */}
      <div className="absolute" style={{ left: '48mm', top: '1mm', bottom: '1mm', width: '1px', borderLeft: '1px dashed #999' }} />

      {/* Right Section - Barcode & Price */}
      <div className="absolute right-0 top-0 bottom-0" style={{ width: '48mm', padding: '2mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <img
          src={`/api/products/${product.id}/barcode`}
          alt="Barcode"
          style={{ height: '8mm', width: '40mm', objectFit: 'contain' }}
        />
        <div className="text-xs font-bold" style={{ fontSize: '9pt', marginTop: '1mm' }}>
          ₹{product.sellPrice}
        </div>
      </div>

      {/* Tail Rectangle */}
      <div className="absolute" style={{ right: '0', top: '0', width: '3mm', height: '15mm', backgroundColor: '#000' }} />
    </div>
  );
}
