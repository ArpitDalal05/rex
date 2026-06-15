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
  Filter,
  Edit,
  Trash2,
  Loader2,
  Camera,
  Image as ImageIcon,
  Eye
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
import { useForm } from 'react-hook-form';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Product>();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
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

  const onSubmit = async (data: Product) => {
    try {
      setIsSubmitting(true);

      let image_url = imagePreview && !selectedFile ? imagePreview : null; // Keep existing image if no new file
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
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(error.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(id);
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const resetForm = () => {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your product stock and details in real-time.</p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update the details of the product." : "Enter the details of the new product to add to inventory."}
                </DialogDescription>
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
                  <div className="absolute bottom-2 right-2 p-1 bg-background rounded-full shadow-sm">
                    <Camera className="w-4 h-4 text-primary" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input {...register("name", { required: true })} placeholder="e.g. Screen Protector, iPhone 15 Pro" />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Compatible With (Optional)</label>
                  <Input {...register("compatible_with")} placeholder="e.g. iPhone 14, iPhone 15" />
                  <p className="text-xs text-muted-foreground">Comma separated list of compatible devices.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Brand</label>
                    <Input {...register("brand", { required: true })} placeholder="Apple, Spigen, etc." />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">IMEI (Optional)</label>
                    <Input {...register("imei")} placeholder="15-digit number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Purchase Price</label>
                    <Input type="number" step="0.01" {...register("purchase_price", { required: true, valueAsNumber: true })} placeholder="₹" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Selling Price</label>
                    <Input type="number" step="0.01" {...register("selling_price", { required: true, valueAsNumber: true })} placeholder="₹" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" {...register("quantity", { required: true, valueAsNumber: true })} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Shop Location</label>
                    <Input {...register("location")} placeholder="e.g. Shelf A1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Update Product" : "Save Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Product List</CardTitle>
              <CardDescription>
                {loading ? "Loading products..." : Total \ products found.}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, brands, models..."
                  className="pl-8 w-[280px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Photo</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Compatible</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price (Buy)</TableHead>
                  <TableHead>Price (Sell)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(product)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 object-contain rounded bg-muted p-1" />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={product.compatible_with || ""}>
                      {product.compatible_with || "-"}
                    </TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>₹{product.purchase_price}</TableCell>
                    <TableCell>₹{product.selling_price}</TableCell>
                    <TableCell>
                      <Badge variant={
                        product.quantity > 10 ? "outline" :
                        product.quantity > 0 ? "secondary" : "destructive"
                      }>
                        {product.quantity > 10 ? "In Stock" :
                         product.quantity > 0 ? "Low Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => product.id && handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Product Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-6">
              <div className="flex justify-center">
                {viewingProduct.image_url ? (
                  <img src={viewingProduct.image_url} alt={viewingProduct.name} className="w-48 h-48 object-contain rounded-lg border p-2" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg border">
                    <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-bold">{viewingProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{viewingProduct.brand}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Purchase Price</p>
                  <p className="font-semibold">₹{viewingProduct.purchase_price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selling Price</p>
                  <p className="font-semibold">₹{viewingProduct.selling_price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Stock</p>
                  <p className="font-semibold">{viewingProduct.quantity} units</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-semibold">{viewingProduct.location || "Not specified"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Compatible With</p>
                  <p className="font-semibold">{viewingProduct.compatible_with || "N/A"}</p>
                </div>
                {viewingProduct.imei && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">IMEI</p>
                    <p className="font-mono">{viewingProduct.imei}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (viewingProduct) handleEdit(viewingProduct);
            }}>
              Edit Product
            </Button>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
