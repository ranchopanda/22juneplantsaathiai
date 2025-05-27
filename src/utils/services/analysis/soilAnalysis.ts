import { createGeminiModel, tryWithApiKeys } from '../helpers/geminiModelHelper';

export interface SoilAnalysisResult {
  soil_type: string;
  confidence: number;
  ph_level: string;
  nutrients: {
    name: string;
    level: "Low" | "Medium" | "High";
    confidence: number;
    recommendation: string;
  }[];
  recommendations: string[];
  organic_solutions: string[];
  chemical_solutions: string[];
  suitable_crops: string[];
  location_context?: string;
  estimated_organic_matter?: string;
  image_quality_score?: number;
}

const FALLBACK_RESULT: SoilAnalysisResult = {
  soil_type: "Unknown",
  confidence: 0,
  ph_level: "Unknown",
  nutrients: [
    {
      name: "Nitrogen (N)",
      level: "Low",
      confidence: 50,
      recommendation: "Consider soil testing for accurate nutrient levels"
    }
  ],
  recommendations: [
    "Please try again with a clearer image",
    "Ensure good lighting when taking the photo",
    "Include more soil surface area in the image"
  ],
  organic_solutions: ["Consider laboratory soil testing for accurate results"],
  chemical_solutions: ["Consider laboratory soil testing for accurate results"],
  suitable_crops: ["Unable to determine suitable crops from this image"]
};

export const analyzeSoil = async (
  base64Image: string, 
  locationContext?: string
): Promise<SoilAnalysisResult> => {
  if (!base64Image) {
    throw new Error("No image provided");
  }

  return tryWithApiKeys(async (apiKey) => {
    const model = createGeminiModel(apiKey);
    
    const locationPrompt = locationContext ? 
      `The image is from ${locationContext}. Consider local soil types and agricultural practices for this region.` : 
      `Focus on agricultural relevance for Indian farming conditions.`;
    
    const prompt = `As an expert agricultural soil analyst, examine this soil image and provide a comprehensive analysis in JSON format.
    
    Consider these details:
    - Soil color, texture, and structure
    - Visual indicators of nutrient content and deficiencies
    - Signs of organic matter and its decomposition
    - Soil structure, porosity and composition
    - Potential pH range based on visual clues
    - Possible contamination or issues
    - Estimated quality for agricultural use
    
    ${locationPrompt}
    
    Provide your analysis in this exact JSON format:
    {
      "soil_type": "specific soil type name with scientific classification if possible",
      "confidence": number between 0-100 for overall analysis confidence,
      "ph_level": "estimated pH range (e.g., '6.0-6.5')",
      "image_quality_score": number between 0-100 rating the clarity and usefulness of the provided image,
      "estimated_organic_matter": "percentage range or qualitative assessment (Low/Medium/High)",
      "nutrients": [
        {
          "name": "nutrient name",
          "level": "Low/Medium/High",
          "confidence": number between 0-100 for confidence in this specific nutrient assessment,
          "recommendation": "specific recommendation for addressing this nutrient level"
        }
      ],
      "recommendations": [
        "array of 3-5 specific recommendations for soil improvement in order of priority"
      ],
      "organic_solutions": [
        "array of 2-4 organic/natural approaches to improve this soil"
      ],
      "chemical_solutions": [
        "array of 2-4 specific fertilizers or amendments with approximate application rates"
      ],
      "suitable_crops": [
        "array of 3-6 crops well-suited for this soil type"
      ]
    }

    Be specific, practical and actionable in your recommendations. If you cannot confidently determine certain aspects, provide your best estimate but assign lower confidence scores.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
    ]);
    
    const response = result.response;
    const text = response.text();
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return {
        soil_type: analysis.soil_type || FALLBACK_RESULT.soil_type,
        confidence: Number(analysis.confidence) || FALLBACK_RESULT.confidence,
        ph_level: analysis.ph_level || FALLBACK_RESULT.ph_level,
        nutrients: Array.isArray(analysis.nutrients) 
          ? analysis.nutrients.map(n => ({
              name: n.name || "Unknown Nutrient",
              level: (n.level === "Low" || n.level === "Medium" || n.level === "High") 
                ? n.level 
                : "Low",
              confidence: Number(n.confidence) || 50,
              recommendation: n.recommendation || "Consult local agricultural expert"
            }))
          : FALLBACK_RESULT.nutrients,
        recommendations: Array.isArray(analysis.recommendations)
          ? analysis.recommendations
          : FALLBACK_RESULT.recommendations,
        organic_solutions: Array.isArray(analysis.organic_solutions)
          ? analysis.organic_solutions
          : FALLBACK_RESULT.organic_solutions,
        chemical_solutions: Array.isArray(analysis.chemical_solutions)
          ? analysis.chemical_solutions
          : FALLBACK_RESULT.chemical_solutions,
        suitable_crops: Array.isArray(analysis.suitable_crops)
          ? analysis.suitable_crops
          : FALLBACK_RESULT.suitable_crops,
        image_quality_score: Number(analysis.image_quality_score) || undefined,
        estimated_organic_matter: analysis.estimated_organic_matter || undefined,
        location_context: locationContext
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        if (error instanceof Error) {
          console.error("Error parsing soil analysis response:", error.message);
        } else {
          console.error("Error parsing soil analysis response:", JSON.stringify(error, null, 2));
        }
      }
      throw new Error("Failed to analyze soil image");
    }
  }, FALLBACK_RESULT);
};

