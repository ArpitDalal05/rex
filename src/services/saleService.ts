import { supabase } from '@/lib/supabase';

export interface Sale {
  id?: string;
  customer_id?: string | null;
  total_amount: number;
  payment_method: string;
  created_at?: string;
}

export const saleService = {
  async getAllSales() {
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addSale(sale: Sale, items: any[]) {
    // Basic implementation (ideally this should be a transaction via an RPC)
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([sale])
      .select();

    if (saleError) throw saleError;
    
    const newSale = saleData[0];
    
    const saleItems = items.map(item => ({
      sale_id: newSale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    return newSale;
  }
};
