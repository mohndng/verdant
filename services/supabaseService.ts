import supabase from "../utils/supabase";
import { SpeciesData } from "../types";

// --- FAVORITES (COLLECTION) ---

export const saveSpeciesToDb = async (userId: string, species: SpeciesData) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert([
      { 
        user_id: userId, 
        common_name: species.commonName,
        species_data: species 
      }
    ])
    .select();

  if (error) throw error;
  return data;
};

export const removeSpeciesFromDb = async (userId: string, commonName: string) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('common_name', commonName);

  if (error) throw error;
};

export const fetchSavedSpecies = async (userId: string): Promise<SpeciesData[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('species_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Unwrap the JSONB data
  return data.map((item: any) => item.species_data as SpeciesData);
};

// --- SEARCH HISTORY ---

export const addToHistory = async (userId: string, query: string) => {
  // Optional: Prevent duplicate consecutive entries or limit history size in DB triggers
  const { error } = await supabase
    .from('history')
    .insert([
      { user_id: userId, query: query }
    ]);
    
  if (error) console.error("Error adding to history:", error);
};

export const fetchHistory = async (userId: string): Promise<{query: string, created_at: string}[]> => {
  const { data, error } = await supabase
    .from('history')
    .select('query, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
};

export const clearHistory = async (userId: string) => {
  const { error } = await supabase
    .from('history')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};