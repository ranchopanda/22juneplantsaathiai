
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const API_KEYS = [
  "AIzaSyAnxLXZytFZA-gUYL4Nu8pfIvqcGwHetFU", // User provided API key
  "AIzaSyDp5YvjBvD-iqK5zKzNAi71uWWD6isHrVc", // User provided API key
];

export const MODEL_CONFIG = {
  model: "gemini-1.5-flash", // Or the appropriate model name
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
