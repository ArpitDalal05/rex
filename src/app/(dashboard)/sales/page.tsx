'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, Eye } from 'lucide-react';
import { saleService } from '@/services/saleService';
import { Button } from '@/components/ui/button';
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
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchSales();
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

  const handleOpenReceipt = (sale: any) => {
    setSelectedSale({
      id: sale.id,
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
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className='hidden sm:table-cell'>Date</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className='px-4 font-mono text-xs'>{sale.id?.split('-')[0]}</TableCell>
                      <TableCell>{sale.customers?.name || 'Walk-in'}</TableCell>
                      <TableCell className='font-medium'>₹{sale.total_amount}</TableCell>
                      <TableCell>{sale.payment_method}</TableCell>
                      <TableCell className='hidden sm:table-cell text-muted-foreground text-sm'>
                        {new Date(sale.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button variant='ghost' size='sm' className='gap-2' onClick={() => handleOpenReceipt(sale)}>
                          <Printer className='w-4 h-4' />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
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

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader className='no-print'>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className='p-6 border rounded-lg bg-white text-black font-sans' id='receipt-content'>
              <div className='text-center border-b pb-4 mb-4'>
                <h2 className='text-xl font-bold uppercase'>Rex Mobile & Computers</h2>
                <p className='text-xs'>Gujrati Market, Burhanpur</p>
                <p className='text-xs'>Ph.No.: 9977800726</p>
              </div>
              <div className='space-y-2 text-sm mb-4'>
                <div className='flex justify-between'><span>Receipt No:</span><span className='font-mono uppercase'>{selectedSale.id.split('-')[0]}</span></div>
                <div className='flex justify-between'><span>Date:</span><span>{selectedSale.date}</span></div>
                <div className='flex justify-between'><span>Time:</span><span>{selectedSale.time}</span></div>
                {selectedSale.imei && <div className='flex justify-between font-mono text-xs'><span>Serial No.:</span><span>{selectedSale.imei}</span></div>}
              </div>
              
              <div className='border-t pt-2 mb-4 text-xs space-y-1'>
                <p className='font-semibold uppercase tracking-wider text-muted-foreground mb-1'>Customer Details</p>
                <div className='flex justify-between'><span>Name:</span><span>{selectedSale.customerName}</span></div>
                {selectedSale.customerPhone && <div className='flex justify-between'><span>Mobile No:</span><span>{selectedSale.customerPhone}</span></div>}
                {selectedSale.customerWhatsapp && <div className='flex justify-between'><span>Whatsapp No:</span><span>{selectedSale.customerWhatsapp}</span></div>}
                {selectedSale.customerModel && <div className='flex justify-between'><span>Mobile Model:</span><span>{selectedSale.customerModel}</span></div>}
                {selectedSale.customerAddress && <div className='flex justify-between'><span>Address/Area:</span><span>{selectedSale.customerAddress}</span></div>}
                {selectedSale.customerCategory && <div className='flex justify-between'><span>Category:</span><span>{selectedSale.customerCategory}</span></div>}
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
              <div className='mt-8 text-center text-xs italic border-t pt-4'>
                <p>Thank you for your business!</p>
                <p>Visit again!</p>
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
