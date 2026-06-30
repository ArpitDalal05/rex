'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Loader2, 
  DollarSign, 
  TrendingDown, 
  ShoppingBag,
  CreditCard,
  Wallet,
  Smartphone,
  Calendar,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saleService } from '@/services/saleService';
import { productService } from '@/services/productService';

interface ChartPoint {
  dateStr: string;
  label: string;
  value: number;
}

export default function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Analytics State
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalSalesCount: 0,
    averageOrderValue: 0,
    topProduct: { name: 'N/A', quantity: 0 },
    paymentBreakdown: { Cash: 0, UPI: 0, Card: 0 }
  });

  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [salesData, productsData] = await Promise.all([
        saleService.getAllSales(),
        productService.getAllProducts()
      ]);

      const activeSales = salesData || [];
      const activeProducts = productsData || [];
      
      setSales(activeSales);
      setProducts(activeProducts);

      // 1. Calculate Revenue & Profit
      let revenue = 0;
      let profit = 0;
      let paymentMethods = { Cash: 0, UPI: 0, Card: 0 };
      
      const productCounts: { [key: string]: { name: string; quantity: number } } = {};

      activeSales.forEach(sale => {
        revenue += Number(sale.total_amount || 0);
        
        // Payment method tally
        const method = sale.payment_method as 'Cash' | 'UPI' | 'Card';
        if (paymentMethods[method] !== undefined) {
          paymentMethods[method] += Number(sale.total_amount || 0);
        } else {
          // Fallback or custom methods
          paymentMethods.Cash += Number(sale.total_amount || 0);
        }

        // Sale items breakdown for profit & top product
        if (sale.sale_items) {
          sale.sale_items.forEach((item: any) => {
            const sellPrice = Number(item.price || 0);
            const qty = Number(item.quantity || 0);
            const buyPrice = Number(item.products?.purchase_price || 0);
            
            profit += qty * (sellPrice - buyPrice);

            // Top selling product tally
            const pId = item.product_id;
            const pName = item.products?.name || 'Unknown Product';
            if (pId) {
              if (!productCounts[pId]) {
                productCounts[pId] = { name: pName, quantity: 0 };
              }
              productCounts[pId].quantity += qty;
            }
          });
        }
      });

      // Find top selling product
      let topProduct = { name: 'N/A', quantity: 0 };
      Object.values(productCounts).forEach(prod => {
        if (prod.quantity > topProduct.quantity) {
          topProduct = prod;
        }
      });

      // Average Order Value
      const aov = activeSales.length > 0 ? (revenue / activeSales.length) : 0;
      
      // Profit Margin percentage
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      setStats({
        totalRevenue: revenue,
        totalProfit: profit,
        profitMargin: margin,
        totalSalesCount: activeSales.length,
        averageOrderValue: aov,
        topProduct,
        paymentBreakdown: paymentMethods
      });

      // 2. Generate Sales Trend Chart Data (Last 7 Days)
      const formatDateStr = (d: Date) => d.toISOString().slice(0, 10);
      
      const salesByDay: { [dateStr: string]: number } = {};
      activeSales.forEach(sale => {
        if (sale.created_at) {
          const dateStr = sale.created_at.slice(0, 10); // YYYY-MM-DD
          salesByDay[dateStr] = (salesByDay[dateStr] || 0) + Number(sale.total_amount || 0);
        }
      });

      const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = formatDateStr(d);
        return {
          dateStr,
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: salesByDay[dateStr] || 0
        };
      });

      setChartData(last7DaysData);

    } catch (error) {
      console.error("Error generating report analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReportToCSV = () => {
    if (sales.length === 0) return;

    const headers = ["Sale ID", "Date", "Customer", "Item Description", "Qty", "Selling Price", "Total Amount", "Payment Method"];
    const rows: string[][] = [];

    sales.forEach(sale => {
      const dateStr = new Date(sale.created_at).toLocaleDateString();
      const customer = sale.customers?.name || "Walk-in";
      const payment = sale.payment_method;
      
      if (sale.sale_items && sale.sale_items.length > 0) {
        sale.sale_items.forEach((item: any) => {
          rows.push([
            sale.id.split('-')[0],
            dateStr,
            customer,
            item.products?.name || "Product",
            item.quantity.toString(),
            item.price.toString(),
            (item.quantity * item.price).toString(),
            payment
          ]);
        });
      } else {
        rows.push([
          sale.id.split('-')[0],
          dateStr,
          customer,
          "N/A",
          "1",
          sale.total_amount.toString(),
          sale.total_amount.toString(),
          payment
        ]);
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `sales_report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Computations
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1000);
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const points = chartData.map((d, idx) => {
    const x = paddingX + (idx * (chartWidth - paddingX * 2) / 6);
    const y = chartHeight - paddingY - (d.value / maxChartValue) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const linePath = points.length > 0 
    ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
    : '';

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Calculating store metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance insights calculated in real-time.</p>
        </div>
        <Button className="gap-2" variant="outline" onClick={exportReportToCSV}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Calculated across all transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{stats.totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Selling price minus purchase cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average profit percentage on sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Selling Product</CardTitle>
            <ShoppingBag className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={stats.topProduct.name}>
              {stats.topProduct.name}
            </div>
            <p className="text-xs text-muted-foreground">{stats.topProduct.quantity} units sold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Sales Trend Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily revenue generated over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[200px] w-full relative">
              {chartData.length > 0 ? (
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={(chartHeight - paddingY * 2) / 2 + paddingY} x2={chartWidth - paddingX} y2={(chartHeight - paddingY * 2) / 2 + paddingY} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="hsl(var(--border))" />

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#chartGradient)" />

                  {/* Trend Line */}
                  <path d={linePath} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Chart Points */}
                  {points.map((p, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="5" 
                        fill="rgb(59, 130, 246)" 
                        stroke="hsl(var(--background))" 
                        strokeWidth="2"
                        className="transition-all group-hover:r-7" 
                      />
                      {/* Hover Tooltip Value */}
                      <text 
                        x={p.x} 
                        y={p.y - 10} 
                        textAnchor="middle" 
                        className="text-[10px] fill-foreground font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      >
                        ₹{p.value}
                      </text>
                      {/* X-axis Label */}
                      <text 
                        x={p.x} 
                        y={chartHeight - 4} 
                        textAnchor="middle" 
                        className="text-[10px] fill-muted-foreground"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}

                  {/* Y-axis Labels */}
                  <text x={paddingX - 8} y={paddingY + 4} textAnchor="end" className="text-[9px] fill-muted-foreground">
                    ₹{Math.round(maxChartValue)}
                  </text>
                  <text x={paddingX - 8} y={(chartHeight - paddingY * 2) / 2 + paddingY + 4} textAnchor="end" className="text-[9px] fill-muted-foreground">
                    ₹{Math.round(maxChartValue / 2)}
                  </text>
                  <text x={paddingX - 8} y={chartHeight - paddingY + 4} textAnchor="end" className="text-[9px] fill-muted-foreground">
                    ₹0
                  </text>
                </svg>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No sales trend data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Breakdown of sales revenue by payment mode.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-4">
              {/* Cash */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-500" />
                    <span>Cash Sales</span>
                  </div>
                  <span>₹{stats.paymentBreakdown.Cash.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all" 
                    style={{ width: `${stats.totalRevenue > 0 ? (stats.paymentBreakdown.Cash / stats.totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* UPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <span>UPI / Digital</span>
                  </div>
                  <span>₹{stats.paymentBreakdown.UPI.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all" 
                    style={{ width: `${stats.totalRevenue > 0 ? (stats.paymentBreakdown.UPI / stats.totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-500" />
                    <span>Card Sales</span>
                  </div>
                  <span>₹{stats.paymentBreakdown.Card.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all" 
                    style={{ width: `${stats.totalRevenue > 0 ? (stats.paymentBreakdown.Card / stats.totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Average Order Value:</span>
                <span className="font-semibold text-foreground">₹{Math.round(stats.averageOrderValue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Orders Placed:</span>
                <span className="font-semibold text-foreground">{stats.totalSalesCount} sales</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
