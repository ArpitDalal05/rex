'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Camera,
  Image as ImageIcon,
  ShoppingCart,
  Printer,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { productService, Product } from '@/services/productService';
import { saleService } from '@/services/saleService';
import { customerService, Customer } from '@/services/customerService';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { printElement } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);

  const { register, handleSubmit, reset } = useForm<Product>();

  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellImei, setSellImei] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('walk-in');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerModel, setCustomerModel] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCategory, setCustomerCategory] = useState('Retailer');

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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id || null);
    reset({
      ...product,
      purchase_price: Number(product.purchase_price),
      selling_price: Number(product.selling_price),
      quantity: Number(product.quantity),
    });
    setImagePreview(product.image_url || null);
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
    setIsViewOpen(true);
  };

  const handleSellInit = (product: Product) => {
    setSellingProduct(product);
    setSellPrice(Number(product.selling_price));
    setSellQuantity(1);
    setSellImei('');
    setSelectedCustomerId('walk-in');
    setPaymentMethod('Cash');
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setCustomerWhatsapp('');
    setCustomerModel('');
    setCustomerAddress('');
    setCustomerCategory('Retailer');
    setIsSellOpen(true);
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

  const onProductSubmit = async (data: Product) => {
    try {
      setIsSubmitting(true);
      let image_url = imagePreview && !selectedFile ? imagePreview : null;
      if (selectedFile) {
        image_url = await productService.uploadProductImage(selectedFile);
      }

      const payload = {
        ...data,
        purchase_price: Number(data.purchase_price),
        selling_price: Number(data.selling_price),
        quantity: Number(data.quantity),
        image_url
      };

      if (editingId) {
        await productService.updateProduct(editingId, payload);
      } else {
        await productService.addProduct(payload);
      }

      setIsFormOpen(false);
      resetProductForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(error.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordSale = async () => {
    if (!sellingProduct) return;
    if (sellQuantity > (sellingProduct.quantity || 0)) {
      alert('Not enough stock available!');
      return;
    }

    try {
      setIsSubmitting(true);

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
      
      // Manage Customer Profile (Do NOT update automatically, but create Walk-in snapshot if custom name is typed)
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

      const salePayload = {
        customer_id: customerId,
        total_amount: sellPrice * sellQuantity,
        payment_method: paymentMethod
      };

      const itemsPayload = [{
        product_id: sellingProduct.id!,
        quantity: sellQuantity,
        price: sellPrice,
        imei: sellImei || null
      }];

      const result = await saleService.recordSale(salePayload, itemsPayload);

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
        productName: sellingProduct.name,
        quantity: sellQuantity,
        price: sellPrice,
        total: sellPrice * sellQuantity,
        paymentMethod,
        imei: sellImei
      });

      setIsSellOpen(false);
      setIsReceiptOpen(true);
      fetchData();
    } catch (error) {
      console.error('Sale error:', error);
      alert('Failed to record sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    printElement('receipt-content');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetProductForm = () => {
    reset({
      name: '',
      brand: '',
      purchase_price: 0,
      selling_price: 0,
      quantity: 1,
      location: '',
      compatible_with: ''
    });
    setEditingId(null);
    setImagePreview(null);
    setSelectedFile(null);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.compatible_with && p.compatible_with.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl lg:text-3xl font-bold tracking-tight'>Inventory</h1>
          <p className='text-sm text-muted-foreground'>Manage your product stock and details.</p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetProductForm();
        }}>
          <DialogTrigger render={<Button className='gap-2 w-full sm:w-auto' />}>
            <Plus className='w-4 h-4' />
            Add Product
          </DialogTrigger>
          <DialogContent className='sm:max-w-[550px] max-h-[90vh] overflow-y-auto'>
            <form onSubmit={handleSubmit(onProductSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='flex flex-col items-center gap-4 py-2 border-2 border-dashed rounded-lg bg-muted/50 relative group'>
                  {imagePreview ? (
                    <img src={imagePreview} alt='Preview' className='w-32 h-32 object-contain rounded-md' />
                  ) : (
                    <div className='w-32 h-32 flex flex-col items-center justify-center text-muted-foreground'>
                      <ImageIcon className='w-12 h-12 mb-2' />
                      <span className='text-xs text-center px-4'>Click to upload</span>
                    </div>
                  )}
                  <Input type='file' accept='image/*' className='absolute inset-0 opacity-0 cursor-pointer' onChange={handleImageChange} />
                </div>
                <div className='grid gap-2'>
                  <label className='text-sm font-medium'>Product Name</label>
                  <Input {...register('name', { required: true })} placeholder='e.g. iPhone 15 Pro' />
                </div>
                <div className='grid gap-2'>
                  <label className='text-sm font-medium'>Compatible With</label>
                  <Input {...register('compatible_with')} placeholder='e.g. Universal, iPhone 14, 15' />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <label className='text-sm font-medium'>Brand</label>
                    <Input {...register('brand', { required: true })} placeholder='Apple, Samsung, etc.' />
                  </div>
                  <div className='grid gap-2'>
                    <label className='text-sm font-medium'>Location</label>
                    <Input {...register('location')} placeholder='e.g. Shelf A1' />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <label className='text-sm font-medium'>Purchase Price</label>
                    <Input type='number' step='0.01' {...register('purchase_price', { required: true })} placeholder='₹' />
                  </div>
                  <div className='grid gap-2'>
                    <label className='text-sm font-medium'>Selling Price</label>
                    <Input type='number' step='0.01' {...register('selling_price', { required: true })} placeholder='₹' />
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4'>
                  <div className='grid gap-2'>
                    <label className='text-sm font-medium'>Initial Quantity</label>
                    <Input type='number' {...register('quantity', { required: true })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type='submit' disabled={isSubmitting} className='w-full'>
                  {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Save Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className='overflow-hidden border-none shadow-sm'>
        <CardHeader className='px-4 py-6'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <CardTitle>Product List</CardTitle>
            <div className='relative w-full md:w-72'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input placeholder='Search inventory...' className='pl-8' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0 sm:p-6'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[60px] lg:w-[80px]'>Photo</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className='hover:bg-muted/50'>
                    <TableCell>
                      {product.image_url ? (
                        <img src={product.image_url} alt='' className='w-8 h-8 lg:w-10 lg:h-10 object-contain rounded bg-muted' />
                      ) : (
                        <div className='w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center bg-muted rounded'>
                          <ImageIcon className='w-4 h-4 text-muted-foreground' />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='font-medium'>{product.name}</div>
                      <div className='text-xs text-muted-foreground'>{product.brand}</div>
                    </TableCell>
                    <TableCell>{product.location || 'N/A'}</TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-1'>
                        <Button variant='ghost' size='icon' title='View Details' onClick={() => handleView(product)}>
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-8 w-8 text-green-600' title='Sell' onClick={() => handleSellInit(product)}>
                          <ShoppingCart className='h-4 w-4' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-8 w-8' title='Edit' onClick={() => handleEdit(product)}>
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-8 w-8 text-destructive' title='Delete' onClick={() => product.id && handleDelete(product.id)}>
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(product.quantity ?? 0) > 5 ? 'secondary' : 'destructive'}>{product.quantity}</Badge>  
                    </TableCell>
                    <TableCell>₹{product.purchase_price}</TableCell>
                    <TableCell>₹{product.selling_price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className='sm:max-w-[450px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className='space-y-6'>
              <div className='flex justify-center'>
                {viewingProduct.image_url ? (
                  <img src={viewingProduct.image_url} alt={viewingProduct.name} className='w-48 h-48 object-contain rounded-lg border p-2' />
                ) : (
                  <div className='w-48 h-48 flex items-center justify-center bg-muted rounded-lg border'>
                    <ImageIcon className='w-16 h-16 text-muted-foreground/50' />
                  </div>
                )}
              </div>
              <div>
                <h3 className='text-xl font-bold'>{viewingProduct.name}</h3>
                <p className='text-sm text-muted-foreground'>{viewingProduct.brand}</p>
              </div>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div><p className='text-muted-foreground'>Buy Price</p><p className='font-semibold'>₹{viewingProduct.purchase_price}</p></div>
                <div><p className='text-muted-foreground'>Sell Price</p><p className='font-semibold'>₹{viewingProduct.selling_price}</p></div>
                <div><p className='text-muted-foreground'>Stock</p><p className='font-semibold'>{viewingProduct.quantity} units</p></div>
                <div><p className='text-muted-foreground'>Location</p><p className='font-semibold'>{viewingProduct.location || 'N/A'}</p></div>
                <div className='col-span-2'><p className='text-muted-foreground'>Compatible With</p><p className='font-semibold'>{viewingProduct.compatible_with || 'N/A'}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' className='w-full' onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
        <DialogContent className='sm:max-w-[480px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>{sellingProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Select Existing Customer</label>
              <Select value={selectedCustomerId} onValueChange={(val) => handleCustomerChange(val || 'walk-in')}>
                <SelectTrigger><SelectValue placeholder='Select Customer' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='walk-in'>New / Walk-in Customer</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className='border-t pt-4 space-y-3'>
              <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Customer Information</h4>
              <div className='grid gap-3'>
                <div className='grid gap-1.5'>
                  <label className='text-xs font-medium text-muted-foreground'>Customer Name</label>
                  <Input 
                    placeholder='Name' 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='grid gap-1.5'>
                    <label className='text-xs font-medium text-muted-foreground'>Mobile No</label>
                    <Input 
                      placeholder='Mobile' 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div className='grid gap-1.5'>
                    <label className='text-xs font-medium text-muted-foreground'>Whatsapp No</label>
                    <Input 
                      placeholder='Whatsapp' 
                      value={customerWhatsapp} 
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    />
                  </div>
                </div>
                <div className='grid gap-1.5'>
                  <label className='text-xs font-medium text-muted-foreground'>Current Mobile Model</label>
                  <Input 
                    placeholder='e.g., iPhone 14 Pro, Vivo V29' 
                    value={customerModel} 
                    onChange={(e) => setCustomerModel(e.target.value)}
                  />
                </div>
                <div className='grid gap-1.5'>
                  <label className='text-xs font-medium text-muted-foreground'>Address / Area</label>
                  <Input 
                    placeholder='Address' 
                    value={customerAddress} 
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
                <div className='grid gap-1.5'>
                  <label className='text-xs font-medium text-muted-foreground'>Customer Category</label>
                  <Select value={customerCategory} onValueChange={(val) => setCustomerCategory(val || 'Retailer')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Retailer'>Retailer</SelectItem>
                      <SelectItem value='Wholesaler'>Wholesaler</SelectItem>
                      <SelectItem value='Regular'>Regular Customer</SelectItem>
                      <SelectItem value='VIP'>VIP</SelectItem>
                      <SelectItem value='Other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className='border-t pt-4 space-y-3'>
              <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Sale Transaction</h4>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>Serial No. / IMEI</label>
                <Input 
                  placeholder='Scan or enter Serial No. / IMEI' 
                  value={sellImei} 
                  onChange={(e) => setSellImei(e.target.value)}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <label className='text-sm font-medium'>Quantity</label>
                  <Input type='number' value={sellQuantity} onChange={(e) => setSellQuantity(Number(e.target.value))} min='1' />
                </div>
                <div className='grid gap-2'>
                  <label className='text-sm font-medium'>Price</label>
                  <Input type='number' value={sellPrice} onChange={(e) => setSellPrice(Number(e.target.value))} />
                </div>
              </div>
              
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>Payment Method</label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || 'Cash')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Cash'>Cash</SelectItem>
                    <SelectItem value='UPI'>UPI / Digital</SelectItem>
                    <SelectItem value='Card'>Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='bg-muted p-3 rounded-lg flex justify-between items-center font-bold'>
              <span>Total</span>
              <span className='text-lg'>₹{sellPrice * sellQuantity}</span>
            </div>
          </div>
          <DialogFooter>
            <Button className='w-full' onClick={handleRecordSale} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className='animate-spin h-4 w-4' /> : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader className='no-print'>
            <DialogTitle>Sale Successful</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
              <div className='p-6 border rounded-lg bg-white text-black font-sans' id='receipt-content'>
                <div className='text-center border-b pb-4 mb-4'>
                  <h2 className='text-xl font-bold uppercase'>Rex Mobile & Computers</h2>
                  <p className='text-xs'>Gujrati Market, Burhanpur</p>
                  <p className='text-xs'>Ph.No.: 9977800726</p>
                </div>
                <div className='space-y-2 text-sm mb-4'>
                  <div className='flex justify-between'><span>Receipt No:</span><span className='font-mono uppercase'>{lastSale.invoice_number || lastSale.id.split('-')[0]}</span></div>
                  <div className='flex justify-between'><span>Date:</span><span>{lastSale.date}</span></div>
                  <div className='flex justify-between'><span>Time:</span><span>{lastSale.time}</span></div>
                  {lastSale.imei && <div className='flex justify-between font-mono text-xs'><span>Serial No.:</span><span>{lastSale.imei}</span></div>}
                </div>
                
                <div className='border-t pt-2 mb-4 text-xs space-y-1'>
                  <p className='font-semibold uppercase tracking-wider text-muted-foreground mb-1'>Customer Details</p>
                  <div className='flex justify-between'><span>Name:</span><span>{lastSale.customerName}</span></div>
                  {lastSale.customerPhone && <div className='flex justify-between'><span>Mobile No:</span><span>{lastSale.customerPhone}</span></div>}
                  {lastSale.customerWhatsapp && <div className='flex justify-between'><span>Whatsapp No:</span><span>{lastSale.customerWhatsapp}</span></div>}
                  {lastSale.customerModel && <div className='flex justify-between'><span>Mobile Model:</span><span>{lastSale.customerModel}</span></div>}
                  {lastSale.customerAddress && <div className='flex justify-between'><span>Address/Area:</span><span>{lastSale.customerAddress}</span></div>}
                  {lastSale.customerCategory && <div className='flex justify-between'><span>Category:</span><span>{lastSale.customerCategory}</span></div>}
                </div>

                <Table>
                  <TableHeader><TableRow className='hover:bg-transparent border-b-2'><TableHead className='px-0 text-black h-8'>Item</TableHead><TableHead className='text-center text-black h-8'>Qty</TableHead><TableHead className='text-right px-0 text-black h-8'>Price</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow className='hover:bg-transparent border-none'>
                      <TableCell className='px-0 py-2'>
                        <div>{lastSale.productName}</div>
                        {lastSale.imei && <div className='text-[10px] font-mono text-slate-500'>Serial No.: {lastSale.imei}</div>}
                      </TableCell>
                      <TableCell className='text-center'>{lastSale.quantity}</TableCell>
                      <TableCell className='text-right px-0'>₹{lastSale.price}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className='border-t-2 mt-4 pt-2 text-lg font-bold flex justify-between'>
                  <span>Grand Total</span>
                  <span>₹{lastSale.total}</span>
                </div>
                <div className='mt-4 text-center text-xs italic border-t pt-4'>
                  <p>Thank you for your business!</p>
                  <p>Goods once sold are not returnable.</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className='no-print flex-col sm:flex-row gap-2'>
            <Button className='flex-1 gap-2' onClick={handlePrintReceipt}><Printer className='w-4 h-4' /> Print</Button>
            <Button variant='outline' className='flex-1' onClick={() => setIsReceiptOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
