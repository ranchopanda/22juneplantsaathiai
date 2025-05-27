import { AnalysisData } from '../types/analysisTypes';
import { analyzePlantDisease } from '../services/analysis/plantDiseaseAnalysis';

/**
 * Detects plant diseases using Gemini AI
 * @param base64Image Base64 encoded image
 * @param plantType Optional plant type for more accurate detection
 * @returns Analysis data with disease information
 */
export const detectPlantDisease = async (
  base64Image: string,
  plantType?: string
): Promise<AnalysisData> => {
  if (!base64Image) {
    throw new Error("Image data is required");
  }

  // Create context for Gemini AI
  const context = {
    cropType: plantType || "Unknown",
    specificPlant: plantType || "Unknown",
    location: "Unknown"
  };

  try {
    // Use Gemini AI for detection
    const result = await analyzePlantDisease(base64Image);
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        console.error("Error in plant disease detection:", error.message);
      } else {
        console.error("Error in plant disease detection:", JSON.stringify(error, null, 2));
      }
    }
    throw error;
  }
}; 