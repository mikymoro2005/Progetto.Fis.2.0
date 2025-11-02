// src/context/FavoritesContext.tsx

// NOTA: Aggiunto "type" prima di ReactNode per risolvere l'errore
import { createContext, useContext, type ReactNode } from 'react';
import { useFavorites } from '../hooks/useFavorites';

type FavoritesContextType = {
  favorites: Set<string>;
  user: any;
  loading: boolean;
  addFavorite: (fisCode: string) => Promise<boolean>;
  removeFavorite: (fisCode: string) => Promise<boolean>;
  toggleFavorite: (fisCode: string) => Promise<boolean>;
  isFavorite: (fisCode: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Qui il tipo per children deve usare ReactNode
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favoritesData = useFavorites();

  return (
    <FavoritesContext.Provider value={favoritesData}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext deve essere usato dentro FavoritesProvider');
  }
  return context;
}