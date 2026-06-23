import { supabase } from '@/lib/supabase';

export interface PermissionsMap {
  [key: string]: boolean;
}

export const permissionService = {
  async getPermissions(role: string): Promise<PermissionsMap> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', role)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found, return local storage fallback or empty map
          return this.getLocalFallback(role);
        }
        throw error;
      }
      return data.permissions as PermissionsMap;
    } catch (err) {
      console.warn("DB permission load failed, using local storage:", err);
      return this.getLocalFallback(role);
    }
  },

  async savePermissions(role: string, permissions: PermissionsMap): Promise<void> {
    // Save to local storage first for instant feedback & backup
    this.saveLocalFallback(role, permissions);

    try {
      // Upsert into supabase
      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          role,
          permissions,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error("Supabase permission save failed:", err);
    }
  },

  getLocalFallback(role: string): PermissionsMap {
    if (typeof window === 'undefined') return this.getDefaultPermissions(role);
    
    try {
      const saved = localStorage.getItem(`rex_perms_${role}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Local storage permission read error:", e);
    }
    return this.getDefaultPermissions(role);
  },

  saveLocalFallback(role: string, permissions: PermissionsMap): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`rex_perms_${role}`, JSON.stringify(permissions));
    } catch (e) {
      console.error("Local storage permission save error:", e);
    }
  },

  getDefaultPermissions(role: string): PermissionsMap {
    const isEmployee = role === 'Employee';
    // Admin gets everything true. Employee gets a restricted subset by default.
    return {
      // Dashboard section
      "dashboard.viewRevenue": !isEmployee,
      "dashboard.viewStats": true,
      "dashboard.viewRecentSales": true,
      
      // Inventory section
      "inventory.viewProducts": true,
      "inventory.addProduct": !isEmployee,
      "inventory.editProduct": !isEmployee,
      "inventory.deleteProduct": !isEmployee,
      "inventory.viewPurchasePrice": !isEmployee,
      "inventory.editPrices": !isEmployee,
      
      // Sales section
      "sales.viewHistory": true,
      "sales.recordSale": true,
      "sales.voidSale": !isEmployee,
      "sales.reprintReceipt": true,
      
      // Customer section
      "customer.viewList": true,
      "customer.addCustomer": true,
      "customer.editCustomer": !isEmployee,
      "customer.exportList": !isEmployee,
      
      // System section
      "system.editShopDetails": !isEmployee,
      "system.managePermissions": !isEmployee,
      "system.databaseBackup": !isEmployee,
    };
  }
};
