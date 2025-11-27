const INAT_API_URL = "https://api.inaturalist.org/v1";

const safeFetch = async (url: string) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000); // 6s timeout
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        clearTimeout(id);
        return null;
    }
};

export const fetchInaturalistData = async (scientificName: string): Promise<{ images: string[], seasonality: Record<string, number>, heroImage?: string }> => {
  try {
    const searchData = await safeFetch(`${INAT_API_URL}/taxa?q=${encodeURIComponent(scientificName)}&rank=species&per_page=1`);
    
    if (!searchData || !searchData.results || searchData.results.length === 0) {
      return { images: [], seasonality: {} };
    }
    
    const taxonId = searchData.results[0].id;
    
    // Parallel Fetch
    const obsUrl = `${INAT_API_URL}/observations?taxon_id=${taxonId}&photos=true&quality_grade=research&per_page=6&order_by=votes`;
    const histUrl = `${INAT_API_URL}/observations/histogram?taxon_id=${taxonId}&date_field=observed&interval=month_of_year`;

    const [obsData, histData] = await Promise.all([
        safeFetch(obsUrl),
        safeFetch(histUrl)
    ]);

    const rawImages = obsData?.results
        ?.map((r: any) => r.photos[0]?.url)
        .filter(Boolean) || [];

    const galleryImages = rawImages.map((url: string) => url.replace('square', 'medium'));
    const heroImage = rawImages.length > 0 ? rawImages[0].replace('square', 'large') : undefined;
    const seasonality = histData?.results?.month_of_year || {};

    return { images: galleryImages, seasonality, heroImage };

  } catch (e) {
    return { images: [], seasonality: {} };
  }
};