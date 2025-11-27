const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

export const fetchWikiImage = async (query: string): Promise<{ imageUrl?: string, sourceUrl?: string }> => {
  try {
    // Search for page
    const searchParams = new URLSearchParams({
      action: 'query', format: 'json', list: 'search', srsearch: query, srlimit: '1', origin: '*'
    });

    const searchRes = await fetch(`${WIKI_API_URL}?${searchParams.toString()}`);
    const searchData = await searchRes.json();

    if (!searchData.query?.search?.length) return {};
    const pageTitle = searchData.query.search[0].title;

    // Get Image
    const imageParams = new URLSearchParams({
      action: 'query', format: 'json', prop: 'pageimages|info', piprop: 'thumbnail|original',
      pithumbsize: '1000', inprop: 'url', titles: pageTitle, redirects: '1', origin: '*'
    });

    const imageRes = await fetch(`${WIKI_API_URL}?${imageParams.toString()}`);
    const imageData = await imageRes.json();
    
    const pages = imageData.query?.pages;
    if (!pages) return {};
    const page = Object.values(pages)[0] as any;
    if (!page || page.pageid === -1) return {};

    return {
      imageUrl: page.original?.source || page.thumbnail?.source,
      sourceUrl: page.fullurl
    };
  } catch (error) {
    return {};
  }
};

export const fetchWikiSuggestions = async (query: string): Promise<string[]> => {
  try {
    const params = new URLSearchParams({
      action: 'opensearch', search: query, limit: '10', namespace: '0', format: 'json', origin: '*'
    });

    const res = await fetch(`${WIKI_API_URL}?${params.toString()}`);
    const data = await res.json();
    
    const titles = data[1] || [];
    return titles.slice(0, 5);
  } catch (e) {
    return [];
  }
};