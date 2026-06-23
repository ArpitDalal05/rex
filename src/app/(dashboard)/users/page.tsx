'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldAlert, 
  Mail, 
  Calendar, 
  Activity, 
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  RefreshCw,
  Plus
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Profile {
  id: string;
  name: string;
  role: 'Admin' | 'Employee';
  email?: string;
  created_at: string;
  status?: 'Active' | 'Suspended';
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<'Admin' | 'Employee'>('Employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const sanitize = (val: string) => {
      let cleaned = val.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      return cleaned.endsWith('/') ? cleaned.slice(0, -1) : cleaned;
    };

    const cleanUrl = sanitize(url);
    const cleanKey = sanitize(key);

    if (!cleanUrl || !cleanKey) {
      setFormError("Configuration Error: Supabase URL/Anon Key is missing.");
      setIsSubmitting(false);
      return;
    }

    try {
      const tempSupabase = createClient(cleanUrl, cleanKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
        email: newEmail,
        password: newPassword,
      });

      if (signUpError) throw signUpError;

      if (!signUpData?.user) {
        throw new Error("Registration failed to create auth user.");
      }

      const userId = signUpData.user.id;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: newName,
            role: newRole,
            email: newEmail,
          })
          .eq('id', userId);
        
        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              name: newName,
              role: newRole,
              email: newEmail,
            }
          ]);
        
        if (profileError) throw profileError;
      }

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("Employee");
      setIsAddDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Error creating employee:", err);
      setFormError(err.message || "Failed to register employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mockUsers: Profile[] = [
    { id: '1', name: 'Arpit Dalal', role: 'Admin', email: 'arpit@rexmobile.com', created_at: '2026-06-15T00:00:00Z', status: 'Active' },
    { id: '2', name: 'Rahul Sharma', role: 'Employee', email: 'rahul@rexmobile.com', created_at: '2026-06-16T00:00:00Z', status: 'Active' },
    { id: '3', name: 'Priya Patel', role: 'Employee', email: 'priya@rexmobile.com', created_at: '2026-06-18T00:00:00Z', status: 'Active' },
    { id: '4', name: 'Amit Verma', role: 'Employee', email: 'amit@rexmobile.com', created_at: '2026-06-20T00:00:00Z', status: 'Suspended' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.warn("DB profiles fetch failed, using mock data:", error);
        setUsers(mockUsers);
      } else if (data && data.length > 0) {
        // Hydrate mock emails and status
        const profilesList = data.map((d: any, idx: number) => ({
          id: d.id,
          name: d.name,
          role: d.role as 'Admin' | 'Employee',
          email: d.email || `${d.name.toLowerCase().replace(/\s+/g, '')}@rexmobile.com`,
          created_at: d.created_at || new Date().toISOString(),
          status: (idx === 3 ? 'Suspended' : 'Active') as 'Active' | 'Suspended'
        }));
        setUsers(profilesList);
      } else {
        setUsers(mockUsers);
      }
    } catch (err) {
      console.error(err);
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return {
          ...u,
          status: u.status === 'Active' ? 'Suspended' : 'Active'
        };
      }
      return u;
    }));
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 bg-[#030712] text-white p-6 rounded-3xl min-h-screen border border-slate-900 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Glowing Highlights */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      {/* Cinematic Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950/60 p-8 lg:p-12 border border-blue-950/40 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
          <Users className="w-48 h-48 text-indigo-500 animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="text-xs font-semibold tracking-[0.25em] text-indigo-400 uppercase mb-3 block">Organization Directory</span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 leading-none mb-6">
            STAFF &<br />
            <span className="text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">ROLES</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
            Manage your shop employees, system roles, and account statuses from a card-based directory grid.
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900 relative z-10">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search staff directory..." 
            className="pl-9 bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-blue-600 focus-visible:border-blue-600" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />}>
            <UserPlus className="w-4 h-4" />
            Add Employee
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] bg-slate-950 border-slate-900 text-white max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateEmployee}>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Register a new staff account with system login access.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {formError && (
                  <div className="p-3 text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-md">
                    {formError}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-200">Full Name</label>
                  <Input 
                    required 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. John Doe"
                    className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-200">Email Address</label>
                  <Input 
                    type="email"
                    required 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="e.g. john@rexmobile.com"
                    className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-200">Password</label>
                  <Input 
                    type="password"
                    required 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="At least 6 characters"
                    className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-200">Role</label>
                  <Select 
                    value={newRole} 
                    onValueChange={(val) => { if (val === 'Admin' || val === 'Employee') setNewRole(val); }}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-850 text-white">
                      <SelectItem value="Employee" className="hover:bg-slate-800 focus:bg-slate-800 text-white cursor-pointer">Employee</SelectItem>
                      <SelectItem value="Admin" className="hover:bg-slate-800 focus:bg-slate-800 text-white cursor-pointer">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                  {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Register Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Card Grid */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading directories...</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user) => {
              const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
              const isAdmin = user.role === 'Admin';
              const isSuspended = user.status === 'Suspended';

              return (
                <Card 
                  key={user.id} 
                  className={`overflow-hidden border bg-slate-950/40 hover:bg-slate-950/60 transition-all duration-300 shadow-lg group relative ${
                    isSuspended 
                      ? 'border-red-950/30' 
                      : 'border-slate-900 hover:border-blue-900/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.08)]'
                  }`}
                >
                  {/* Neon Top Accent Line */}
                  <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r transition-all ${
                    isSuspended 
                      ? 'from-red-600 to-rose-600' 
                      : isAdmin 
                        ? 'from-purple-600 to-indigo-600' 
                        : 'from-blue-600 to-cyan-500'
                  }`} />

                  <CardContent className="p-6 pt-8 space-y-6">
                    {/* Header Avatar and Role */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        {/* Glowing Avatar */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-transform group-hover:scale-105 border ${
                          isSuspended
                            ? 'bg-red-950/30 border-red-900/40 text-red-400'
                            : isAdmin
                              ? 'bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-indigo-900/30 text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                              : 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-900/30 text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors">{user.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isSuspended
                              ? 'bg-red-950/40 text-red-400 border-red-900/30'
                              : isAdmin
                                ? 'bg-purple-950/40 text-purple-300 border-purple-900/30'
                                : 'bg-blue-950/40 text-blue-300 border-blue-900/30'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown status circle */}
                      <span className={`w-2 h-2 rounded-full relative flex`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isSuspended ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          isSuspended ? 'bg-red-600' : 'bg-emerald-600'
                        }`} />
                      </span>
                    </div>

                    {/* Details section */}
                    <div className="space-y-3 pt-2 text-xs text-slate-400 border-t border-slate-900/60">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{user.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-3.5 h-3.5 text-slate-500" />
                        <span className={isSuspended ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                          {user.status || 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Operations row */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-900/40">
                      <Link href="/user-access" className="flex-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900 gap-1.5"
                        >
                          <Lock className="w-3 h-3" />
                          Access
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToggleStatus(user.id)}
                        className={`text-[11px] font-bold uppercase tracking-wider gap-1.5 border border-transparent ${
                          isSuspended 
                            ? 'text-emerald-400 hover:bg-emerald-950/20 hover:text-emerald-300' 
                            : 'text-red-400 hover:bg-red-950/20 hover:text-red-300'
                        }`}
                      >
                        {isSuspended ? 'Activate' : 'Suspend'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 text-sm">
                No employees matching filter criteria found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
