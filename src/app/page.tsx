'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/layout/AuthContext';
import { 
  Package, 
  Receipt, 
  ShoppingCart, 
  Loader2, 
  LogOut, 
  ArrowRight, 
  Smartphone, 
  TrendingUp, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RootPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalSales: 0
  });

  // 1. Session Redirect Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // 2. Fetch Live Dashboard Metrics from Supabase
  useEffect(() => {
    if (user) {
      fetchLiveStats();
    }
  }, [user]);

  const fetchLiveStats = async () => {
    try {
      setLoadingStats(true);
      const [productsRes, salesRes] = await Promise.all([
        supabase.from('products').select('id, quantity', { count: 'exact' }),
        supabase.from('sales').select('id', { count: 'exact' })
      ]);

      const productsList = productsRes.data || [];
      const lowStockCount = productsList.filter(p => p.quantity < 5).length;

      setStats({
        totalProducts: productsRes.count || 0,
        lowStock: lowStockCount,
        totalSales: salesRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show a clean, branded loading spinner during initial session validation
  if (authLoading || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f6f6f7] gap-4">
        <div className="p-3 bg-primary/5 rounded-full animate-bounce">
          <Smartphone className="w-8 h-8 text-primary" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  const actions = [
    {
      title: 'Inventory',
      description: 'Manage active stock items, monitor warehouse locations, adjust buying/selling prices, and add new inventory products.',
      icon: Package,
      href: '/inventory',
      buttonText: 'Manage Stock',
      color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
    },
    {
      title: 'POS Billing',
      description: 'Conduct client checkouts, specify payment types (Cash, UPI, Card), record IMEI codes, and print clean thermal customer receipts.',
      icon: Receipt,
      href: '/billing',
      buttonText: 'Launch POS Billing',
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
    },
    {
      title: 'Sales History',
      description: 'Browse past store transactions, view receipt clones, download CSV spreadsheets, and edit details (Admin: delete/void sales).',
      icon: ShoppingCart,
      href: '/sales',
      buttonText: 'View Transactions',
      color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-[#1a1a1a] flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e1e3e5] px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary">
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="font-bold text-base lg:text-lg tracking-tight">Rex Mobile & Computers</span>
        </div>
        
        <div className="flex items-center gap-3 lg:gap-4">
          {profile && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-700 capitalize">
              {profile.role}: {profile.name}
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-[#6d7175] hover:text-destructive hover:bg-destructive/5 font-medium gap-2 text-sm h-9 px-3"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 lg:py-12 space-y-8 lg:space-y-12">
        
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto space-y-4 py-4">
          <Badge className="bg-primary/5 text-primary border-primary/15 font-semibold text-xs tracking-wide px-2.5 py-1 uppercase rounded-full">
            Store Management OS
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            The operating system for your retail business.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
            Manage warehouse inventory, execute point of sale billing, register clients, and review historical shop records from one optimized portal.
          </p>
        </section>

        {/* Dynamic KPI Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-[#e1e3e5] shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Inventory</span>
              <Package className="w-4 h-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">{stats.totalProducts} items</div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Unique active products registered</p>
            </CardContent>
          </Card>

          <Card className="border border-[#e1e3e5] shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
              <AlertTriangle className={`w-4 h-4 ${stats.lowStock > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <div className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {stats.lowStock} products
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Items currently under 5 units</p>
            </CardContent>
          </Card>

          <Card className="border border-[#e1e3e5] shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">{stats.totalSales} sales</div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Completed checkout orders logged</p>
            </CardContent>
          </Card>
        </section>

        {/* Primary Action Modules Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <Card key={act.title} className="border border-[#e1e3e5] hover:border-slate-300 shadow-none bg-white flex flex-col justify-between transition-colors">
                <CardHeader>
                  <div className={`p-2.5 rounded-lg w-fit ${act.color} mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">{act.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 leading-relaxed mt-1">
                    {act.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={act.href} passHref className="w-full">
                    <Button className="w-full gap-2 text-xs font-semibold h-10 border border-[#ccd0d4] hover:bg-[#f6f6f7] shadow-none" variant="outline">
                      <span>{act.buttonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>

      {/* Clean Merchant Footer */}
      <footer className="bg-white border-t border-[#e1e3e5] py-8 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-medium text-slate-600">Rex Mobile & Computers Store Portal</p>
          <p className="max-w-md mx-auto text-[10px] leading-relaxed">
            Please Check Before Purchase &bull; No Guarantee - No Warranty &bull; No Return - No Exchange
          </p>
          <p className="text-[10px] pt-2">&copy; {new Date().getFullYear()} Rex Mobile. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
