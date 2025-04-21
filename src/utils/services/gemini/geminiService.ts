import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { API_KEYS, SAFETY_SETTINGS, MODEL_CONFIG } from "../config/geminiConfig.js";
import { AnalysisData } from "../../types/analysis.js";

// Initialize Gemini with the first API key
const genAI = new GoogleGenerativeAI(API_KEYS[0]);

// Function to create a model instance with a specific API key
const createModel = (apiKey: string): GenerativeModel => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: MODEL_CONFIG.model,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 2048,
    }
  });
};

// Function to analyze plant image
export const analyzeWithGemini = async (imageData: string): Promise<AnalysisData> => {
  let lastError: Error | null = null;

  // Try each API key
  for (const apiKey of API_KEYS) {
    try {
      const model = createModel(apiKey);
      const result = await model.generateContent([
        "Analyze this plant image for diseases and provide detailed recommendations. Focus on:",
        "1. Disease identification",
        "2. Severity assessment",
        "3. Treatment recommendations",
        "4. Preventive measures",
        "Format the response as a structured analysis.",
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse the response and structure it
      return {
        disease_name: extractDiseaseName(text),
        confidence: calculateConfidence(text),
        recommendations: extractRecommendations(text),
        severity: assessSeverity(text),
        treatment_steps: extractTreatmentSteps(text),
        preventive_measures: extractPreventiveMeasures(text),
        additional_notes: extractAdditionalNotes(text),
        bounding_boxes: [], // Gemini doesn't provide bounding boxes
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`Failed with API key, trying next...`, error);
    }
  }

  // If all API keys fail, throw the last error
  throw lastError || new Error("Failed to analyze image with any API key");
};

// Helper functions to parse the response
function extractDiseaseName(text: string): string {
  const match = text.match(/Disease:\s*([^\n]+)/i);
  return match ? match[1].trim() : "Unknown";
}

function calculateConfidence(text: string): number {
  const match = text.match(/Confidence:\s*(\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : 0.8;
}

function extractRecommendations(text: string): string[] {
  const recommendations = text.match(/Recommendations:([\s\S]*?)(?=\n\n|$)/i);
  return recommendations 
    ? recommendations[1].split('\n').map(r => r.trim()).filter(r => r)
    : ["No specific recommendations available"];
}

function assessSeverity(text: string): "low" | "medium" | "high" {
  const severityMatch = text.match(/Severity:\s*(low|medium|high)/i);
  return (severityMatch?.[1]?.toLowerCase() as "low" | "medium" | "high") || "medium";
}

function extractTreatmentSteps(text: string): string[] {
  const treatment = text.match(/Treatment:([\s\S]*?)(?=\n\n|$)/i);
  return treatment 
    ? treatment[1].split('\n').map(t => t.trim()).filter(t => t)
    : ["No specific treatment steps available"];
}

function extractPreventiveMeasures(text: string): string[] {
  const prevention = text.match(/Prevention:([\s\S]*?)(?=\n\n|$)/i);
  return prevention 
    ? prevention[1].split('\n').map(p => p.trim()).filter(p => p)
    : ["No specific preventive measures available"];
}

function extractAdditionalNotes(text: string): string {
  const notes = text.match(/Additional Notes:([\s\S]*?)(?=\n\n|$)/i);
  return notes ? notes[1].trim() : "";
} 