'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { permissionService, PermissionsMap } from '@/services/permissionService';

interface Profile {
  id: string;
  name: string;
  role: 'Admin' | 'Employee';
  email?: string;
  created_at?: string;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: 'Admin' | 'Employee';
  permissions: PermissionsMap;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [loading, setLoading] = useState(true);

  const fetchProfileAndPermissions = async (userId: string) => {
    try {
      // 1. Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const userRole = profileData?.role || 'Employee';
      const userProfile: Profile = profileData || {
        id: userId,
        name: 'Employee',
        role: userRole,
      };

      setProfile(userProfile);

      // 2. Fetch role permissions
      const perms = await permissionService.getPermissions(userRole);
      setPermissions(perms || {});
    } catch (err) {
      console.error('Error fetching user profile & permissions:', err);
      // Fallback
      setProfile({ id: userId, name: 'Employee', role: 'Employee' });
      setPermissions(permissionService.getDefaultPermissions('Employee'));
    }
  };

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndPermissions(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setPermissions({});
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndPermissions(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setPermissions({});
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndPermissions(user.id);
    }
  };

  const role = profile?.role || 'Employee';

  return (
    <AuthContext.Provider value={{ user, profile, role, permissions, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
