// src/hooks/useFavorites.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Controlla utente e carica preferiti
    const initFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadFavorites();
      }
      setLoading(false);
    };

    initFavorites();

    // Listener per cambio auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadFavorites();
      } else {
        setFavorites(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_athletes')
        .select('fis_code');

      if (error) throw error;

      const favSet = new Set(data?.map(f => f.fis_code) || []);
      setFavorites(favSet);
    } catch (err) {
      console.error('Errore nel caricamento dei preferiti:', err);
    }
  };

  const addFavorite = async (fisCode: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_athletes')
        .insert({ fis_code: fisCode, user_id: user.id });

      if (error) throw error;

      setFavorites(prev => new Set(prev).add(fisCode));
      return true;
    } catch (err) {
      console.error('Errore nell\'aggiunta del preferito:', err);
      return false;
    }
  };

  const removeFavorite = async (fisCode: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_athletes')
        .delete()
        .eq('fis_code', fisCode);

      if (error) throw error;

      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(fisCode);
        return newSet;
      });
      return true;
    } catch (err) {
      console.error('Errore nella rimozione del preferito:', err);
      return false;
    }
  };

  const toggleFavorite = async (fisCode: string) => {
    if (!user) return false;

    if (favorites.has(fisCode)) {
      return await removeFavorite(fisCode);
    } else {
      return await addFavorite(fisCode);
    }
  };

  const isFavorite = (fisCode: string) => {
    return favorites.has(fisCode);
  };

  return {
    favorites,
    user,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
