'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Smartphone,
  Menu,
  X,
  Lock,
  Receipt,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/layout/AuthContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', icon: Sparkles, href: '/' },
  { label: 'Business Stats', icon: LayoutDashboard, href: '/dashboard-stats', adminOnly: false },
  { label: 'Billing', icon: Receipt, href: '/billing', adminOnly: false },
  { label: 'Inventory', icon: Package, href: '/inventory', adminOnly: false },
  { label: 'Products (Cards)', icon: Smartphone, href: '/products', adminOnly: false },
  { label: 'Sales', icon: ShoppingCart, href: '/sales', adminOnly: false },
  { label: 'Customers', icon: Users, href: '/customers', adminOnly: false },
  { label: 'Staff Directory', icon: Users, href: '/users', adminOnly: true },
  { label: 'Reports', icon: BarChart3, href: '/reports', adminOnly: true },
  { label: 'User Access', icon: Lock, href: '/user-access', adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { role, loading } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && role !== 'Admin') {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f6f6f7] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f6f6f7] overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Smartphone className="w-6 h-6 text-primary" />
          <span>Rex Mobile</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 border-r bg-card flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-2 font-bold text-xl">
          <Smartphone className="w-8 h-8 text-primary" />
          <span>Rex Mobile</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          {role === 'Admin' && (
            <Link href="/user-access" className="w-full block">
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground text-sm font-medium h-10">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Button>
            </Link>
          )}
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 text-sm font-medium h-10"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8 mt-16 lg:mt-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
