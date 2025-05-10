import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_PRIMARY as string,
  "AIzaSyAnxLXZytFZA-gUYL4Nu8pfIvqcGwHetFU",
  "AIzaSyDp5YvjBvD-iqK5zKzNAi71uWWD6isHrVc",
];

export const MODEL_CONFIG = {
  model: "gemini-2.0-flash", // Updated to gemini-2.0-flash for higher quotas
};

export const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];
