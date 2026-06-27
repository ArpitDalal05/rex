'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  Loader2
} from "lucide-react";
import { productService } from '@/services/productService';
import { saleService } from '@/services/saleService';
import { customerService } from '@/services/customerService';

export default function DashboardStatsPage() {
  const [stats, setStats] = useState({
    products: 0,
    lowStock: 0,
    sales: 0,
    customers: 0,
    totalRevenue: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [productsData, salesData, customersData] = await Promise.all([
        productService.getAllProducts(),
        saleService.getAllSales(),
        customerService.getAllCustomers()
      ]);

      const products = productsData || [];
      const sales = salesData || [];
      const customers = customersData || [];

      const lowStockCount = products.filter(p => p.quantity < 5).length;
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

      setStats({
        products: products.length,
        lowStock: lowStockCount,
        sales: sales.length,
        customers: customers.length,
        totalRevenue
      });

      setRecentSales(sales.slice(0, 5));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      description: "Based on all recorded sales",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Total Products",
      value: stats.products.toString(),
      description: "Items currently in inventory",
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStock.toString(),
      description: "Products with less than 5 units",
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      title: "Total Customers",
      value: stats.customers.toString(),
      description: "Registered in database",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Stats</h1>
        <p className="text-muted-foreground">Detailed metrics of your shop's performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>A list of recent transactions from your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">{sale.id?.split('-')[0]}</TableCell>
                  <TableCell>{sale.customers?.name || "Walk-in"}</TableCell>
                  <TableCell>₹{sale.total_amount}</TableCell>
                  <TableCell>{sale.payment_method}</TableCell>
                  <TableCell>{new Date(sale.created_at!).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {recentSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No recent sales.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
