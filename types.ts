
export interface Observation {
  country: string;
  date: string;
  basisOfRecord: string; // e.g., HUMAN_OBSERVATION, PRESERVED_SPECIMEN
  recordedBy: string;
  locality?: string;
  lat?: number;
  lng?: number;
}

export interface RelatedSpecies {
  commonName: string;
  scientificName: string;
  imageUrl?: string;
}

export interface WeatherData {
  temp: number;
  conditionCode: number;
  isDay: boolean;
  location: string;
  lat: number;
  lng: number;
}

export interface SpeciesData {
  commonName: string;
  scientificName: string;
  kingdom: string; // 'Animalia', 'Plantae', 'Fungi', etc.
  firstNamedBy: string; // First Named By (year & scientist)
  etymology: string; // Etymology (origin of the name)
  ancestralHome: string; // Ancestral Home
  nativeRange: string; // Native Range Today
  family: string; // Family / Group
  relatives: string; // Closest Living Relatives
  size: string; // Typical Size
  recordSizeWeight: string; // Record Size / Weight
  colors: string; // Color Variations
  movement: string; // How It Moves or Spreads
  reproduction: string; // Reproduction Secrets
  lifespan: string; // Average Lifespan
  longestLife: string; // Longest Recorded Life
  diet: string; // Diet & Feeding Habits
  defense: string; // Defense Strategies
  toxin: string; // Deadly or Toxic Parts (if any)
  symbiotic: string; // Partners in Nature (symbiosis)
  migration: string; // Migration or Seasonal Journeys
  sleep: string; // Sleep & Rest Patterns
  scent: string; // Scent or Chemical Signals
  sound: string; // Sound It Makes
  history: string; // Role in Human History
  myths: string; // Myths & Folklore
  culture: string; // Famous Cultural Meaning
  threats: string; // Biggest Threat Today
  conservationStatus: string; // Conservation Status & Trend
  successStories: string; // Success Stories
  unknownFact: string; // One Thing Most People Don’t Know
  recordFact: string; // Mind-Blowing Record
  wildStatus: string; // Still Found in the Wild?
  description: string; // General summary (kept for layout)
  imageUrl?: string; // URL to a public domain image
  sourceUrl?: string; // URL to a reference source (Wikipedia etc)
  observations?: Observation[]; // GBIF Real-world data
  galleryImages?: string[]; // Community photos from multiple sources (iNat, GBIF, PlantNet, Project Noah)
  seasonalActivity?: Record<string, number>; // Month (1-12) -> Observation Count
  audioUrl?: string; // Xeno-canto audio recording
  audioAuthor?: string; // Author of the recording
  weatherData?: WeatherData; // Live weather from latest observation
}

export type ViewState = 'HOME' | 'SEARCH_RESULTS' | 'ENTRY' | 'SAVED' | 'ABOUT' | 'A_Z' | 'PRIVACY' | 'TERMS' | 'LOGIN' | 'SIGNUP' | 'HISTORY' | 'SUPPORT' | 'CONTACT' | 'LETTER_VIEW';

export interface Breadcrumb {
  label: string;
  path: string; // Hash path #/something
}
