'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { BarChart3 } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary">
              💎 POS System
            </Link>
            <div className="hidden md:flex space-x-4">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/billing">Billing</NavLink>
              <NavLink href="/inventory">Inventory</NavLink>
              <NavLink href="/barcode-print">Barcode Print</NavLink>
              <NavLink href="/invoices">Invoices</NavLink>
              <NavLink href="/settings">Settings</NavLink>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children }) {
  return (
    <Link 
      href={href}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  )
}