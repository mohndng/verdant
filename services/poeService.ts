
// This service is deprecated. The Poe API endpoint provided blocks browser-based requests (CORS).
// We have reverted to using Google Gemini 2.5 Flash which provides robust, low-cost text generation
// and native CORS support for frontend applications.

export const queryPoe = async (systemPrompt: string, userPrompt: string, jsonMode: boolean = true): Promise<string> => {
    throw new Error("Poe Service is disabled due to CORS/Network restrictions. Using Gemini 2.5 Flash fallback.");
};
