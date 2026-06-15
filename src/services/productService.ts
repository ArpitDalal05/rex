import { supabase } from '@/lib/supabase';

export interface Product {
  id?: string;
  name: string;
  brand: string;
  imei?: string | null;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  location?: string | null;
  image_url?: string | null;
  compatible_with?: string | null;
}

export const productService = {
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addProduct(product: Product) {
    const cleanProduct = {
      ...product,
      imei: product.imei?.trim() || null,
      location: product.location?.trim() || null,
      image_url: product.image_url?.trim() || null,
      compatible_with: product.compatible_with?.trim() || null
    };

    const { data, error } = await supabase
      .from('products')
      .insert([cleanProduct])
      .select();

    if (error) throw error;
    return data[0];
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const cleanProduct = {
      ...product,
      imei: product.imei?.trim() || null,
      location: product.location?.trim() || null,
      image_url: product.image_url?.trim() || null,
      compatible_with: product.compatible_with?.trim() || null
    };

    const { data, error } = await supabase
      .from('products')
      .update(cleanProduct)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadProductImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = ${Math.random()}.;
    const filePath = products/;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
