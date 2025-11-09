'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ShoppingCart, Package, Printer, FileText, Settings } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const modules = [
    {
      title: 'Dashboard',
      description: 'Business insights and analytics',
      icon: BarChart3,
      href: '/dashboard',
      color: 'text-indigo-500'
    },
    {
      title: 'Billing',
      description: 'Create invoices and process sales',
      icon: ShoppingCart,
      href: '/billing',
      color: 'text-blue-500'
    },
    {
      title: 'Inventory',
      description: 'Manage products and stock',
      icon: Package,
      href: '/inventory',
      color: 'text-green-500'
    },
    {
      title: 'Barcode Print',
      description: 'Print product labels',
      icon: Printer,
      href: '/barcode-print',
      color: 'text-purple-500'
    },
    {
      title: 'Invoices',
      description: 'View and manage invoices',
      icon: FileText,
      href: '/invoices',
      color: 'text-orange-500'
    },
    {
      title: 'Settings',
      description: 'Configure shop information',
      icon: Settings,
      href: '/settings',
      color: 'text-gray-500'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          💎 Jewelry POS System
        </h1>
        <p className="text-muted-foreground text-lg">
          Complete Point of Sale solution for jewelry stores
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card key={module.title} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(module.href)}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-secondary ${module.color}`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(module.href)} className="w-full">
                Open {module.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}