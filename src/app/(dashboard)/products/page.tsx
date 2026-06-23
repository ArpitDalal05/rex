'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Smartphone, 
  DollarSign, 
  MapPin, 
  Link2, 
  Eye, 
  ShoppingCart,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { productService, Product } from '@/services/productService';

export default function ProductsCardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.compatible_with && p.compatible_with.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 bg-[#030712] text-white p-6 rounded-3xl min-h-screen border border-slate-900 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Glowing Highlights */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      {/* Cinematic Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950/60 p-8 lg:p-12 border border-blue-950/40 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
          <Smartphone className="w-48 h-48 text-blue-500 animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="text-xs font-semibold tracking-[0.25em] text-blue-400 uppercase mb-3 block">Premium Showcase</span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 leading-none mb-6">
            PRODUCT<br />
            <span className="text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">CATALOG</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
            Browse mobile models, cases, chargers, and custom accessories in a cinematic grid visual. Check stock count and shelf location at a glance.
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900 relative z-10">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search catalog by name, brand, compatibility..." 
            className="pl-9 bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-blue-600 focus-visible:border-blue-600" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Displaying {filteredProducts.length} products
        </div>
      </div>

      {/* Products Card Grid */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading catalog items...</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const isLowStock = (product.quantity ?? 0) <= 5;
              
              return (
                <Card 
                  key={product.id}
                  className={`overflow-hidden border bg-slate-950/40 hover:bg-slate-950/60 transition-all duration-300 shadow-lg group relative ${
                    isLowStock 
                      ? 'border-red-950/30' 
                      : 'border-slate-900 hover:border-blue-900/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.08)]'
                  }`}
                >
                  {/* Photo Container */}
                  <div className="relative aspect-square w-full bg-slate-950/50 flex items-center justify-center overflow-hidden border-b border-slate-900/60 p-4">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-600 transition-colors group-hover:text-blue-500 group-hover:border-blue-900/40">
                        <Smartphone className="w-10 h-10" />
                      </div>
                    )}

                    {/* Stock status badge overlay */}
                    <div className="absolute top-3 left-3">
                      <Badge 
                        variant={isLowStock ? 'destructive' : 'secondary'}
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isLowStock 
                            ? 'bg-red-600/90 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                            : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400 backdrop-blur-md'
                        }`}
                      >
                        {isLowStock ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock: {product.quantity}
                          </span>
                        ) : (
                          `${product.quantity} In Stock`
                        )}
                      </Badge>
                    </div>

                    {/* Price tag overlay */}
                    <div className="absolute bottom-3 right-3 bg-blue-950/90 text-blue-300 font-extrabold text-sm px-3 py-1 rounded-lg border border-blue-900/40 backdrop-blur-md shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                      ₹{Number(product.selling_price).toLocaleString()}
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Brand and name */}
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{product.brand}</span>
                      <h3 className="font-bold text-sm text-slate-200 truncate group-hover:text-white transition-colors">{product.name}</h3>
                    </div>

                    {/* Details lists */}
                    <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-900/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Location: <strong className="text-slate-300">{product.location || 'N/A'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Compatible: <strong className="text-slate-300">{product.compatible_with || 'N/A'}</strong></span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-900/40">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900 gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        Quick View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 text-sm">
                No products found matching filter criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
