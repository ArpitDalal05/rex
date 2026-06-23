import { supabase } from '@/lib/supabase';

export interface Customer {
  id?: string;
  name: string;
  phone_number?: string | null;
  email?: string | null;
  whatsapp_number?: string | null;
  current_mobile_model?: string | null;
  address?: string | null;
  category?: string | null;
  created_at?: string;
}

export const customerService = {
  async getAllCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addCustomer(customer: Customer) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select();

    if (error) throw error;
    return data[0];
  },

  async updateCustomer(id: string, customer: Partial<Customer>) {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
