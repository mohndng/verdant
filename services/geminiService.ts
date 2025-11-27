import { GoogleGenAI } from "@google/genai";
import { SpeciesData, RelatedSpecies } from "../types";
import { fetchWikiImage } from "./wikipediaService";
import { fetchRecentObservations, fetchGbifImages } from "./gbifService";
import { fetchInaturalistData } from "./inaturalistService";
import { fetchNatureAudio } from "./xenoCantoService";
import { fetchLocationWeather } from "./openMeteoService";

// Robust API Key Retrieval
const getApiKey = () => {
    // 1. Check Vite injected env var (Standard for Vercel/Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    
    // 2. Check process.env (Injected via vite.config.ts or Node env)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }

    return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// Robust JSON Cleaner
const cleanJson = (text: string) => {
    if (!text) return "{}";
    // Remove Markdown code blocks
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
    // Trim whitespace
    cleaned = cleaned.trim();
    
    // Attempt to find start and end of JSON object/array
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1) ? firstBrace : Math.min(firstBrace, firstBracket);
    
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
    }

    return cleaned;
}

const SPECIES_SCHEMA = {
  commonName: "String",
  scientificName: "String",
  kingdom: "String ('Animalia', 'Plantae', or 'Fungi')",
  firstNamedBy: "String (Year & Scientist)",
  etymology: "String (Origin of name)",
  ancestralHome: "String",
  nativeRange: "String",
  family: "String",
  relatives: "String",
  size: "String",
  recordSizeWeight: "String",
  colors: "String",
  movement: "String",
  reproduction: "String",
  lifespan: "String",
  longestLife: "String",
  diet: "String",
  defense: "String",
  toxin: "String",
  symbiotic: "String",
  migration: "String",
  sleep: "String",
  scent: "String",
  sound: "String",
  history: "String",
  myths: "String",
  culture: "String",
  threats: "String",
  conservationStatus: "String",
  successStories: "String",
  unknownFact: "String",
  recordFact: "String",
  wildStatus: "String",
  description: "String (Summary)",
};

export const fetchSpeciesData = async (query: string, onProgress?: (percent: number, message: string) => void): Promise<SpeciesData> => {
  if (!apiKey) {
      throw new Error("API Configuration Missing: API_KEY not found in environment.");
  }

  try {
    if (onProgress) onProgress(10, "Consulting Gemini Archives...");

    const systemInstruction = `You are a biological encyclopedia. 
    Return a strict JSON object matching this schema: ${JSON.stringify(SPECIES_SCHEMA)}. 
    Ensure the JSON is valid, contains no comments, and all strings are properly escaped.
    Tone: Quiet, educational, slightly poetic nature writing.`;

    const prompt = `Generate a detailed entry for: "${query}".
    If the query is a generic habitat (e.g. "Forest"), choose a representative organism.
    RETURN ONLY JSON.`;
    
    // 1. Generate Text
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using Flash for speed and reliability
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.3
        }
    });

    const content = textResponse.text;
    if (!content) throw new Error("Gemini returned empty content");
    
    let speciesData: SpeciesData;
    try {
        speciesData = JSON.parse(cleanJson(content));
    } catch (parseError) {
        console.error("JSON Parse failed:", content);
        throw new Error("Failed to decode the archives. Please try again.");
    }

    if (onProgress) onProgress(40, `Identifying ${speciesData.scientificName || speciesData.commonName}...`);

    // 2. Image Generation (Optional Enhancement)
    if (onProgress) onProgress(50, "Visualizing species...");
    
    let generatedImageUrl: string | undefined;
    try {
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Optimized image model
            contents: {
                parts: [
                    { text: `A photorealistic, highly detailed nature photography of ${speciesData.commonName} (${speciesData.scientificName}) in its natural habitat. Cinematic lighting, 8k resolution, National Geographic style.` }
                ]
            }
        });

        // Extract image safely
        const parts = imageResponse.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
    } catch (e) {
        console.warn("Gemini Image Generation skipped:", e);
    }

    // 3. Parallel Data Fetching
    const searchQuery = speciesData.scientificName || speciesData.commonName;
    const isAnimal = speciesData.kingdom === 'Animalia';

    if (onProgress) onProgress(70, "Gathering field observations...");

    const [observations, iNatData, audioData, gbifImages, wikiData] = await Promise.all([
        fetchRecentObservations(searchQuery).catch(() => []),
        fetchInaturalistData(searchQuery).catch(() => ({ images: [], seasonality: {}, heroImage: undefined })),
        isAnimal ? fetchNatureAudio(searchQuery).catch(() => ({ audioUrl: undefined, author: undefined })) : Promise.resolve({ audioUrl: undefined, author: undefined }),
        fetchGbifImages(searchQuery).catch(() => []),
        !generatedImageUrl ? fetchWikiImage(searchQuery).catch(() => ({ imageUrl: undefined, sourceUrl: undefined })) : Promise.resolve({ imageUrl: undefined, sourceUrl: undefined })
    ]);

    // 4. Weather Data (if location available)
    let weatherData;
    if (observations.length > 0 && observations[0].lat && observations[0].lng) {
        if (onProgress) onProgress(85, `Analyzing live conditions...`);
        weatherData = await fetchLocationWeather(
            observations[0].lat, 
            observations[0].lng, 
            observations[0].locality || observations[0].country
        ).catch(() => undefined);
    }

    if (onProgress) onProgress(95, "Finalizing entry...");

    // Combine galleries
    const combinedGallery: string[] = [];
    const maxLength = Math.max(iNatData.images.length, gbifImages.length);
    for (let i = 0; i < maxLength; i++) {
        if (i < iNatData.images.length) combinedGallery.push(iNatData.images[i]);
        if (i < gbifImages.length) combinedGallery.push(gbifImages[i]);
    }

    const finalImageUrl = generatedImageUrl || wikiData?.imageUrl || iNatData.heroImage;

    return {
        ...speciesData,
        imageUrl: finalImageUrl,
        sourceUrl: generatedImageUrl ? undefined : (wikiData?.sourceUrl || `https://www.inaturalist.org/search?q=${encodeURIComponent(searchQuery)}`),
        observations: observations,
        galleryImages: combinedGallery.slice(0, 8),
        seasonalActivity: iNatData.seasonality,
        audioUrl: audioData.audioUrl,
        audioAuthor: audioData.author,
        weatherData: weatherData
    };

  } catch (error) {
    console.error("Fetch Species Error:", error);
    throw error;
  }
};

