'use client';

import React, { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Camera,
  Image as ImageIcon,
  Eye,
  ShoppingCart
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { productService, Product } from '@/services/productService';
import { saleService } from '@/services/saleService';
import { customerService, Customer } from '@/services/customerService';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<Product>();
  
  // Sell Form States
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

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
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
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
    setIsSellOpen(true);
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
      console.error("Error saving product:", error);
      alert(error.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordSale = async () => {
    if (!sellingProduct) return;
    if (sellQuantity > (sellingProduct.quantity || 0)) {
      alert("Not enough stock available!");
      return;
    }

    try {
      setIsSubmitting(true);
      const salePayload = {
        customer_id: selectedCustomerId === "walk-in" ? null : selectedCustomerId,
        total_amount: sellPrice * sellQuantity,
        payment_method: paymentMethod
      };

      const itemsPayload = [{
        product_id: sellingProduct.id!,
        quantity: sellQuantity,
        price: sellPrice
      }];

      await saleService.recordSale(salePayload, itemsPayload);
      setIsSellOpen(false);
      fetchData();
      alert("Sale recorded successfully!");
    } catch (error) {
      console.error("Sale error:", error);
      alert("Failed to record sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const resetProductForm = () => {
    reset({
      name: '',
      brand: '',
      imei: '',
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
    (p.imei && p.imei.includes(searchTerm)) ||
    (p.compatible_with && p.compatible_with.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground text-wrap">Manage your product stock and details in real-time.</p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetProductForm();
        }}>
          <DialogTrigger render={<Button className="gap-2 w-full sm:w-auto" />}>
            <Plus className="w-4 h-4" />
            Add Product
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onProductSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col items-center gap-4 py-2 border-2 border-dashed rounded-lg bg-muted/50 relative group">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-md" />
                  ) : (
                    <div className="w-32 h-32 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <span className="text-xs text-center px-4">Click to upload product photo</span>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input {...register("name", { required: true })} placeholder="e.g. iPhone 15 Pro" />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Compatible With</label>
                  <Input {...register("compatible_with")} placeholder="e.g. iPhone 14, 15" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Brand</label>
                    <Input {...register("brand", { required: true })} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">IMEI</label>
                    <Input {...register("imei")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Purchase Price</label>
                    <Input type="number" step="0.01" {...register("purchase_price", { required: true })} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Selling Price</label>
                    <Input type="number" step="0.01" {...register("selling_price", { required: true })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" {...register("quantity", { required: true })} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input {...register("location")} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Update Product" : "Save Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Product List</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] lg:w-[80px]">Photo</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Brand</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden sm:table-cell">Buy</TableHead>
                    <TableHead>Sell</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(product)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-8 h-8 lg:w-10 lg:h-10 object-contain rounded bg-muted" />
                        ) : (
                          <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center bg-muted rounded">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{product.brand}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{product.brand}</TableCell>
                      <TableCell>
                        <Badge variant={product.quantity! > 5 ? "secondary" : "destructive"}>
                          {product.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">₹{product.purchase_price}</TableCell>
                      <TableCell>₹{product.selling_price}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleSellInit(product)}>
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => product.id && handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell Product Dialog */}
      <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>{sellingProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Customer</label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Quantity (Max: {sellingProduct?.quantity})</label>
                <Input type="number" value={sellQuantity} onChange={(e) => setSellQuantity(Number(e.target.value))} min="1" max={sellingProduct?.quantity} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Price (Per unit)</label>
                <Input type="number" value={sellPrice} onChange={(e) => setSellPrice(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI / Digital</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-3 rounded-lg flex justify-between items-center font-bold">
              <span>Total Amount</span>
              <span className="text-lg">₹{sellPrice * sellQuantity}</span>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={handleRecordSale} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Complete Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
                {viewingProduct.image_url ? (
                  <img src={viewingProduct.image_url} alt="" className="w-full h-full object-contain p-4" />
                ) : (
                  <ImageIcon className="w-20 h-20 text-muted-foreground/20" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{viewingProduct.name}</h3>
                <p className="text-muted-foreground">{viewingProduct.brand}</p>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">IMEI</p>
                  <p className="font-mono">{viewingProduct.imei || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p>{viewingProduct.location || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Compatible With</p>
                  <p>{viewingProduct.compatible_with || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
