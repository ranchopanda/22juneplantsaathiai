import { createGeminiModel, tryWithApiKeys } from '../helpers/geminiModelHelper';
import { getCropData, getSoilData, getDiseaseImpact } from '../cropKnowledgeService';

export interface YieldPredictionResult {
  predictedYield: number;
  yieldUnit: string;
  confidence: number;
  potentialIncome: number;
  recommendations: string[];
  diseaseLossPercent?: number;
  // Additional structured data for transparency
  idealConditions?: {
    temperature: { min: number; max: number };
    rainfall: { min: number; max: number };
  };
  actualConditions?: {
    temperature: number;
    rainfall: number;
    soilProductivityFactor: number;
  };
}

export const predictYield = async (
  crop: string,
  area: number,
  soilType: string,
  rainfall: number,
  temperature: number,
  disease: string | null
): Promise<YieldPredictionResult> => {
  // 1. Fetch structured data from our knowledge base
  const cropInfo = await getCropData(crop);
  const soilInfo = await getSoilData(soilType);
  let diseaseInfo = null;
  let diseaseLossPercent = 0;
  
  if (disease && disease !== "none") {
    diseaseInfo = await getDiseaseImpact(disease, crop);
    // Calculate average disease impact
    diseaseLossPercent = Math.round((diseaseInfo.lossPercent.min + diseaseInfo.lossPercent.max) / 2);
  }
  
  // 2. Calculate initial confidence based on deviations from ideal conditions
  let initialConfidence = 85; // Start with high confidence
  
  // Check temperature deviation
  if (temperature < cropInfo.idealTemperature.min) {
    const deviation = cropInfo.idealTemperature.min - temperature;
    initialConfidence -= Math.min(deviation * 2, 15); // Max 15% penalty
  } else if (temperature > cropInfo.idealTemperature.max) {
    const deviation = temperature - cropInfo.idealTemperature.max;
    initialConfidence -= Math.min(deviation * 2, 15); // Max 15% penalty
  }
  
  // Check rainfall deviation
  if (rainfall < cropInfo.idealRainfall.min) {
    const deviationPercent = (cropInfo.idealRainfall.min - rainfall) / cropInfo.idealRainfall.min * 100;
    initialConfidence -= Math.min(deviationPercent / 5, 20); // Max 20% penalty
  } else if (rainfall > cropInfo.idealRainfall.max) {
    const deviationPercent = (rainfall - cropInfo.idealRainfall.max) / cropInfo.idealRainfall.max * 100;
    initialConfidence -= Math.min(deviationPercent / 5, 15); // Max 15% penalty
  }
  
  // Factor in soil productivity
  initialConfidence *= soilInfo.productivityWeight;
  
  // Disease presence significantly reduces confidence
  if (diseaseLossPercent > 0) {
    initialConfidence -= Math.min(diseaseLossPercent / 2, 20); // Max 20% penalty
  }
  
  // Ensure confidence is at least 20% and at most 95%
  initialConfidence = Math.max(20, Math.min(95, initialConfidence));
  
  // 3. Prepare enhanced structured prompt with our data
  const prompt = `As an agricultural AI expert, analyze the following farm conditions and provide a detailed yield prediction.

Crop: ${crop}
Ideal Rainfall for ${crop}: ${cropInfo.idealRainfall.min}-${cropInfo.idealRainfall.max} mm
Actual Annual Rainfall: ${rainfall} mm
Ideal Temperature for ${crop}: ${cropInfo.idealTemperature.min}-${cropInfo.idealTemperature.max}°C
Actual Average Temperature: ${temperature}°C
Soil Type: ${soilType} (Productivity Weight: ${soilInfo.productivityWeight.toFixed(2)})
Land Area: ${area} hectares
Disease Present: ${disease || 'None'}
${disease && disease !== 'none' ? `Potential Disease Impact on ${crop} for ${disease}: ${diseaseLossPercent}%` : ''}

Initial Yield Estimation:
- Base yield per hectare: ${cropInfo.yieldRange.min.toFixed(2)}-${cropInfo.yieldRange.max.toFixed(2)} tons
- Base confidence from conditions analysis: ${initialConfidence.toFixed(1)}%
- Current market price: ₹${cropInfo.pricePerTon} per ton

Provide a JSON response with the following structure:
{
  "predictedYield": number (in tons, consider all factors including area, conditions and disease),
  "yieldUnit": "tons",
  "confidence": number (percentage between 0-100, reflecting certainty in the prediction),
  "potentialIncome": number (in INR, based on current market price of ₹${cropInfo.pricePerTon} per ton),
  "recommendations": array of strings with specific farming advice addressing:
    - Any rainfall or temperature deviations from ideal conditions
    - Soil management for ${soilType}
    - ${disease && disease !== 'none' ? `Disease management for ${disease}` : 'Preventive measures for common diseases'}
    - Any other relevant advice for maximizing yield
  ${disease && disease !== 'none' ? '"diseaseLossPercent": number (percentage of yield loss due to disease)' : ''}
}

Consider local Indian agricultural conditions, regional practices, and provide practical recommendations that farmers can implement.`;

  return tryWithApiKeys(async (apiKey) => {
    // Use Gemini 2.0 Flash model
    const model = createGeminiModel(apiKey);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const prediction = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      // If LLM predictions are wildly off from our estimates, use our data instead
      const predictedYield = Number(prediction.predictedYield) || 0;
      const expectedMaxYield = cropInfo.yieldRange.max * area * soilInfo.productivityWeight;
      
      let finalYield = predictedYield;
      // If the prediction is more than 50% above our maximum estimate, cap it
      if (predictedYield > expectedMaxYield * 1.5) {
        finalYield = expectedMaxYield;
      }
      
      // Build the final result with our structured data for transparency
      return {
        predictedYield: finalYield,
        yieldUnit: prediction.yieldUnit || "tons",
        confidence: Number(prediction.confidence) || initialConfidence,
        potentialIncome: Number(prediction.potentialIncome) || Math.round(finalYield * cropInfo.pricePerTon),
        recommendations: Array.isArray(prediction.recommendations) 
          ? prediction.recommendations 
          : ["Consider consulting local agricultural experts for specific advice."],
        ...(disease && disease !== 'none' && { 
          diseaseLossPercent: Number(prediction.diseaseLossPercent) || diseaseLossPercent 
        }),
        // Include structured data about conditions for transparency
        idealConditions: {
          temperature: cropInfo.idealTemperature,
          rainfall: cropInfo.idealRainfall
        },
        actualConditions: {
          temperature: temperature,
          rainfall: rainfall,
          soilProductivityFactor: soilInfo.productivityWeight
        }
      };
    } catch (error) {
      console.error("Error parsing yield prediction response:", error);
      
      // Fallback to our own calculation if LLM response fails
      const baseYield = ((cropInfo.yieldRange.min + cropInfo.yieldRange.max) / 2) * area * soilInfo.productivityWeight;
      const yieldAfterDisease = disease && disease !== 'none' 
        ? baseYield * (1 - diseaseLossPercent/100) 
        : baseYield;
        
      return {
        predictedYield: Number(yieldAfterDisease.toFixed(2)),
        yieldUnit: "tons",
        confidence: initialConfidence,
        potentialIncome: Math.round(yieldAfterDisease * cropInfo.pricePerTon),
        recommendations: [
          `Ensure proper water management for your ${crop} crop.`,
          `For ${soilType}, consider appropriate fertilization.`,
          disease && disease !== 'none' ? `Treat ${disease} promptly to minimize yield loss.` : "Monitor for common diseases regularly.",
          "Consult local agricultural extension services for specific advice."
        ],
        ...(disease && disease !== 'none' && { diseaseLossPercent }),
        idealConditions: {
          temperature: cropInfo.idealTemperature,
          rainfall: cropInfo.idealRainfall
        },
        actualConditions: {
          temperature,
          rainfall,
          soilProductivityFactor: soilInfo.productivityWeight
        }
      };
    }
  }, {
    predictedYield: 0,
    yieldUnit: "tons",
    confidence: initialConfidence,
    potentialIncome: 0,
    recommendations: ["Unable to generate prediction. Please try again."],
    ...(disease && disease !== 'none' && { diseaseLossPercent }),
    // Add missing properties to satisfy TypeScript
    idealConditions: {
      temperature: cropInfo.idealTemperature,
      rainfall: cropInfo.idealRainfall
    },
    actualConditions: {
      temperature,
      rainfall,
      soilProductivityFactor: soilInfo.productivityWeight
    }
  });
};
