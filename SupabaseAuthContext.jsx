import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found'
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Error fetching profile",
        description: error.message,
      });
      return null;
    }
    return data;
  }, [toast]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);

  const handleAuthStateChange = useCallback(async (event, session) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (event === "SIGNED_IN" && currentUser) {
      setTimeout(async () => {
        const userProfile = await fetchProfile(currentUser.id);
        setProfile(userProfile);
        setLoading(false);
      }, 1000);
    } else if (currentUser) {
      const userProfile = await fetchProfile(currentUser.id);
      setProfile(userProfile);
      setLoading(false);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [fetchProfile]);
  
  useEffect(() => {
    setLoading(true);
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser.id);
        setProfile(userProfile);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [fetchProfile, handleAuthStateChange]);


  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    } else {
       toast({
        title: "Success!",
        description: "Check your email for a confirmation link.",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }
    
    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);
  
  const updateUserRole = useCallback(async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Role switch Failed",
        description: error.message || "Something went wrong",
      });
    } else {
       const updatedProfile = await fetchProfile(userId);
       setProfile(updatedProfile);
       toast({
        title: "Switched Role!",
        description: `You are now an ${newRole}.`,
      });
    }
  }, [toast, fetchProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserRole,
    refreshProfile,
  }), [user, profile, session, loading, signUp, signIn, signOut, updateUserRole, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};