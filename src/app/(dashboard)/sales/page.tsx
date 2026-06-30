'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, Eye, Edit, Trash2 } from 'lucide-react';
import { saleService } from '@/services/saleService';
import { customerService, Customer } from '@/services/customerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { printElement } from '@/lib/utils';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSaleId, setEditSaleId] = useState<string>('');
  const [editCustomerId, setEditCustomerId] = useState<string>('walk-in');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('UPI');
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await saleService.getAllSales();
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleOpenReceipt = (sale: any, receiptNum: string) => {
    setSelectedSale({
      id: sale.id,
      invoice_number: receiptNum,
      date: new Date(sale.created_at).toLocaleDateString(),
      time: new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: sale.customers?.name || 'Walk-in Customer',
      customerPhone: sale.customers?.phone_number || '',
      customerWhatsapp: sale.customers?.whatsapp_number || '',
      customerModel: sale.customers?.current_mobile_model || '',
      customerAddress: sale.customers?.address || '',
      customerCategory: sale.customers?.category || '',
      total: sale.total_amount,
      paymentMethod: sale.payment_method,
      imei: sale.sale_items?.[0]?.imei || null,
      items: sale.sale_items || []
    });
    setIsReceiptOpen(true);
  };

  const handleOpenEdit = (sale: any) => {
    setEditSaleId(sale.id);
    setEditCustomerId(sale.customer_id || 'walk-in');
    setEditPaymentMethod(sale.payment_method);
    setEditTotalAmount(sale.total_amount);
    setIsEditOpen(true);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saleService.updateSale(editSaleId, {
        customer_id: editCustomerId === 'walk-in' ? null : editCustomerId,
        payment_method: editPaymentMethod,
        total_amount: Number(editTotalAmount)
      });
      setIsEditOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      alert('Failed to update sale.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (window.confirm("Are you sure you want to delete this sale? This will restore the product stock quantities in inventory.")) {
      try {
        await saleService.deleteSale(saleId);
        fetchSales();
      } catch (error) {
        console.error("Error deleting sale:", error);
        alert("Failed to delete sale.");
      }
    }
  };

  const handlePrint = () => {
    printElement('receipt-content');
  };

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Sales</h1>
        <p className='text-muted-foreground'>View and manage all sales transactions.</p>
      </div>

      <Card className='border-none shadow-sm'>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent className='p-0 sm:p-6'>
          {loading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='px-4'>Sale ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className='hidden sm:table-cell'>Date</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale, idx) => {
                    const receiptNum = String(sales.length - idx).padStart(2, '0');
                    const productList = sale.sale_items && sale.sale_items.length > 0
                      ? sale.sale_items.map((item: any) => item.products?.name || 'Product').join(', ')
                      : 'No products';
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className='px-4 font-mono text-xs'>{receiptNum}</TableCell>
                        <TableCell>{sale.customers?.name || 'Walk-in'}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={productList}>{productList}</TableCell>
                        <TableCell className='font-medium'>₹{sale.total_amount}</TableCell>
                        <TableCell>{sale.payment_method}</TableCell>
                        <TableCell className='hidden sm:table-cell text-muted-foreground text-sm'>
                          {new Date(sale.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className="flex justify-end items-center gap-1">
                            <Button variant='ghost' size='sm' className='gap-1 h-8 text-xs' onClick={() => handleOpenReceipt(sale, receiptNum)}>
                              <Printer className='w-3.5 h-3.5' />
                              <span className="hidden md:inline">Receipt</span>
                            </Button>
                            
                            <Button variant='ghost' size='sm' className='gap-1 h-8 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20' onClick={() => handleOpenEdit(sale)}>
                              <Edit className='w-3.5 h-3.5' />
                              <span className="hidden md:inline">Edit</span>
                            </Button>
                            
                            <Button variant='ghost' size='sm' className='gap-1 h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' onClick={() => handleDeleteSale(sale.id)}>
                              <Trash2 className='w-3.5 h-3.5' />
                              <span className="hidden md:inline">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {sales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                        No sales found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sale Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sale Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSale} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Profile</label>
              <Select value={editCustomerId} onValueChange={(val) => setEditCustomerId(val || 'walk-in')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id || ''}>
                      {c.name} {c.phone_number ? `(${c.phone_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={editPaymentMethod} onValueChange={(val) => setEditPaymentMethod(val || 'UPI')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="WhatsApp Pay">WhatsApp Pay</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Amount (₹)</label>
              <Input
                type="number"
                required
                value={editTotalAmount}
                onChange={(e) => setEditTotalAmount(Number(e.target.value))}
                placeholder="Enter Total Amount"
                className="w-full"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sale Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader className='no-print'>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
              <div className='p-6 border rounded-lg bg-white text-black font-sans' id='receipt-content'>
                <div className='text-center border-b pb-4 mb-4'>
                  <h2 className='text-xl font-bold uppercase'>Rex Mobile & Computers</h2>
                  <p className='text-xs'>Gujrati Market, Burhanpur</p>
                  <p className='text-xs'>Ph.No.: 9977800726</p>
                </div>
                <div className='space-y-2 text-sm mb-4'>
                  <div className='flex justify-between'><span>Receipt No:</span><span className='font-mono uppercase'>{selectedSale.invoice_number || selectedSale.id.split('-')[0]}</span></div>
                  <div className='flex justify-between'><span>Date:</span><span>{selectedSale.date}</span></div>
                  <div className='flex justify-between'><span>Time:</span><span>{selectedSale.time}</span></div>
                  {selectedSale.imei && <div className='flex justify-between font-mono text-xs'><span>Serial No.:</span><span>{selectedSale.imei}</span></div>}
                </div>
                
                <div className='border-t pt-2 mb-4 text-xs space-y-1'>
                  <p className='font-semibold uppercase tracking-wider text-muted-foreground mb-1'>Customer Details</p>
                  <div className='flex justify-between'><span>Name:</span><span>{selectedSale.customerName}</span></div>
                  {selectedSale.customerPhone && <div className='flex justify-between'><span>Mobile No:</span><span>{selectedSale.customerPhone}</span></div>}
                  {selectedSale.customerWhatsapp && <div className='flex justify-between no-print'><span>Whatsapp No:</span><span>{selectedSale.customerWhatsapp}</span></div>}
                  {selectedSale.customerModel && <div className='flex justify-between no-print'><span>Mobile Model:</span><span>{selectedSale.customerModel}</span></div>}
                  {selectedSale.customerAddress && <div className='flex justify-between'><span>Address/Area:</span><span>{selectedSale.customerAddress}</span></div>}
                  {selectedSale.customerCategory && <div className='flex justify-between no-print'><span>Category:</span><span>{selectedSale.customerCategory}</span></div>}
                </div>

                <Table>
                  <TableHeader><TableRow className='hover:bg-transparent border-b-2'><TableHead className='px-0 text-black h-8'>Item</TableHead><TableHead className='text-center text-black h-8'>Qty</TableHead><TableHead className='text-right px-0 text-black h-8'>Price</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      selectedSale.items.map((item: any, idx: number) => (
                        <TableRow key={idx} className='hover:bg-transparent border-none'>
                          <TableCell className='px-0 py-2'>
                            <div>{item.products?.name || 'Product'}</div>
                            {item.imei && <div className='text-[10px] font-mono text-slate-500'>Serial No.: {item.imei}</div>}
                          </TableCell>
                          <TableCell className='text-center'>{item.quantity}</TableCell>
                          <TableCell className='text-right px-0'>₹{item.price}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className='hover:bg-transparent border-none'>
                        <TableCell className='px-0 py-2'>
                          <div>{selectedSale.productName}</div>
                          {selectedSale.imei && <div className='text-[10px] font-mono text-slate-500'>Serial No.: {selectedSale.imei}</div>}
                        </TableCell>
                        <TableCell className='text-center'>1</TableCell>
                        <TableCell className='text-right px-0'>₹{selectedSale.total}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className='border-t-2 mt-4 pt-2 text-lg font-bold flex justify-between'>
                  <span>Grand Total</span>
                  <span>₹{selectedSale.total}</span>
                </div>
                <div className='mt-8 text-center text-xs font-semibold border-t pt-4 space-y-1'>
                  <p>Please Check Before Purchase</p>
                  <p>No Guarantee - No Warranty</p>
                  <p>No Return - No Exchange</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className='no-print flex gap-2'>
            <Button className='flex-1 gap-2' onClick={handlePrint}><Printer className='w-4 h-4' /> Print</Button>
            <Button variant='outline' className='flex-1' onClick={() => setIsReceiptOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
