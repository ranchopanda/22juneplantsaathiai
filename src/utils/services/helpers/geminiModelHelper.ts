import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEYS, SAFETY_SETTINGS } from "../config/geminiConfig";

export const createGeminiModel = (apiKey: string, modelName: string = "gemini-1.5-pro") => {
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

export const tryWithApiKeys = async <T>(
  operation: (apiKey: string) => Promise<T>,
  fallback: T
): Promise<T> => {
  let lastError = null;
  
  for (const apiKey of API_KEYS) {
    try {
      return await operation(apiKey);
    } catch (apiError) {
      console.error(`API key attempt failed:`, apiError);
      lastError = apiError;
    }
  }
  
  console.error("All API keys failed:", lastError);
  return fallback;
};
