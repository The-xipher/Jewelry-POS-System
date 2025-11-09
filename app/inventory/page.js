'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, Filter } from 'lucide-react';
import Image from 'next/image';

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (query = '', category = 'all', stock = 'all') => {
    setIsLoading(true);
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      
      if (query) params.append('query', query);
      
      const response = await fetch(url + (params.toString() ? `?${params.toString()}` : ''));
      const data = await response.json();
      
      // Apply category filter
      let filteredData = data;
      if (category !== 'all') {
        filteredData = filteredData.filter(product => product.category === category);
      }
      
      // Apply stock filter
      if (stock === 'low') {
        filteredData = filteredData.filter(product => product.stock < 10);
      } else if (stock === 'out') {
        filteredData = filteredData.filter(product => product.stock === 0);
      } else if (stock === 'adequate') {
        filteredData = filteredData.filter(product => product.stock >= 10);
      }
      
      setProducts(filteredData);
      
      // Get unique categories
      const uniqueCategories = [...new Set(data.map(product => product.category))];
      setCategories(uniqueCategories);
      
      // Filter low stock items (less than 10)
      const lowStock = filteredData.filter(product => product.stock < 10);
      setLowStockItems(lowStock);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts(searchQuery, filterCategory, filterStock);
  };

  const handleFilterChange = () => {
    fetchProducts(searchQuery, filterCategory, filterStock);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStock('all');
    fetchProducts();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Product deleted');
        fetchProducts(searchQuery, filterCategory, filterStock);
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Function to update stock for a product
  const updateProductStock = async (productId, newStock) => {
    try {
      // First, get the current product data
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        toast.error('Failed to fetch product details');
        return;
      }
      
      const product = await response.json();
      
      // Update the product with all existing fields plus new stock
      const updateResponse = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          stock: parseInt(newStock)
        })
      });

      if (updateResponse.ok) {
        // Refresh the product list
        fetchProducts(searchQuery, filterCategory, filterStock);
        toast.success('Stock updated successfully');
      } else {
        toast.error('Failed to update stock');
      }
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Inventory Management</h1>
        </div>
        <Button onClick={() => router.push('/inventory/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Low Stock Notifications */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alert ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">Code: {product.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Stock: {product.stock}</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const newStock = prompt('Enter new stock quantity:', product.stock);
                        if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
                          updateProductStock(product.id, parseInt(newStock));
                        }
                      }}
                    >
                      Refill Stock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Main Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, code, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={filterCategory} onValueChange={(value) => {
                    setFilterCategory(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">Stock Status</label>
                  <Select value={filterStock} onValueChange={(value) => {
                    setFilterStock(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="adequate">Adequate Stock (10+)</SelectItem>
                      <SelectItem value="low">Low Stock (&lt; 10)</SelectItem>
                      <SelectItem value="out">Out of Stock (0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
            
            {/* Clear Search */}
            {(searchQuery || filterCategory !== 'all' || filterStock !== 'all') && (
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <Button className="mt-4" onClick={() => router.push('/inventory/new')}>
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Sell Price</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.code}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={product.stock < 10 ? 'text-red-600 font-semibold' : ''}>
                          {product.stock}
                          {product.stock < 10 && <AlertTriangle className="inline ml-1 h-4 w-4" />}
                        </span>
                      </TableCell>
                      <TableCell>₹{product.mrp}</TableCell>
                      <TableCell>₹{product.sellPrice}</TableCell>
                      <TableCell>
                        <img
                          src={`/api/products/${product.id}/barcode`}
                          alt="Barcode"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/inventory/${product.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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