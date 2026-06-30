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
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers (
            id,
            name,
            phone_number,
            whatsapp_number,
            current_mobile_model,
            address,
            category
          ),
          sale_items (
            *,
            products (
              name,
              purchase_price,
              selling_price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Join fetch failed, fetching basic sales:", error);
        const { data: basicData, error: basicError } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false });
        if (basicError) throw basicError;
        return basicData;
      }
      return data;
    } catch (err) {
      console.error("Sale fetch error:", err);
      return [];
    }
  },

  async recordSale(sale: Sale, items: { product_id: string; quantity: number; price: number; imei?: string | null }[]) {
    try {
      // 1. Create the sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([sale])
        .select();

      if (saleError) throw saleError;
      const newSale = saleData[0];

      // 2. Create the sale items records
      const saleItems = items.map(item => ({
        sale_id: newSale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        imei: item.imei || null
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // 3. Update product quantities (decrement)
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newQuantity = Math.max(0, product.quantity - item.quantity);
          await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', item.product_id);
        }
      }

      return newSale;
    } catch (error) {
      console.error("Error recording sale:", error);
      throw error;
    }
  },

  async updateSale(saleId: string, updates: Partial<Sale>) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', saleId)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Error updating sale:", error);
      throw error;
    }
  },

  async deleteSale(saleId: string) {
    try {
      // 1. Fetch sale items to restock the products
      const { data: saleItems, error: fetchError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId);

      if (fetchError) throw fetchError;

      // 2. Restock the products
      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          const { data: product } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newQuantity = product.quantity + item.quantity;
            await supabase
              .from('products')
              .update({ quantity: newQuantity })
              .eq('id', item.product_id);
          }
        }
      }

      // 3. Delete sale items first
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);

      // 4. Delete the sale record itself
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (deleteError) throw deleteError;
      return true;
    } catch (error) {
      console.error("Error deleting sale:", error);
      throw error;
    }
  }
};
