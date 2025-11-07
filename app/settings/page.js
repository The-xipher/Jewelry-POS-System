'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, Store } from 'lucide-react';
import useSettingsStore from '@/store/settingsStore';

export default function SettingsPage() {
  const { shopInfo, setShopInfo, loadShopInfo } = useSettingsStore();
  const [formData, setFormData] = useState(shopInfo);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadShopInfo().then(() => {
      setFormData(useSettingsStore.getState().shopInfo);
    });
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Shop name is required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setShopInfo(data);
        toast.success('Settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your shop information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Store className="h-5 w-5" />
            <div>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>
                This information will be displayed on invoices and receipts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Golden Jewels"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., +91 98765 43210"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your shop address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                placeholder="e.g., 22AAAAA0000A1Z5"
                value={formData.gst}
                onChange={(e) => handleChange('gst', e.target.value)}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 These details will appear on all printed invoices and thermal receipts.
              </p>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full" size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">System</span>
            <span className="font-medium">Jewelry POS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium">MongoDB</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
