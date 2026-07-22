'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, Edit, Trash2, Phone, Mail, MessageSquare, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { customerService, Customer } from '@/services/customerService';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm<Customer>();
  
  const phoneVal = watch("phone_number");
  const whatsappVal = watch("whatsapp_number");
  const [sameAsMobile, setSameAsMobile] = useState(false);

  useEffect(() => {
    if (sameAsMobile && phoneVal) {
      setValue("whatsapp_number", phoneVal);
    }
  }, [phoneVal, sameAsMobile, setValue]);

  useEffect(() => {
    if (whatsappVal !== phoneVal) {
      setSameAsMobile(false);
    }
  }, [whatsappVal, phoneVal]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAllCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      name: "",
      phone_number: "",
      whatsapp_number: "",
      current_mobile_model: "",
      address: "",
      email: "",
      category: "Retailer"
    });
    setEditingId(null);
    setSameAsMobile(false);
  };

  const getWhatsappUrl = (whatsappNum?: string | null, phoneNum?: string | null) => {
    const target = (whatsappNum || phoneNum)?.trim();
    if (!target) return null;
    let cleaned = target.replace(/[^0-9]/g, '');
    if (!cleaned) return null;
    cleaned = cleaned.replace(/^0+/, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return `https://wa.me/${cleaned}`;
  };

  const onSubmit = async (data: Customer) => {
    try {
      setIsSubmitting(true);
      const payload: Customer = {
        ...data,
        name: data.name?.trim() || '',
        phone_number: data.phone_number?.trim() || null,
        whatsapp_number: data.whatsapp_number?.trim() || data.phone_number?.trim() || null,
        current_mobile_model: data.current_mobile_model?.trim() || null,
        address: data.address?.trim() || null,
        email: data.email?.trim() || null,
        category: data.category || 'Retailer'
      };

      if (editingId) {
        await customerService.updateCustomer(editingId, payload);
      } else {
        await customerService.addCustomer(payload);
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      alert(error.message || "Failed to save customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id || null);
    reset({
      ...customer,
      phone_number: customer.phone_number || "",
      whatsapp_number: customer.whatsapp_number || "",
      current_mobile_model: customer.current_mobile_model || "",
      address: customer.address || "",
      email: customer.email || "",
      category: customer.category || "Retailer"
    });
    if (customer.whatsapp_number && customer.whatsapp_number === customer.phone_number) {
      setSameAsMobile(true);
    } else {
      setSameAsMobile(false);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await customerService.deleteCustomer(id);
        fetchCustomers();
      } catch (error: any) {
        console.error("Error deleting customer:", error);
        alert("Failed to delete customer.");
      }
    }
  };

  const exportToCSV = () => {
    if (customers.length === 0) return;
    
    const headers = ["Name", "Mobile No", "Whatsapp No", "Current Mobile Model", "Address/Area", "Cust Category", "Email", "Date Added"];
    const rows = customers.map(c => [
      c.name,
      c.phone_number || "",
      c.whatsapp_number || "",
      c.current_mobile_model || "",
      c.address || "",
      c.category || "",
      c.email || "",
      c.created_at ? new Date(c.created_at).toLocaleDateString() : ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `customers_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.current_mobile_model && c.current_mobile_model.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone_number && c.phone_number.includes(searchTerm))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="w-4 h-4" />
              Add Customer
            </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Customer Details' : 'Customers detail'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input {...register("name", { required: true })} placeholder="Customer Name" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Mobile no</label>
                  <Input {...register("phone_number")} placeholder="e.g. 9977800726" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Whatsapp no.</label>
                  <Input {...register("whatsapp_number")} placeholder="e.g. 9977800726" />
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="checkbox" 
                      id="same-as-mobile" 
                      checked={sameAsMobile} 
                      onChange={(e) => {
                        setSameAsMobile(e.target.checked);
                        if (e.target.checked) {
                          setValue("whatsapp_number", phoneVal || "");
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="same-as-mobile" className="text-xs text-muted-foreground select-none cursor-pointer">
                      Same as Mobile Number
                    </label>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Current Mobile Model</label>
                  <Input {...register("current_mobile_model")} placeholder="e.g. iPhone 15 Pro" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Address/Area</label>
                  <Input {...register("address")} placeholder="e.g. Gujrati Market" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email (Optional)</label>
                  <Input type="email" {...register("email")} placeholder="customer@example.com" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Cust Category</label>
                  <Select 
                    value={watch("category") || "Retailer"} 
                    onValueChange={(val) => setValue("category", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retailer">Retailer</SelectItem>
                      <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="Regular">Regular Customer</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Customer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Customer List</CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, model or phone..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile no</TableHead>
                  <TableHead>Whatsapp no</TableHead>
                  <TableHead>Current Mobile Model</TableHead>
                  <TableHead>Address/Area</TableHead>
                  <TableHead>Cust Category</TableHead>
                  <TableHead>communication</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone_number || "N/A"}</TableCell>
                    <TableCell>{customer.whatsapp_number || "N/A"}</TableCell>
                    <TableCell>{customer.current_mobile_model || "N/A"}</TableCell>
                    <TableCell>{customer.address || "N/A"}</TableCell>
                    <TableCell>{customer.category || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {customer.phone_number ? (
                          <a 
                            href={`tel:${customer.phone_number}`}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            title={`Call: ${customer.phone_number}`}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="p-1 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="No Mobile Number">
                            <Phone className="w-4 h-4" />
                          </span>
                        )}
                        
                        {(() => {
                          const waUrl = getWhatsappUrl(customer.whatsapp_number, customer.phone_number);
                          const waNumDisplay = customer.whatsapp_number || customer.phone_number || '';
                          return waUrl ? (
                            <a 
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                              title={`WhatsApp: ${waNumDisplay}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="p-1 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="No Whatsapp Number">
                              <MessageSquare className="w-4 h-4" />
                            </span>
                          );
                        })()}

                        {customer.email ? (
                          <a 
                            href={`mailto:${customer.email}`}
                            className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                            title={`Mail: ${customer.email}`}
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="p-1 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="No Email Address">
                            <Mail className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600" 
                          title="Edit"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive" 
                          title="Delete"
                          onClick={() => customer.id && handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
