import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    if (currentUser) {
      setIsVendor(currentUser.user_metadata?.is_vendor === true);
    } else {
      setIsVendor(false);
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.refreshSession();
    setUser(user);
    if (user) {
      setIsVendor(user.user_metadata?.is_vendor === true);
    } else {
      setIsVendor(false);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      if (error.message && (error.message.includes('rate limit') || error.code === 'over_email_send_rate_limit')) {
        toast({
          variant: "destructive",
          title: "Trop de tentatives",
          description: "Veuillez patienter un moment avant de réessayer.",
        });
      } else if (error.message && error.message.includes('already registered')) {
        toast({
          variant: "destructive",
          title: "Utilisateur existant",
          description: "Un utilisateur avec cet email est déjà enregistré.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de l'inscription",
          description: error.message || "Une erreur est survenue.",
        });
      }
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Email not confirmed' || error.code === 'email_not_confirmed') {
        toast({
          variant: "destructive",
          title: "Email non confirmé",
          description: "Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation pour activer votre compte.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de la connexion",
          description: "Email ou mot de passe incorrect.",
        });
      }
    }

    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isVendor,
    signUp,
    signIn,
    signOut,
    refreshUser,
  }), [user, session, loading, isVendor, signUp, signIn, signOut, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};