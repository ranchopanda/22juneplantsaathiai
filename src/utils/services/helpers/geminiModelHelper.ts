import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEYS, SAFETY_SETTINGS } from "../config/geminiConfig";

export const createGeminiModel = (apiKey: string, modelName: string = "gemini-2.0-flash") => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: modelName,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  });
};

// Sleep function for exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const tryWithApiKeys = async <T>(
  operation: (apiKey: string) => Promise<T>,
  fallback: T
): Promise<T> => {
  let lastError = null;
  
  for (const apiKey of API_KEYS) {
    if (!apiKey) continue; // Skip undefined or empty API keys
    
    // Try up to 3 times with exponential backoff for each key
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await operation(apiKey);
      } catch (apiError: any) {
        // Check if it's a rate limit error (429)
        const isRateLimit = apiError.toString().includes("429") || 
                          apiError.toString().includes("quota");
        
        if (isRateLimit && attempt < 2) {
          // Wait with exponential backoff: 2s, 4s, 8s...
          const backoffTime = Math.pow(2, attempt + 1) * 1000;
          console.log(`Rate limit hit. Retrying in ${backoffTime/1000}s...`);
          await sleep(backoffTime);
          continue;
        }
        
        console.error(`API key attempt failed (attempt ${attempt + 1}):`, apiError);
        lastError = apiError;
        break; // Move to next API key
      }
    }
  }
  
  console.error("All API keys failed:", lastError);
  return fallback;
};
