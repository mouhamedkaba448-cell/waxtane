import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charge le profil (username, is_admin, is_banned) lié à l'utilisateur connecté
  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  useEffect(() => {
    // Récupère la session existante au chargement (si déjà connecté)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    // Écoute les changements (connexion / déconnexion)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    if (password.length < 8) {
      return { error: { message: 'Le mot de passe doit contenir au moins 8 caractères.' } };
    }
    return await supabase.auth.signUp({ email, password });
  }

  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    user,             // null = navigation "invité"
    profile,          // contient is_admin, is_banned, username
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin: profile?.is_admin ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