export const fetchFeaturedSpeciesBatch = async (): Promise<SpeciesData[]> => {
    if (!apiKey) return [];
    try {
        const systemInstruction = `You are a nature curator. Generate 5 unique, fascinating nature entries.
        Return a valid JSON OBJECT with a key 'items' containing an array of 5 objects.
        Schema: { "commonName": "String", "scientificName": "String", "kingdom": "String", "description": "String", "unknownFact": "String" }
        CRITICAL: Ensure all JSON property names and string values are double-quoted. Escape any double quotes within strings. Do not include trailing commas.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate 5 featured species.",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.5 // Increased slightly for variety, but prompts are stricter
            }
        });

        const content = response.text;
        if (!content) return [];
        
        let json;
        try {
            json = JSON.parse(cleanJson(content));
        } catch(e) {
            console.error("Featured Batch JSON Error", content);
            return [];
        }

        const list = Array.isArray(json) ? json : (json.items || json.species || []);

        // Fetch images in parallel
        const listWithImages = await Promise.all(list.map(async (item: any) => {
             const wiki = await fetchWikiImage(item.scientificName || item.commonName).catch(() => ({ imageUrl: undefined }));
             return { 
                 ...item, 
                 imageUrl: wiki.imageUrl 
             };
        }));

        return listWithImages;
    } catch (e) {
        console.warn("Featured Batch failed", e);
        return [];
    }
}

export const getSpeciesSuggestion = async (query: string): Promise<string | null> => {
  if (!apiKey) return null;
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User searched for "${query}". Suggest ONE corrected species name. If unrelated to nature, return "null".`,
    });
    const text = response.text;
    if (!text || text.includes('null')) return null;
    return text.trim().replace(/['"]/g, '');
  } catch (e) {
    return null;
  }
};

export const fetchRelatedSpecies = async (speciesName: string, family: string): Promise<RelatedSpecies[]> => {
    if (!apiKey) return [];
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `List 4 species related to "${speciesName}" (Family: ${family}). JSON object with key 'items' array of { "commonName": "...", "scientificName": "..." }`,
          config: { responseMimeType: 'application/json' }
      });
  
      const content = response.text;
      if (!content) return [];
      
      let json;
      try {
        json = JSON.parse(cleanJson(content));
      } catch (e) {
        return [];
      }
      
      const list = json.items || [];
  
      return await Promise.all(list.map(async (item: any) => {
          const wiki = await fetchWikiImage(item.scientificName).catch(() => ({ imageUrl: undefined }));
          return { ...item, imageUrl: wiki.imageUrl };
      }));
    } catch (e) {
      return [];
    }
  };

export const fetchSpeciesByLetter = async (letter: string): Promise<RelatedSpecies[]> => {
    if (!apiKey) return [];
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `List 12 interesting species starting with letter "${letter}". JSON object key 'items' array of { "commonName": "...", "scientificName": "..." }`,
            config: { responseMimeType: 'application/json' }
        });

        const content = response.text;
        if (!content) return [];
        
        let json;
        try {
            json = JSON.parse(cleanJson(content));
        } catch (e) {
            return [];
        }

        const list = json.items || [];

        return await Promise.all(list.map(async (item: any) => {
             const wiki = await fetchWikiImage(item.scientificName).catch(() => ({ imageUrl: undefined }));
             return { ...item, imageUrl: wiki.imageUrl };
        }));
    } catch (e) {
        return [];
    }
}