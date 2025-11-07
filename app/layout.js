import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Jewelry POS System',
  description: 'Complete Point of Sale system for jewelry stores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <nav className="border-b bg-card">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="text-xl font-bold text-primary">
                    💎 POS System
                  </Link>
                  <div className="hidden md:flex space-x-4">
                    <NavLink href="/billing">Billing</NavLink>
                    <NavLink href="/inventory">Inventory</NavLink>
                    <NavLink href="/barcode-print">Barcode Print</NavLink>
                    <NavLink href="/invoices">Invoices</NavLink>
                    <NavLink href="/settings">Settings</NavLink>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

function NavLink({ href, children }) {
  return (
    <Link 
      href={href}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
