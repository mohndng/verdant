const XENO_CANTO_API = "https://xeno-canto.org/api/2/recordings";

export const fetchNatureAudio = async (scientificName: string): Promise<{ audioUrl?: string, author?: string }> => {
    try {
        if (!scientificName) return {};
        
        const query = `${scientificName} q:A`;
        // Xeno-canto often blocks direct browser calls due to CORS.
        // If this fails, we catch it. In a real production app, you'd use a proxy.
        // For now, we try/catch to ensure the app doesn't crash.
        const res = await fetch(`${XENO_CANTO_API}?query=${encodeURIComponent(query)}`);
        
        if (!res.ok) return {};

        const data = await res.json();
        
        if (!data.recordings || data.recordings.length === 0) return {};

        const recording = data.recordings[0];
        return {
            audioUrl: recording.file,
            author: recording.rec
        };

    } catch (e) {
        // Silent fail for audio
        return {};
    }
};