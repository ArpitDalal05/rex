'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
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

  const onSubmit = async (data: Customer) => {
    try {
      setIsSubmitting(true);
      await customerService.addCustomer(data);
      setIsDialogOpen(false);
      reset();
      setSameAsMobile(false);
      fetchCustomers();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      alert(error.message || "Failed to add customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone_number && c.phone_number.includes(searchTerm))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            reset();
            setSameAsMobile(false);
          }
        }}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="w-4 h-4" />
            Add Customer
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Customers detail</DialogTitle>
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

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Customer List</CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
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
                  <TableHead>Date Added</TableHead>
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
                    <TableCell>{new Date(customer.created_at!).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
