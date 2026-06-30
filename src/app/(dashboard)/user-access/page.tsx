'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Eye, 
  User, 
  Layers, 
  Smartphone, 
  DollarSign, 
  Users, 
  Database,
  Check,
  Save,
  RefreshCw,
  Info
} from "lucide-react";
import { permissionService, PermissionsMap } from '@/services/permissionService';
import { useAuth } from '@/components/layout/AuthContext';
import AccessDenied from '@/components/layout/AccessDenied';

interface PermissionOption {
  key: string;
  label: string;
  description: string;
}

interface Section {
  id: string;
  title: string;
  icon: any;
  description: string;
  options: PermissionOption[];
}

export default function UserAccessPage() {
  const { role: currentUserRole } = useAuth();

  if (currentUserRole !== 'Admin') {
    return <AccessDenied />;
  }

  const [role, setRole] = useState<'Employee' | 'Admin'>('Employee');
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Accordion open/close state
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    dashboard: true,
    inventory: true,
    sales: false,
    customer: false,
    system: false,
  });

  const sections: Section[] = [
    {
      id: 'dashboard',
      title: 'Dashboard & Analytics Control',
      icon: Layers,
      description: 'Permissions for home dashboard widgets, metrics, and cards.',
      options: [
        { key: 'dashboard.viewStats', label: 'View General Statistics', description: 'Allows viewing total product counts, low stock items, and customer totals.' },
        { key: 'dashboard.viewRevenue', label: 'View Total Revenue Metrics', description: 'Enables rendering of total revenue sum cards (highly confidential).' },
        { key: 'dashboard.viewRecentSales', label: 'View Recent Transactions List', description: 'Displays the feed of the 5 most recent sales on the dashboard.' },
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory & Products Control',
      icon: Smartphone,
      description: 'Management privileges for catalog items, stock updates, and pricing.',
      options: [
        { key: 'inventory.viewProducts', label: 'View Product Inventory', description: 'Basic access to read the inventory product list table.' },
        { key: 'inventory.viewPurchasePrice', label: 'View Purchase Price (Cost)', description: 'Displays the buying price of stock items (recommended for Admin only).' },
        { key: 'inventory.addProduct', label: 'Add New Products', description: 'Enables the creation of new products and uploading catalog images.' },
        { key: 'inventory.editProduct', label: 'Modify Product details', description: 'Allows editing product names, compatibility, brands, and shop locations.' },
        { key: 'inventory.editPrices', label: 'Modify Product prices', description: 'Enables changing purchase and selling prices of existing stock.' },
        { key: 'inventory.deleteProduct', label: 'Delete Products', description: 'Allows permanent removal of inventory items from the database.' },
      ]
    },
    {
      id: 'sales',
      title: 'Sales & Checkout Authorization',
      icon: DollarSign,
      description: 'Control over point of sale, checkout, and invoice management.',
      options: [
        { key: 'sales.recordSale', label: 'Record New Sales', description: 'Allows launching the checkout modal and completing sale transactions.' },
        { key: 'sales.viewHistory', label: 'View Sales History Feed', description: 'Access to the Sales tab containing historical transaction lists.' },
        { key: 'sales.reprintReceipt', label: 'Print and Download Invoices', description: 'Allows printing receipts and downloading invoice PDFs.' },
        { key: 'sales.voidSale', label: 'Void / Refund Transactions', description: 'Allows deleting sales records and auto-incrementing inventory stock back.' },
      ]
    },
    {
      id: 'customer',
      title: 'Customer Data Management',
      icon: Users,
      description: 'Privileges for customer relationship entries, addresses, and details.',
      options: [
        { key: 'customer.viewList', label: 'View Customer List', description: 'Allows viewing the registered customer database table.' },
        { key: 'customer.addCustomer', label: 'Add New Customer Profiles', description: 'Allows registering new customers with mobile, whatsapp, and model details.' },
        { key: 'customer.editCustomer', label: 'Edit Customer details', description: 'Enables modifying mobile numbers, addresses, categories, or names.' },
        { key: 'customer.exportList', label: 'Export Customer Database', description: 'Enables exporting the customer contacts list to CSV/Excel formats.' },
      ]
    },
    {
      id: 'system',
      title: 'System Configurations & Operations',
      icon: Database,
      description: 'Super-admin permissions, backups, security setups, and store headers.',
      options: [
        { key: 'system.editShopDetails', label: 'Edit Shop Details', description: 'Allows modifying shop name, market address, and contact numbers printed on invoices.' },
        { key: 'system.managePermissions', label: 'Manage Role Access Policies', description: 'Grants access to this User Access Control page (highly critical).' },
        { key: 'system.databaseBackup', label: 'Execute Database Backups', description: 'Enables triggering Supabase SQL schema dumps and table backups.' },
      ]
    }
  ];

  useEffect(() => {
    loadRolePermissions();
  }, [role]);

  const loadRolePermissions = async () => {
    try {
      setLoading(true);
      const data = await permissionService.getPermissions(role);
      setPermissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSelectAllInSection = (sectionId: string, value: boolean) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const updated: PermissionsMap = { ...permissions };
    section.options.forEach(opt => {
      updated[opt.key] = value;
    });
    setPermissions(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionService.savePermissions(role, permissions);
      showToast("Access control policies synced successfully!", "success");
    } catch (e) {
      showToast("Failed to save permissions. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-8 bg-[#030712] text-white p-6 rounded-3xl min-h-screen border border-slate-900 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Glowing Highlights */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Futuristic Cinematic Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950/60 p-8 lg:p-12 border border-blue-950/40 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
          <Shield className="w-48 h-48 text-blue-500 animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="text-xs font-semibold tracking-[0.25em] text-blue-400 uppercase mb-3 block">Administration Panel</span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 leading-none mb-6">
            USER ACCESS<br />
            <span className="text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">POLICIES</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
            Configure system capabilities, module visibilities, and detailed actions for shop user accounts. Settings sync in real-time.
          </p>
        </div>
      </div>

      {/* Role Selection Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-950/50 flex items-center justify-center border border-blue-900/40 text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Role Access Target</h3>
            <p className="text-xs text-muted-foreground">Select the user role to configure permissions.</p>
          </div>
        </div>

        <div className="flex bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 w-full sm:w-auto">
          <button 
            onClick={() => setRole('Employee')} 
            className={`flex-1 sm:flex-initial px-6 py-2 rounded-md font-medium text-sm transition-all ${role === 'Employee' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Employee
          </button>
          <button 
            onClick={() => setRole('Admin')} 
            className={`flex-1 sm:flex-initial px-6 py-2 rounded-md font-medium text-sm transition-all ${role === 'Admin' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Permissions Accordions */}
      <div className="space-y-4 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading access maps from Supabase...</p>
          </div>
        ) : (
          sections.map((section) => {
            const isExpanded = expandedSections[section.id];
            
            // Check if all options in section are enabled
            const allEnabled = section.options.every(opt => !!permissions[opt.key]);
            
            return (
              <div 
                key={section.id} 
                className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md transition-all duration-300 hover:border-slate-800/80"
              >
                {/* Accordion Header Row */}
                <div 
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-950/30 hover:bg-slate-950/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-950/30 border border-indigo-900/30 flex items-center justify-center text-indigo-400">
                      <section.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-slate-200">{section.title}</h3>
                      <p className="text-xs text-slate-500 hidden sm:block">{section.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle All checkbox */}
                    <button 
                      onClick={() => handleSelectAllInSection(section.id, !allEnabled)}
                      className={`px-3 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors border ${
                        allEnabled 
                          ? 'bg-blue-950/40 border-blue-800 text-blue-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {allEnabled ? 'Disable All' : 'Enable All'}
                    </button>
                    <div onClick={() => toggleSection(section.id)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Accordion Content Panel */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-900/60 bg-slate-950/10 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {section.options.map((opt) => {
                        const isChecked = !!permissions[opt.key];
                        return (
                          <div 
                            key={opt.key}
                            onClick={() => handleToggle(opt.key)}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked 
                                ? 'bg-blue-950/15 border-blue-900/40 shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]' 
                                : 'bg-slate-950/30 border-slate-900/50 opacity-60 hover:opacity-90 hover:border-slate-800'
                            }`}
                          >
                            {/* Neon Checkbox */}
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-all ${
                              isChecked 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_8px_rgba(37,99,235,0.6)]' 
                                : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            </div>
                            <div className="space-y-1">
                              <h4 className={`text-sm font-semibold transition-colors ${isChecked ? 'text-blue-200' : 'text-slate-300'}`}>
                                {opt.label}
                              </h4>
                              <p className="text-xs text-slate-500 leading-normal">
                                {opt.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info Warning Card for Admin role editing */}
      {role === 'Admin' && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-900/30 bg-yellow-950/10 text-yellow-200/80 relative z-10 text-xs">
          <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p>
            <strong>Warning:</strong> Modifying the Admin role permissions is generally discouraged. System administrators always require all options enabled to prevent locking themselves out of management utilities.
          </p>
        </div>
      )}

      {/* Floating Save Controls */}
      <div className="flex items-center justify-end gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900 relative z-10">
        <Button 
          variant="outline" 
          disabled={loading || saving} 
          onClick={loadRolePermissions}
          className="border-slate-800 text-slate-300 hover:bg-slate-900"
        >
          Reset Changes
        </Button>
        
        <Button 
          disabled={loading || saving} 
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 px-8 shadow-[0_0_20px_rgba(37,99,235,0.4)] relative"
        >
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Access Policies
            </>
          )}
        </Button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3.5 rounded-lg border text-sm font-semibold shadow-2xl transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-blue-950 border-blue-800 text-blue-200 shadow-[0_0_30px_rgba(30,58,138,0.4)]' 
            : 'bg-red-950 border-red-800 text-red-200'
        }`}>
          <Check className="w-4 h-4" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
