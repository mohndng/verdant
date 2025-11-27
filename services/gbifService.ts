import { Observation } from "../types";

const GBIF_API_URL = "https://api.gbif.org/v1";

// Helper for safe fetching
const safeFetch = async (url: string) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) throw new Error(`GBIF Status: ${res.status}`);
        return await res.json();
    } catch (e) {
        clearTimeout(id);
        return null;
    }
};

export const fetchRecentObservations = async (scientificName: string): Promise<Observation[]> => {
  try {
    const taxonKey = await getGbifTaxonKey(scientificName);
    if (!taxonKey) return [];

    const currentYear = new Date().getFullYear();
    const searchParams = new URLSearchParams({
        taxonKey: taxonKey.toString(),
        limit: '4',
        hasCoordinate: 'true',
        year: `${currentYear-5},${currentYear}`,
    });

    const occData = await safeFetch(`${GBIF_API_URL}/occurrence/search?${searchParams.toString()}`);
    if (!occData || !occData.results) return [];

    return occData.results.map((record: any) => ({
        country: record.country || 'International Waters',
        date: record.eventDate ? new Date(record.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'}) : 'Unknown Date',
        basisOfRecord: formatBasis(record.basisOfRecord),
        recordedBy: record.recordedBy || 'Anonymous',
        locality: record.locality || record.stateProvince,
        lat: record.decimalLatitude,
        lng: record.decimalLongitude
    }));
  } catch (error) {
    return [];
  }
};

export const fetchGbifImages = async (scientificName: string): Promise<string[]> => {
  try {
    const taxonKey = await getGbifTaxonKey(scientificName);
    if (!taxonKey) return [];

    const searchParams = new URLSearchParams({
        taxonKey: taxonKey.toString(),
        mediaType: 'StillImage',
        limit: '10'
    });

    const data = await safeFetch(`${GBIF_API_URL}/occurrence/search?${searchParams.toString()}`);
    if (!data || !data.results) return [];

    const images: string[] = [];
    data.results.forEach((record: any) => {
        if (record.media) {
            record.media.forEach((mediaItem: any) => {
                if (mediaItem.type === 'StillImage' && mediaItem.identifier) {
                    images.push(mediaItem.identifier);
                }
            });
        }
    });

    return Array.from(new Set(images)).slice(0, 8);
  } catch (error) {
      return [];
  }
};

const getGbifTaxonKey = async (name: string): Promise<number | null> => {
    const data = await safeFetch(`${GBIF_API_URL}/species/match?name=${encodeURIComponent(name)}&verbose=false`);
    if (!data || !data.usageKey || data.matchType === 'NONE') return null;
    return data.usageKey;
}

const formatBasis = (basis: string) => {
    switch(basis) {
        case 'HUMAN_OBSERVATION': return 'Sighted in wild';
        case 'PRESERVED_SPECIMEN': return 'Museum Specimen';
        case 'MACHINE_OBSERVATION': return 'Automated sensor';
        case 'FOSSIL_SPECIMEN': return 'Fossil';
        default: return 'Observation';
    }
}