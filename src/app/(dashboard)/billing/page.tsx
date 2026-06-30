'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  CreditCard, 
  Smartphone, 
  User, 
  ShoppingBag, 
  Printer, 
  Search,
  PlusCircle,
  FileSpreadsheet,
  Info
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { printElement } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { productService, Product } from '@/services/productService';
import { customerService, Customer } from '@/services/customerService';
import { saleService } from '@/services/saleService';

interface BillingItem {
  id: string; // unique local ID for cart management
  type: 'catalog' | 'custom';
  productId: string; // empty if custom
  customName: string;
  customBrand: string;
  quantity: number;
  price: number;
  cost: number; // purchase price for custom items
  imei: string;
  stockAvailable?: number; // for catalog items
}

export default function BillingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Billing Cart State
  const [cartItems, setCartItems] = useState<BillingItem[]>([
    { id: 'item-1', type: 'catalog', productId: '', customName: '', customBrand: '', quantity: 1, price: 0, cost: 0, imei: '' }
  ]);

  // Customer Information State
  const [selectedCustomerId, setSelectedCustomerId] = useState('walk-in');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerModel, setCustomerModel] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCategory, setCustomerCategory] = useState('Retailer');

  // Transaction State
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, cData] = await Promise.all([
        productService.getAllProducts(),
        customerService.getAllCustomers()
      ]);
      setProducts(pData || []);
      setCustomers(cData || []);
    } catch (error) {
      console.error('Error fetching billing dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId === 'walk-in') {
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCustomerWhatsapp('');
      setCustomerModel('');
      setCustomerAddress('');
      setCustomerCategory('Retailer');
    } else {
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        setCustomerName(cust.name || '');
        setCustomerPhone(cust.phone_number || '');
        setCustomerWhatsapp(cust.whatsapp_number || '');
        setCustomerModel(cust.current_mobile_model || '');
        setCustomerAddress(cust.address || '');
        setCustomerCategory(cust.category || 'Retailer');
      }
    }
  };

  const addCartItem = () => {
    const newItemId = `item-${Date.now()}`;
    setCartItems(prev => [
      ...prev,
      { id: newItemId, type: 'catalog', productId: '', customName: '', customBrand: '', quantity: 1, price: 0, cost: 0, imei: '' }
    ]);
  };

  const removeCartItem = (id: string) => {
    if (cartItems.length === 1) {
      // Keep at least one row, just reset it
      setCartItems([
        { id: 'item-1', type: 'catalog', productId: '', customName: '', customBrand: '', quantity: 1, price: 0, cost: 0, imei: '' }
      ]);
      return;
    }
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemField = (itemId: string, field: keyof BillingItem, value: any) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const updated = { ...item, [field]: value };

      // Autofill price & stock when catalog product changes
      if (field === 'productId' && item.type === 'catalog') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated.price = Number(prod.selling_price || 0);
          updated.cost = Number(prod.purchase_price || 0);
          updated.stockAvailable = Number(prod.quantity || 0);
          updated.customName = prod.name;
          updated.customBrand = prod.brand;
        }
      }

      // Reset fields if type changes
      if (field === 'type') {
        updated.productId = '';
        updated.customName = '';
        updated.customBrand = '';
        updated.price = 0;
        updated.cost = 0;
        updated.quantity = 1;
        updated.stockAvailable = undefined;
      }

      return updated;
    }));
  };

  const calculateSubtotal = (item: BillingItem) => {
    return (item.price || 0) * (item.quantity || 0);
  };

  const calculateGrandTotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const handleCheckout = async () => {
    // 1. Validations
    if (cartItems.some(item => item.type === 'catalog' && !item.productId)) {
      alert("Please select a valid catalog product for all selected catalog rows.");
      return;
    }
    if (cartItems.some(item => item.type === 'custom' && !item.customName.trim())) {
      alert("Please specify a product name for all custom items.");
      return;
    }
    if (cartItems.some(item => (item.quantity || 0) <= 0)) {
      alert("Quantity must be greater than 0 for all items.");
      return;
    }

    // Check inventory stock warning
    let stockWarning = false;
    cartItems.forEach(item => {
      if (item.type === 'catalog' && item.stockAvailable !== undefined && item.quantity > item.stockAvailable) {
        stockWarning = true;
      }
    });

    if (stockWarning && !confirm("Warning: One or more selected items exceed your current catalog stock. Do you still want to proceed?")) {
      return;
    }

    try {
      setSubmitting(true);

      // Get the current sales count to calculate sequential invoice number
      let receiptNumber = '01';
      try {
        const { count } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true });
        receiptNumber = String((count || 0) + 1).padStart(2, '0');
      } catch (err) {
        console.error('Error fetching sales count:', err);
      }

      // 2. Manage Customer Profile (Do NOT update automatically, but create Walk-in snapshot if custom name is typed)
      let customerId: string | null = null;
      let finalCustomerName = 'Walk-in Customer';

      if (selectedCustomerId !== 'walk-in') {
        customerId = selectedCustomerId;
        const cust = customers.find(c => c.id === selectedCustomerId);
        if (cust) {
          finalCustomerName = cust.name;
        }
      } else if (customerName && customerName !== 'Walk-in Customer') {
        // Create a Walk-in snapshot record in the database
        const newCust = await customerService.addCustomer({
          name: customerName,
          phone_number: customerPhone || null,
          whatsapp_number: customerWhatsapp || null,
          current_mobile_model: customerModel || null,
          address: customerAddress || null,
          category: 'Walk-in',
        });
        customerId = newCust.id || null;
        finalCustomerName = customerName;
      }

      // 3. Process Custom Items (Register them in the product catalog on-the-fly)
      const resolvedItems = [];
      const receiptItemsSummary = [];

      for (const item of cartItems) {
        let productId = item.productId;
        let pName = item.customName;

        if (item.type === 'custom') {
          // Add custom product to database with initial stock equal to checkout quantity
          const createdProduct = await productService.addProduct({
            name: item.customName,
            brand: item.customBrand || 'Generic',
            purchase_price: Number(item.cost || 0),
            selling_price: Number(item.price || 0),
            quantity: Number(item.quantity), // equal to checkout quantity so stock resolves to 0
            location: 'Direct Bill',
            compatible_with: 'Generic'
          });

          productId = createdProduct.id!;
          pName = createdProduct.name;
        }

        resolvedItems.push({
          product_id: productId,
          quantity: item.quantity,
          price: item.price,
          imei: item.imei || null
        });

        receiptItemsSummary.push({
          name: pName,
          quantity: item.quantity,
          price: item.price,
          imei: item.imei
        });
      }

      // 4. Record the main sale record
      const grandTotal = calculateGrandTotal();
      const salePayload = {
        customer_id: customerId,
        total_amount: grandTotal,
        payment_method: paymentMethod
      };

      const result = await saleService.recordSale(salePayload, resolvedItems);

      // Set state to render receipt
      setLastSale({
        id: result.id,
        invoice_number: receiptNumber,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerName: finalCustomerName,
        customerPhone: customerPhone,
        customerWhatsapp: customerWhatsapp,
        customerModel: customerModel,
        customerAddress: customerAddress,
        customerCategory: customerCategory,
        items: receiptItemsSummary,
        total: grandTotal,
        paymentMethod
      });

      // Clear Cart and refresh page details
      setCartItems([
        { id: 'item-1', type: 'catalog', productId: '', customName: '', customBrand: '', quantity: 1, price: 0, cost: 0, imei: '' }
      ]);
      setSelectedCustomerId('walk-in');
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCustomerWhatsapp('');
      setCustomerModel('');
      setCustomerAddress('');
      setCustomerCategory('Retailer');
      setIsReceiptOpen(true);
      fetchData(); // Reload inventory lists

    } catch (err: any) {
      console.error("Billing error:", err);
      alert("Failed to complete checkout: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    printElement('receipt-content');
  };

  return (
    <div className="space-y-8 bg-[#030712] text-white p-6 rounded-3xl min-h-screen border border-slate-900 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Glowing Highlights */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950/60 p-8 lg:p-12 border border-blue-950/40 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
          <CreditCard className="w-48 h-48 text-blue-500 animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="text-xs font-semibold tracking-[0.25em] text-blue-400 uppercase mb-3 block">Point of Sale</span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 leading-none mb-6">
            BILLING &<br />
            <span className="text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">INVOICE</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
            Record client checkouts. Add items directly from your catalog, or define ad-hoc custom products on-the-fly to generate immediate printed receipts.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 relative z-10">
        
        {/* Customer Information Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-950/40 border-slate-900 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Customer Account
              </CardTitle>
              <CardDescription className="text-slate-400">Select or register the customer profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-slate-400">Search Customers</label>
                <Select value={selectedCustomerId} onValueChange={(val) => handleCustomerChange(val || 'walk-in')}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-850 text-white">
                    <SelectItem value="walk-in" className="hover:bg-slate-800 text-white cursor-pointer">New / Walk-in Customer</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id!} className="hover:bg-slate-800 text-white cursor-pointer">
                        {c.name} {c.phone_number ? `(${c.phone_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-slate-900/60 pt-4 space-y-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Client Name</label>
                  <Input 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="Full Name"
                    className="bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-slate-400">Mobile No</label>
                    <Input 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)} 
                      placeholder="Mobile"
                      className="bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-slate-400">Whatsapp No</label>
                    <Input 
                      value={customerWhatsapp} 
                      onChange={(e) => setCustomerWhatsapp(e.target.value)} 
                      placeholder="Whatsapp"
                      className="bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Current Mobile Model</label>
                  <Input 
                    value={customerModel} 
                    onChange={(e) => setCustomerModel(e.target.value)} 
                    placeholder="e.g. iPhone 15 Pro"
                    className="bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Address / Area</label>
                  <Input 
                    value={customerAddress} 
                    onChange={(e) => setCustomerAddress(e.target.value)} 
                    placeholder="Address"
                    className="bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Customer Category</label>
                  <Select value={customerCategory} onValueChange={(val) => setCustomerCategory(val || 'Retailer')}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-850 text-white">
                      <SelectItem value="Retailer" className="hover:bg-slate-800 text-white cursor-pointer">Retailer</SelectItem>
                      <SelectItem value="Wholesaler" className="hover:bg-slate-800 text-white cursor-pointer">Wholesaler</SelectItem>
                      <SelectItem value="Regular" className="hover:bg-slate-800 text-white cursor-pointer">Regular Customer</SelectItem>
                      <SelectItem value="VIP" className="hover:bg-slate-800 text-white cursor-pointer">VIP</SelectItem>
                      <SelectItem value="Other" className="hover:bg-slate-800 text-white cursor-pointer">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Cart Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-950/40 border-slate-900 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  Cart Items
                </CardTitle>
                <CardDescription className="text-slate-400">Select inventory items or add custom unlisted entries.</CardDescription>
              </div>
              <Button onClick={addCartItem} variant="outline" size="sm" className="gap-1 border-slate-800 hover:bg-slate-900">
                <Plus className="w-4 h-4" /> Add Item Row
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-3 relative group">
                    <button 
                      onClick={() => removeCartItem(item.id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600">Row #{index + 1}</span>
                      <div className="flex bg-slate-900/60 p-0.5 rounded border border-slate-800">
                        <button 
                          onClick={() => updateItemField(item.id, 'type', 'catalog')}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${item.type === 'catalog' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                        >
                          Catalog
                        </button>
                        <button 
                          onClick={() => updateItemField(item.id, 'type', 'custom')}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${item.type === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                        >
                          Custom Item
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      
                      {/* Product Selector / Inputs */}
                      {item.type === 'catalog' ? (
                        <div className="grid gap-1 md:col-span-2">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Select Product</label>
                          <Select value={item.productId} onValueChange={(val) => updateItemField(item.id, 'productId', val)}>
                            <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                              <SelectValue placeholder="Choose Catalog Product" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-850 text-white max-h-[300px]">
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id!} className="hover:bg-slate-800 text-white cursor-pointer">
                                  {p.name} {p.compatible_with ? `(${p.compatible_with})` : ''} - ₹{p.selling_price} [Stock: {p.quantity}]
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.stockAvailable !== undefined && (
                            <span className={`text-[10px] mt-1 ${item.stockAvailable <= 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                              Catalog stock available: {item.stockAvailable} units
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Product Name</label>
                            <Input 
                              value={item.customName}
                              onChange={(e) => updateItemField(item.id, 'customName', e.target.value)}
                              placeholder="e.g. Back Cover Case"
                              className="bg-slate-900 border-slate-800 text-white placeholder-slate-600"
                            />
                          </div>
                          <div className="grid gap-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Brand</label>
                            <Input 
                              value={item.customBrand}
                              onChange={(e) => updateItemField(item.id, 'customBrand', e.target.value)}
                              placeholder="e.g. Generic / Noise"
                              className="bg-slate-900 border-slate-800 text-white placeholder-slate-600"
                            />
                          </div>
                        </>
                      )}

                      <div className="grid gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Serial No. / IMEI (Optional)</label>
                        <Input 
                          value={item.imei}
                          onChange={(e) => updateItemField(item.id, 'imei', e.target.value)}
                          placeholder="Serial No. / IMEI"
                          className="bg-slate-900 border-slate-800 text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 pt-1">
                      <div className="grid gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Quantity</label>
                        <Input 
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemField(item.id, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Price (Selling)</label>
                        <Input 
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItemField(item.id, 'price', Math.max(0, Number(e.target.value) || 0))}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      {item.type === 'custom' && (
                        <div className="grid gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Cost (Buying)</label>
                          <Input 
                            type="number"
                            value={item.cost}
                            onChange={(e) => updateItemField(item.id, 'cost', Math.max(0, Number(e.target.value) || 0))}
                            placeholder="₹ Optional"
                            className="bg-slate-900 border-slate-800 text-white placeholder-slate-600"
                          />
                        </div>
                      )}
                      <div className="grid gap-1 col-span-2 md:col-span-1 flex flex-col justify-end text-right pr-2 pb-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Row Total</span>
                        <span className="text-sm font-black text-blue-400">₹{calculateSubtotal(item).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Controls */}
              <div className="border-t border-slate-900 pt-6 space-y-4">
                
                {/* Info Note on Custom creation */}
                {cartItems.some(i => i.type === 'custom') && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-blue-950/40 bg-blue-950/15 text-xs text-blue-300">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      <strong>Inventory Integration:</strong> Custom items will be automatically registered in your product catalog upon checkout with a stock of 0. Their purchase costs (if specified) will be tracked to ensure accurate margin metrics in your reports.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-400">Payment Mode</label>
                    <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || 'Cash')}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-850 text-white">
                        <SelectItem value="Cash" className="hover:bg-slate-800 text-white cursor-pointer">Cash</SelectItem>
                        <SelectItem value="UPI" className="hover:bg-slate-800 text-white cursor-pointer">UPI / Digital</SelectItem>
                        <SelectItem value="Card" className="hover:bg-slate-800 text-white cursor-pointer">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Grand Total</span>
                      <span className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        ₹{calculateGrandTotal().toLocaleString()}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={handleCheckout} 
                      disabled={submitting} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-6 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Generate Invoice'
                      )}
                    </Button>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Printable Invoice Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={(open) => {
        setIsReceiptOpen(open);
        if (!open) {
          router.push('/sales');
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="no-print">
            <DialogTitle>Sale Successful</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-6 border rounded-lg bg-white text-black font-sans" id="receipt-content">
                <div className="text-center border-b pb-4 mb-4">
                  <h2 className="text-xl font-bold uppercase">Rex Mobile & Computers</h2>
                  <p className="text-xs">Gujrati Market, Burhanpur</p>
                  <p className="text-xs">Ph.No.: 9977800726</p>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span>Receipt No:</span><span className="font-mono uppercase">{lastSale.invoice_number || lastSale.id.split('-')[0]}</span></div>
                  <div className="flex justify-between"><span>Date:</span><span>{lastSale.date}</span></div>
                  <div className="flex justify-between"><span>Time:</span><span>{lastSale.time}</span></div>
                </div>
                
                <div className="border-t pt-2 mb-4 text-xs space-y-1">
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-1">Customer Details</p>
                  <div className="flex justify-between"><span>Name:</span><span>{lastSale.customerName}</span></div>
                  {lastSale.customerPhone && <div className="flex justify-between"><span>Mobile No:</span><span>{lastSale.customerPhone}</span></div>}
                  {lastSale.customerWhatsapp && <div className="flex justify-between no-print"><span>Whatsapp No:</span><span>{lastSale.customerWhatsapp}</span></div>}
                  {lastSale.customerModel && <div className="flex justify-between no-print"><span>Mobile Model:</span><span>{lastSale.customerModel}</span></div>}
                  {lastSale.customerAddress && <div className="flex justify-between"><span>Address/Area:</span><span>{lastSale.customerAddress}</span></div>}
                  {lastSale.customerCategory && <div className="flex justify-between no-print"><span>Category:</span><span>{lastSale.customerCategory}</span></div>}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2">
                      <TableHead className="px-0 text-black h-8">Item</TableHead>
                      <TableHead className="text-center text-black h-8">Qty</TableHead>
                      <TableHead className="text-right px-0 text-black h-8">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastSale.items.map((item: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-transparent border-none">
                        <TableCell className="px-0 py-2">
                          <div>{item.name}</div>
                          {item.imei && <div className="text-[10px] font-mono text-slate-500">Serial No.: {item.imei}</div>}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right px-0">₹{item.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="border-t-2 mt-4 pt-2 text-lg font-bold flex justify-between">
                  <span>Grand Total</span>
                  <span>₹{lastSale.total.toLocaleString()}</span>
                </div>
                <div className="mt-4 text-center text-xs font-semibold border-t pt-4 space-y-1">
                  <p>Please Check Before Purchase</p>
                  <p>No Guarantee - No Warranty</p>
                  <p>No Return - No Exchange</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="no-print flex-col sm:flex-row gap-2">
            <Button className="flex-1 gap-2" onClick={handlePrint}><Printer className="w-4 h-4" /> Print</Button>
            <Button variant="outline" className="flex-1" onClick={() => {
              setIsReceiptOpen(false);
              router.push('/sales');
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
