import React from 'react';
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
  TrendingUp 
} from "lucide-react";

const stats = [
  {
    title: "Total Sales",
    value: "₹1,28,450",
    description: "+12% from last month",
    icon: DollarSign,
    color: "text-green-500",
  },
  {
    title: "Products",
    value: "452",
    description: "24 new this week",
    icon: Package,
    color: "text-blue-500",
  },
  {
    title: "Low Stock",
    value: "12",
    description: "Requires immediate attention",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  {
    title: "Monthly Profit",
    value: "₹42,200",
    description: "+8% from last month",
    icon: TrendingUp,
    color: "text-purple-500",
  },
];

const recentSales = [
  { id: "INV001", customer: "Arpit Dalal", product: "iPhone 15 Pro", amount: "₹1,24,900", date: "2026-05-30" },
  { id: "INV002", customer: "John Doe", product: "Samsung S24 Ultra", amount: "₹1,09,900", date: "2026-05-29" },
  { id: "INV003", customer: "Sarah Smith", product: "OnePlus 12", amount: "₹64,999", date: "2026-05-29" },
  { id: "INV004", customer: "Mike Johnson", product: "Google Pixel 8", amount: "₹75,999", date: "2026-05-28" },
  { id: "INV005", customer: "Emily Brown", product: "Redmi Note 13 Pro", amount: "₹25,999", date: "2026-05-28" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>{sale.product}</TableCell>
                  <TableCell>{sale.amount}</TableCell>
                  <TableCell>{sale.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
