import { AnalysisData, FarmerContext, QuickAnalysisData, PotentialIssue, SeverityScore, ProgressionTracking } from "../../types/analysisTypes";

// Read API key from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY_PRIMARY as string;

// API endpoints for Gemini - having multiple models for fallback
const API_ENDPOINTS = {
  primary: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  fallback: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
};

// Safety settings as direct API parameters
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
];

const GENERATION_CONFIG = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 2048,
};

// Config for quick analysis with lower token count
const QUICK_ANALYSIS_GENERATION_CONFIG = {
  temperature: 0.3, // Slightly lower for more focused quick answers
  topK: 32,
  topP: 1,
  maxOutputTokens: 800, // Quick analysis should be shorter
};

// Helper for sleeping between retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API request with retries
const makeRequestWithRetries = async (
  endpoint: string, 
  requestBody: any, 
  maxRetries = 3, 
  initialDelay = 2000
): Promise<any> => {
  let lastError = null;
  let currentEndpoint = endpoint;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // For the last attempt, try the fallback model
      if (attempt === maxRetries - 1 && currentEndpoint === API_ENDPOINTS.primary) {
        console.log("Trying fallback model for final attempt...");
        currentEndpoint = API_ENDPOINTS.fallback;
      }

      const requestUrl = `${currentEndpoint}?key=${GEMINI_API_KEY}`;
      
      console.log(`API request attempt ${attempt + 1}/${maxRetries} to ${currentEndpoint.includes("gemini-2.0") ? "gemini-2.0-flash" : "gemini-1.5-flash"}`);
      
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Attempt ${attempt + 1} failed with status ${response.status}:`, errorData);
        
        // Check for rate limit or overload conditions
        const isOverloaded = 
          response.status === 503 || 
          response.status === 429 || 
          errorData.error?.message?.includes("overloaded") ||
          errorData.error?.message?.includes("quota");
        
        if (isOverloaded && attempt < maxRetries - 1) {
          // Calculate backoff delay with exponential increase
          const backoffDelay = initialDelay * Math.pow(2, attempt);
          console.log(`Service overloaded. Retrying in ${backoffDelay/1000} seconds...`);
          await sleep(backoffDelay);
          continue;
        }
        
        // Get more specific error message from Gemini response
        const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Only retry if it's a network-related error or a retryable server error
      if (error instanceof Error && 
          (error.message.includes("network") || 
           error.message.includes("overloaded") || 
           error.message.includes("capacity") ||
           error.message.includes("quota")) && 
          attempt < maxRetries - 1) {
        const backoffDelay = initialDelay * Math.pow(2, attempt);
        console.log(`Error: ${error.message}. Retrying in ${backoffDelay/1000} seconds...`);
        await sleep(backoffDelay);
        continue;
      }
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error("All API request attempts failed");
};

// Function to provide a quick, preliminary analysis of the plant image
export const getQuickAnalysisFromGemini = async (
  imageData: string,
  quickContext: { location?: string; plantVariety?: string } = {} // Minimal context for quick analysis
): Promise<QuickAnalysisData> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found in environment variables.");
  }

  let promptText = `SYSTEM: You are AgriAdvisor AI. Provide a QUICK and PRELIMINARY assessment based ONLY on the provided image and minimal context (location, crop type).
Focus on 1-3 most likely issues, offer very general, safe initial advice, and encourage the user to provide more details for a full diagnosis.
Strictly format your entire response as a single JSON object. Do not include any text outside of this JSON object, including markdown formatting.
The JSON object should conform to the following structure:
{
  "potentialIssues": [
    { "name": "string (e.g., 'Possible Early Blight')", "reasoning": "string (Brief reasoning based on image)" }
  ],
  "initialConfidence": "string ('Very Low', 'Low', 'Medium', or 'High' - for the overall preliminary assessment)",
  "generalAdvice": ["string (1-2 very general, safe initial tips, e.g., 'Isolate affected plants if possible.')"],
  "nextStepPrompt": "string (e.g., 'This is a preliminary look. For a detailed diagnosis and tailored treatment plan, please provide more information about symptoms and conditions.')"
}

FARMER PROVIDED IMAGE AND MINIMAL CONTEXT:
Image: [Attached Below]
`;

  if (quickContext.location) promptText += `Location: ${quickContext.location}\n`;
  if (quickContext.plantVariety) promptText += `Crop Type: ${quickContext.plantVariety}\n`;

  promptText += `
TASK:
1. Identify 1-3 most probable issues based *only* on the image and provided minimal context.
2. Briefly state the reasoning for each potential issue.
3. Provide an overall initial confidence level for this preliminary assessment.
4. Suggest 1-2 very general and safe pieces of advice.
5. Include a clear prompt for the user to seek a more detailed analysis.
6. Ensure the response is ONLY the JSON object specified above. No extra text.
`;

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: "image/jpeg", // Or other appropriate mime type
                data: imageData,
              },
            },
          ],
        },
      ],
      safety_settings: SAFETY_SETTINGS,
      generation_config: QUICK_ANALYSIS_GENERATION_CONFIG, // Use specific config for quick analysis
    };

    const responseData = await makeRequestWithRetries(
      API_ENDPOINTS.primary, // You might want to use the faster model (e.g., Flash) preferentially here
      requestBody,
      3,
      1500 // Slightly shorter initial delay for quick analysis retries
    );

    if (!responseData.candidates || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0].text) {
      console.error("Unexpected API response structure for quick analysis:", responseData);
      throw new Error("Failed to extract text from Gemini API response for quick analysis.");
    }

    let rawText = responseData.candidates[0].content.parts[0].text;
    rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (jsonError) {
      console.error("Failed to parse JSON response for quick analysis:", jsonError, "\nRaw text:", rawText);
      // Attempt to extract JSON if embedded
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0]);
        } catch (secondJsonError) {
          console.error("Failed to parse extracted JSON for quick analysis:", secondJsonError);
          throw new Error("Failed to parse Gemini response as JSON for quick analysis (after extraction attempt).");
        }
      } else {
        throw new Error("Failed to parse Gemini response as JSON for quick analysis.");
      }
    }
    
    // Construct QuickAnalysisData
    const quickAnalysisResult: QuickAnalysisData = {
      id: `gemini-quick-${new Date().getTime()}`,
      timestamp: new Date().toISOString(),
      potentialIssues: parsedResult.potentialIssues || [{ name: "Unknown Issue", reasoning: "Could not determine potential issues from image." }],
      initialConfidence: parsedResult.initialConfidence || "Low",
      generalAdvice: parsedResult.generalAdvice || ["Monitor the plant closely."],
      nextStepPrompt: parsedResult.nextStepPrompt || "For a detailed diagnosis, please provide more information.",
      model_version: responseData.modelId || API_ENDPOINTS.primary.split('/').pop()?.split(':')[0], // Extract model name
      crop_type_provided: quickContext.plantVariety,
      location_provided: quickContext.location,
    };

    return quickAnalysisResult;

  } catch (error) {
    console.error(`Failed to get quick analysis:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to get quick analysis with Gemini API: ${error.message}`);
    }
    throw new Error("Failed to get quick analysis with Gemini API due to an unknown error.");
  }
};

// New function to calculate severity scores based on analysis
const calculateSeverityScore = (analysis: any): SeverityScore => {
  // Initialize with default overall score
  const severityScore: SeverityScore = {
    overall: 5 // Default mid-range score
  };

  // Calculate overall severity based on disease stage
  if (analysis.diseaseStageEstimation) {
    switch (analysis.diseaseStageEstimation) {
      case "Early":
        severityScore.overall = 3;
        break;
      case "Moderate":
        severityScore.overall = 6;
        break;
      case "Advanced":
        severityScore.overall = 9;
        break;
      default:
        severityScore.overall = 5;
    }
  }

  // Adjust based on impact assessment if available
  if (analysis.impactAssessment) {
    // Impact on yield
    if (analysis.impactAssessment.yieldImpact) {
      if (analysis.impactAssessment.yieldImpact.includes("High")) {
        severityScore.economicImpact = 9;
        severityScore.overall += 2;
      } else if (analysis.impactAssessment.yieldImpact.includes("Moderate")) {
        severityScore.economicImpact = 6;
        severityScore.overall += 1;
      } else if (analysis.impactAssessment.yieldImpact.includes("Low")) {
        severityScore.economicImpact = 3;
      }
    }

    // Spread risk
    if (analysis.impactAssessment.spreadRisk) {
      severityScore.spreadRate = analysis.impactAssessment.spreadRisk === "High" ? 9 :
                                analysis.impactAssessment.spreadRisk === "Medium" ? 6 : 3;
      
      // Adjust overall score based on spread risk
      if (analysis.impactAssessment.spreadRisk === "High") {
        severityScore.overall += 1;
      }
    }

    // Recovery chance (inverse relationship to severity)
    if (analysis.impactAssessment.recoveryChance === "Low") {
      severityScore.overall += 1;
      severityScore.treatmentDifficulty = 8;
    } else if (analysis.impactAssessment.recoveryChance === "High") {
      severityScore.overall -= 1;
      severityScore.treatmentDifficulty = 4;
    }
  }

  // Parse symptoms analysis for specific damage types
  if (analysis.symptomsAnalysis) {
    const symptomsLower = analysis.symptomsAnalysis.toLowerCase();
    
    // Check for leaf damage
    if (symptomsLower.includes("leaf") || 
        symptomsLower.includes("leaves") || 
        symptomsLower.includes("foliar")) {
      // Check for severity words near "leaf"
      severityScore.leafDamage = symptomsLower.includes("severe leaf") ? 8 :
                               symptomsLower.includes("moderate leaf") ? 5 : 3;
    }
    
    // Check for stem damage
    if (symptomsLower.includes("stem") || 
        symptomsLower.includes("trunk") || 
        symptomsLower.includes("stalk")) {
      severityScore.stemDamage = symptomsLower.includes("severe stem") ? 9 :
                               symptomsLower.includes("moderate stem") ? 6 : 4;
      // Stem damage often indicates more serious issues
      if (severityScore.stemDamage > 6) {
        severityScore.overall += 1;
      }
    }
    
    // Check for fruit damage
    if (symptomsLower.includes("fruit") || 
        symptomsLower.includes("vegetable") || 
        symptomsLower.includes("produce")) {
      severityScore.fruitDamage = symptomsLower.includes("severe fruit") ? 9 :
                                symptomsLower.includes("moderate fruit") ? 6 : 3;
      // Direct impact on yield
      if (severityScore.fruitDamage > 6) {
        severityScore.economicImpact = Math.max(severityScore.economicImpact || 0, 8);
      }
    }
    
    // Check for root damage
    if (symptomsLower.includes("root") || 
        symptomsLower.includes("wilt") || 
        symptomsLower.includes("droop")) {
      severityScore.rootDamage = symptomsLower.includes("severe root") ? 9 :
                               symptomsLower.includes("moderate root") ? 6 : 4;
      // Root issues are often serious
      if (severityScore.rootDamage > 5) {
        severityScore.overall += 1;
      }
    }
  }

  // Ensure overall score is within 1-10 range
  severityScore.overall = Math.max(1, Math.min(10, Math.round(severityScore.overall)));
  
  // Round all values to integers
  Object.keys(severityScore).forEach(key => {
    if (typeof severityScore[key as keyof SeverityScore] === 'number') {
      severityScore[key as keyof SeverityScore] = Math.round(severityScore[key as keyof SeverityScore] as number);
    }
  });

  return severityScore;
};

// Function to determine disease progression if previous analysis exists
const trackDiseaseProgression = async (
  currentAnalysis: any,
  previousAnalysisId?: string
): Promise<ProgressionTracking | undefined> => {
  if (!previousAnalysisId) {
    return undefined;
  }
  
  try {
    // In a real implementation, you would fetch the previous analysis from your database
    // This is a placeholder for demonstration purposes
    // const previousAnalysis = await fetchAnalysisFromDatabase(previousAnalysisId);
    
    // For demo purposes, we'll just return a mock progression tracking
    const progressionTracking: ProgressionTracking = {
      previousAnalysisId,
      changeSinceLastAnalysis: 'unknown',
      progressionRate: 'unknown',
      estimatedTimeToAction: 'Unknown without previous analysis data',
      progressNotes: 'To track disease progression over time, we need to compare with actual previous analysis data.'
    };
    
    // In a real implementation, you would compare the current and previous analyses
    // and determine the progression status
    /*
    if (previousAnalysis) {
      // Compare severity scores
      const previousSeverity = previousAnalysis.severityScore?.overall || 5;
      const currentSeverity = currentAnalysis.severityScore?.overall || 5;
      
      const severityDifference = currentSeverity - previousSeverity;
      
      if (severityDifference > 1) {
        progressionTracking.changeSinceLastAnalysis = 'worsened';
        progressionTracking.progressionRate = severityDifference > 3 ? 'rapid' : 'moderate';
        progressionTracking.estimatedTimeToAction = 'Immediate';
      } else if (severityDifference < -1) {
        progressionTracking.changeSinceLastAnalysis = 'improved';
        progressionTracking.progressionRate = 'moderate';
        progressionTracking.estimatedTimeToAction = 'Continue current treatment';
      } else {
        progressionTracking.changeSinceLastAnalysis = 'unchanged';
        progressionTracking.progressionRate = 'slow';
        progressionTracking.estimatedTimeToAction = 'Within 1 week';
      }
      
      const timeElapsed = (new Date().getTime() - new Date(previousAnalysis.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      progressionTracking.progressNotes = `Condition has ${progressionTracking.changeSinceLastAnalysis} over ${Math.round(timeElapsed)} days. `;
      
      if (progressionTracking.changeSinceLastAnalysis === 'worsened') {
        progressionTracking.progressNotes += 'Consider more aggressive treatment options.';
      } else if (progressionTracking.changeSinceLastAnalysis === 'improved') {
        progressionTracking.progressNotes += 'Current treatments appear to be effective. Continue monitoring.';
      } else {
        progressionTracking.progressNotes += 'Current treatments may be preventing spread but not resolving the issue. Consider treatment adjustments.';
      }
    }
    */
    
    return progressionTracking;
  } catch (error) {
    console.error('Error tracking disease progression:', error);
    return {
      previousAnalysisId,
      changeSinceLastAnalysis: 'unknown',
      progressionRate: 'unknown',
      estimatedTimeToAction: 'Error comparing with previous analysis',
      progressNotes: 'An error occurred while trying to track disease progression.'
    };
  }
};

// Updated function to analyze plant image using direct API calls with enhanced farmer context, severity scoring, and progression tracking
export const analyzeWithGemini = async (
  imageData: string,
  farmerContext: FarmerContext = {} // Add farmerContext, default to empty object
): Promise<AnalysisData> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found in environment variables.");
  }

  // Construct the detailed prompt with added content for severity scoring
  let promptText = `SYSTEM: You are AgriAdvisor AI, an expert agronomist and plant pathologist. The user has requested a DETAILED ANALYSIS. Your primary goal is to provide highly practical, specific, actionable, and (if location is provided) localized advice to farmers. Analyze the provided plant image and all contextual information from the farmer.

Strictly format your entire response as a single JSON object. Do not include any text outside of this JSON object, including markdown formatting like "\`\`\`json" or "\`\`\`".
The JSON object should conform to the following structure, populating all fields appropriately:
{
  "diseaseOrPestName": "string (e.g., 'Tomato Yellow Leaf Curl Virus (TYLCV)' or 'Aphids')",
  "confidence": "number (0.0 to 1.0, e.g., 0.95)",
  "symptomsAnalysis": "string (Detailed description of symptoms visible in the image and commonly associated, tailored to farmer observations if provided)",
  "diseaseStageEstimation": "string ('Early', 'Moderate', 'Advanced', or 'Unknown', estimated based on image and farmer context)",
  "impactAssessment": {
    "yieldImpact": "string (e.g., 'Moderate (30-70% potential loss if untreated)', 'Low (5-20%)')",
    "spreadRisk": "string ('Low', 'Medium', 'High')",
    "recoveryChance": "string ('Low', 'Medium', 'High' for the farm/less affected plants)"
  },
  "prioritizedActionPlan": {
    "immediateActions": ["string (Action 1 for next 24-72 hours)", "string (Action 2...)"],
    "shortTermManagement": ["string (Action 1 for next 1-3 weeks)", "string (Action 2...)"],
    "longTermPrevention": ["string (Action 1 for future seasons/prevention)", "string (Action 2...)"]
  },
  "treatmentOptions": {
    "organic": ["string (Specific organic treatment 1 with brief application advice, e.g., 'Neem Oil: Apply 2ml/L water every 7 days, ensuring full coverage.')", "string (Organic treatment 2...)"],
    "chemical": ["string (Specific chemical treatment 1 mentioning active ingredient/class and MoA rotation if relevant, e.g., 'Imidacloprid (Neonicotinoid - Group 4A): Apply as per label. Rotate with different MoA insecticide for whitefly control. Note local restrictions.')", "string (Chemical treatment 2...)"],
    "ipm": ["string (Specific IPM strategy 1, could be a combination of tactics)", "string (IPM strategy 2...)"],
    "culturalBiological": ["string (Cultural practice 1, e.g., 'Remove and destroy infected plants immediately and carefully.')", "string (Biological control agent 1, e.g., 'Introduce Encarsia formosa wasps.')"]
  },
  "resistantVarietiesNote": "string (Note on checking for or using resistant varieties, localized if possible e.g., 'For [Farmer's Location], look for TYLCV-resistant varieties like [Example Variety Name] at local nurseries.')",
  "additionalNotes": "string (Any other critical warnings, advice, or information, e.g., 'Whiteflies are the primary vector. Focus on their control.')"
}

FARMER PROVIDED IMAGE AND DETAILED CONTEXT:
Image: [Attached Below]
`;

  // Append farmer context to the prompt if available
  if (farmerContext.symptomsObserved) promptText += `Farmer's Description of Symptoms: ${farmerContext.symptomsObserved}\n`;
  if (farmerContext.location) promptText += `Farmer's Location: ${farmerContext.location}\n`;
  if (farmerContext.farmingPracticePreference) promptText += `Farming Practice Preference: ${farmerContext.farmingPracticePreference}\n`;
  if (farmerContext.percentageAffected) promptText += `Percentage of Plants Affected: ${farmerContext.percentageAffected}\n`;
  if (farmerContext.symptomsFirstNoticed) promptText += `Symptoms First Noticed: ${farmerContext.symptomsFirstNoticed}\n`;
  if (farmerContext.plantVariety) promptText += `Plant Variety: ${farmerContext.plantVariety}\n`;
  if (farmerContext.plantGrowthStage) promptText += `Plant Growth Stage: ${farmerContext.plantGrowthStage}\n`;
  if (farmerContext.recentTreatmentsOrChanges) promptText += `Recent Treatments or Changes: ${farmerContext.recentTreatmentsOrChanges}\n`;
  if (farmerContext.previousAnalysisId) promptText += `Previous Analysis ID: ${farmerContext.previousAnalysisId} (This is a follow-up analysis for tracking disease progression)\n`;

  promptText += `
TASK:
1.  Identify the primary disease or pest affecting the plant in the image, considering all farmer-provided context.
2.  Provide a confidence score for this identification.
3.  Analyze symptoms comprehensively, correlating with farmer's observations.
4.  Estimate the disease/pest stage.
5.  Assess potential yield impact, spread risk, and recovery chance.
6.  Formulate a prioritized action plan (Immediate, Short-term, Long-term).
7.  Detail specific treatment options, clearly distinguishing between Organic, Chemical, IPM, and Cultural/Biological methods. Strongly tailor suggestions towards the farmer's practice preference if given, but list key alternatives. Be specific (e.g., mention active ingredients for chemicals, specific biological agents, application rates if standard).
8.  Include a note about resistant varieties, making it local if possible based on location context.
9.  Add any crucial additional notes.
10. Ensure the response is ONLY the JSON object specified above.
`;

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText }, // Our detailed prompt
            {
              inline_data: {
                mime_type: "image/jpeg", // Or image/png, etc.
                data: imageData,
              },
            },
          ],
        },
      ],
      safety_settings: SAFETY_SETTINGS,
      generation_config: GENERATION_CONFIG,
    };

    // Use the retry mechanism to make the API request
    const responseData = await makeRequestWithRetries(
      API_ENDPOINTS.primary, 
      requestBody,
      3,  // maxRetries
      2000 // initialDelay in ms
    );

    // Handle potential API response variations - ensure we get text to parse
    if (!responseData.candidates || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0].text) {
        console.error("Unexpected API response structure:", responseData);
        throw new Error("Failed to extract text from Gemini API response.");
    }
      
    let rawText = responseData.candidates[0].content.parts[0].text;

    // Gemini might wrap JSON in ```json ... ```, so strip it.
    rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    // Parse the JSON response directly
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      console.log("Raw text received:", rawText);
      
      // Attempt to extract a JSON object if it exists within the text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0]);
        } catch (secondJsonError) {
          console.error("Failed to parse extracted JSON:", secondJsonError);
          throw new Error("Failed to parse Gemini response as JSON.");
        }
      } else {
        throw new Error("Failed to parse Gemini response as JSON.");
      }
    }

    // Basic validation for critical fields
    if (!parsedResult.diseaseOrPestName || typeof parsedResult.confidence !== 'number') {
      console.warn("Parsed result missing critical fields:", parsedResult);
      // We'll continue anyway and use defaults for missing values
    }

    // Calculate severity score
    const severityScore = calculateSeverityScore(parsedResult);
    
    // Track disease progression if previous analysis ID is provided
    const progressionTracking = farmerContext.previousAnalysisId ? 
      await trackDiseaseProgression(parsedResult, farmerContext.previousAnalysisId) : 
      undefined;

    // Construct the full AnalysisData object
    const analysisResult: AnalysisData = {
      id: `gemini-detailed-${new Date().getTime()}`,
      type: "plant_disease_or_pest",
      timestamp: new Date().toISOString(),
      
      // Save both in old format fields (for backward compatibility) and new format
      // Legacy fields
      disease_name: parsedResult.diseaseOrPestName || "Unknown Diagnosis",
      confidence: Math.round((parsedResult.confidence || 0.5) * 100), // Convert 0-1 to 0-100
      description: parsedResult.symptomsAnalysis || "No symptoms analysis provided.",
      severity: parsedResult.diseaseStageEstimation || "Unknown",
      crop_type: farmerContext.plantVariety || "Unknown Plant",
      yield_impact: parsedResult.impactAssessment?.yieldImpact || "Unknown",
      spread_risk: parsedResult.impactAssessment?.spreadRisk || "Medium",
      recovery_chance: parsedResult.impactAssessment?.recoveryChance || "Medium",
      recommendations: [
        ...(parsedResult.prioritizedActionPlan?.immediateActions || []),
        ...(parsedResult.prioritizedActionPlan?.shortTermManagement || []),
      ],
      treatment_steps: [
        ...(parsedResult.treatmentOptions?.organic || []),
        ...(parsedResult.treatmentOptions?.chemical || []),
        ...(parsedResult.treatmentOptions?.ipm || []),
        ...(parsedResult.treatmentOptions?.culturalBiological || []),
      ],
      preventive_measures: [
        ...(parsedResult.prioritizedActionPlan?.longTermPrevention || []),
      ],
      additional_notes: parsedResult.additionalNotes || "",
      model_version: responseData.modelId || "gemini-2.0-flash",
      
      // Enhanced fields
      diseaseOrPestName: parsedResult.diseaseOrPestName || "Unknown Diagnosis",
      confidence_score: parsedResult.confidence || 0.5,
      symptomsAnalysis: parsedResult.symptomsAnalysis || "No symptoms analysis provided.",
      diseaseStageEstimation: parsedResult.diseaseStageEstimation || "Unknown",
      impactAssessment: parsedResult.impactAssessment || {
        yieldImpact: "Unknown",
        spreadRisk: "Medium",
        recoveryChance: "Medium"
      },
      prioritizedActionPlan: parsedResult.prioritizedActionPlan || {
        immediateActions: ["No immediate actions specified."],
        shortTermManagement: ["No short-term management specified."],
        longTermPrevention: ["No long-term prevention specified."]
      },
      treatmentOptions: parsedResult.treatmentOptions || {
        organic: [],
        chemical: [],
        ipm: [],
        culturalBiological: []
      },
      resistantVarietiesNote: parsedResult.resistantVarietiesNote || "",
      imageUrl: imageData?.substring(0, 20) ? `[Image data truncated]` : null, // Just store a reference, not the actual base64
      
      // Add severity score and progression tracking
      severityScore,
      progressionTracking
    };
    
    return analysisResult;

  } catch (error) {
    console.error(`Failed to analyze image:`, error);
    // Be more specific about the error passed upwards
    if (error instanceof Error) {
        throw new Error(`Failed to analyze image with Gemini API: ${error.message}`);
    }
    throw new Error("Failed to analyze image with Gemini API due to an unknown error.");
  }
};

// Function to generate a visual report of the plant disease analysis
export const generateVisualReport = (analysis: AnalysisData): string => {
  if (!analysis) {
    return "No analysis data available to generate report.";
  }
  
  // Extract data for report
  const diseaseName = analysis.diseaseOrPestName || analysis.disease_name || "Unknown Issue";
  const confidence = analysis.confidence_score || (analysis.confidence ? analysis.confidence / 100 : 0.5);
  const severityScore = analysis.severityScore?.overall || 5;
  const stage = analysis.diseaseStageEstimation || "Unknown";
  
  // Format the confidence as a percentage
  const confidencePercent = Math.round(confidence * 100);
  
  // Create severity color based on score (red for severe, yellow for moderate, green for mild)
  const getSeverityColor = (score: number): string => {
    if (score >= 8) return "#FF5252"; // Red for severe
    if (score >= 5) return "#FFA726"; // Orange for moderate
    return "#66BB6A"; // Green for mild
  };
  
  const severityColor = getSeverityColor(severityScore);
  
  // Create the visual severity gauge
  const createSeverityGauge = (score: number): string => {
    const totalBars = 10;
    const filledBars = Math.round(score);
    const emptyBars = totalBars - filledBars;
    
    let gauge = `<div style="background-color: #f5f5f5; border-radius: 10px; height: 20px; width: 100%; margin: 10px 0;">
      <div style="background-color: ${getSeverityColor(score)}; width: ${score * 10}%; height: 100%; border-radius: 10px;"></div>
    </div>`;
    
    return gauge;
  };
  
  // Create visual component charts for specific damage types
  const createDamageTypeCharts = (): string => {
    const damageTypes = [
      { name: "Leaf Damage", value: analysis.severityScore?.leafDamage || 0 },
      { name: "Stem Damage", value: analysis.severityScore?.stemDamage || 0 },
      { name: "Fruit Damage", value: analysis.severityScore?.fruitDamage || 0 },
      { name: "Root Damage", value: analysis.severityScore?.rootDamage || 0 }
    ].filter(item => item.value > 0);
    
    if (damageTypes.length === 0) {
      return "";
    }
    
    let chartHtml = '<div style="margin-top: 20px;"><h3>Damage Assessment</h3>';
    
    damageTypes.forEach(damage => {
      chartHtml += `
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>${damage.name}</span>
            <span><strong>${damage.value}/10</strong></span>
          </div>
          <div style="background-color: #f5f5f5; border-radius: 10px; height: 15px; width: 100%;">
            <div style="background-color: ${getSeverityColor(damage.value)}; width: ${damage.value * 10}%; height: 100%; border-radius: 10px;"></div>
          </div>
        </div>
      `;
    });
    
    chartHtml += '</div>';
    return chartHtml;
  };
  
  // Create prioritized action plan section
  const createActionPlanSection = (): string => {
    const immediateActions = analysis.prioritizedActionPlan?.immediateActions || [];
    const shortTermActions = analysis.prioritizedActionPlan?.shortTermManagement || [];
    const longTermActions = analysis.prioritizedActionPlan?.longTermPrevention || [];
    
    if (immediateActions.length === 0 && shortTermActions.length === 0 && longTermActions.length === 0) {
      return "";
    }
    
    let actionPlanHtml = '<div style="margin-top: 20px;"><h3>Prioritized Action Plan</h3>';
    
    if (immediateActions.length > 0) {
      actionPlanHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #FF5252;">Immediate Actions (24-72 hours)</h4><ul>';
      immediateActions.forEach(action => {
        actionPlanHtml += `<li>${action}</li>`;
      });
      actionPlanHtml += '</ul></div>';
    }
    
    if (shortTermActions.length > 0) {
      actionPlanHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #FFA726;">Short-Term Management (1-3 weeks)</h4><ul>';
      shortTermActions.forEach(action => {
        actionPlanHtml += `<li>${action}</li>`;
      });
      actionPlanHtml += '</ul></div>';
    }
    
    if (longTermActions.length > 0) {
      actionPlanHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #66BB6A;">Long-Term Prevention</h4><ul>';
      longTermActions.forEach(action => {
        actionPlanHtml += `<li>${action}</li>`;
      });
      actionPlanHtml += '</ul></div>';
    }
    
    actionPlanHtml += '</div>';
    return actionPlanHtml;
  };
  
  // Create treatment options section based on farming preference
  const createTreatmentSection = (): string => {
    const organicTreatments = analysis.treatmentOptions?.organic || [];
    const chemicalTreatments = analysis.treatmentOptions?.chemical || [];
    const ipmTreatments = analysis.treatmentOptions?.ipm || [];
    const culturalBiologicalTreatments = analysis.treatmentOptions?.culturalBiological || [];
    
    if (organicTreatments.length === 0 && chemicalTreatments.length === 0 && 
        ipmTreatments.length === 0 && culturalBiologicalTreatments.length === 0) {
      return "";
    }
    
    let treatmentHtml = '<div style="margin-top: 20px;"><h3>Treatment Options</h3>';
    
    if (organicTreatments.length > 0) {
      treatmentHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #66BB6A;">Organic Treatments</h4><ul>';
      organicTreatments.forEach(treatment => {
        treatmentHtml += `<li>${treatment}</li>`;
      });
      treatmentHtml += '</ul></div>';
    }
    
    if (chemicalTreatments.length > 0) {
      treatmentHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #42A5F5;">Chemical Treatments</h4><ul>';
      chemicalTreatments.forEach(treatment => {
        treatmentHtml += `<li>${treatment}</li>`;
      });
      treatmentHtml += '</ul></div>';
    }
    
    if (ipmTreatments.length > 0) {
      treatmentHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #AB47BC;">Integrated Pest Management</h4><ul>';
      ipmTreatments.forEach(treatment => {
        treatmentHtml += `<li>${treatment}</li>`;
      });
      treatmentHtml += '</ul></div>';
    }
    
    if (culturalBiologicalTreatments.length > 0) {
      treatmentHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #26A69A;">Cultural & Biological Controls</h4><ul>';
      culturalBiologicalTreatments.forEach(treatment => {
        treatmentHtml += `<li>${treatment}</li>`;
      });
      treatmentHtml += '</ul></div>';
    }
    
    treatmentHtml += '</div>';
    return treatmentHtml;
  };
  
  // Add progression information if available
  const createProgressionSection = (): string => {
    if (!analysis.progressionTracking || analysis.progressionTracking.changeSinceLastAnalysis === 'unknown') {
      return "";
    }
    
    const progression = analysis.progressionTracking;
    
    // Determine color based on progression status
    const progressionColor = 
      progression.changeSinceLastAnalysis === 'improved' ? '#66BB6A' :
      progression.changeSinceLastAnalysis === 'worsened' ? '#FF5252' : '#FFA726';
    
    let progressionHtml = `
      <div style="margin-top: 20px; border: 1px solid #ddd; border-radius: 10px; padding: 15px; background-color: #f9f9f9;">
        <h3>Disease Progression</h3>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="font-weight: bold; margin-right: 10px;">Status:</span>
          <span style="color: ${progressionColor}; font-weight: bold; text-transform: capitalize;">${progression.changeSinceLastAnalysis}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span style="font-weight: bold; margin-right: 10px;">Progression Rate:</span>
          <span style="text-transform: capitalize;">${progression.progressionRate || 'Unknown'}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span style="font-weight: bold; margin-right: 10px;">Recommended Timeframe for Action:</span>
          <span>${progression.estimatedTimeToAction || 'Unknown'}</span>
        </div>
        <div style="margin-top: 10px; font-style: italic;">
          ${progression.progressNotes || ''}
        </div>
      </div>
    `;
    
    return progressionHtml;
  };
  
  // Assemble the full HTML report
  const reportHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">${diseaseName}</h2>
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div>
            <strong>Confidence:</strong> ${confidencePercent}%
          </div>
          <div>
            <strong>Stage:</strong> ${stage}
          </div>
          <div>
            <strong>Analysis Date:</strong> ${new Date(analysis.timestamp).toLocaleDateString()}
          </div>
        </div>
        
        <div>
          <h3 style="margin-bottom: 5px;">Overall Severity: ${severityScore}/10</h3>
          ${createSeverityGauge(severityScore)}
        </div>
        
        <div style="margin-top: 15px;">
          <p>${analysis.symptomsAnalysis || analysis.description || ''}</p>
        </div>
      </div>
      
      ${createDamageTypeCharts()}
      ${createProgressionSection()}
      ${createActionPlanSection()}
      ${createTreatmentSection()}
      
      <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
        <h3>Additional Notes</h3>
        <p>${analysis.additionalNotes || 'No additional notes provided.'}</p>
        
        ${analysis.resistantVarietiesNote ? `<div style="margin-top: 15px;"><strong>Resistant Varieties:</strong> ${analysis.resistantVarietiesNote}</div>` : ''}
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
        Generated by AgriAdvisor AI | Model: ${analysis.model_version || 'Unknown'} | Report ID: ${analysis.id}
      </div>
    </div>
  `;
  
  return reportHtml;
};

// Function to compare two analyses and generate treatment effectiveness insights
export const compareAnalyses = (
  currentAnalysis: AnalysisData,
  previousAnalysis: AnalysisData
): { 
  effectivenessReport: string; 
  improvementSuggestions: string[];
  treatmentEffectiveness: { 
    treatment: string; 
    effectiveness: 'effective' | 'partially_effective' | 'ineffective';
    explanation: string;
  }[];
} => {
  // Default response structure
  const result = {
    effectivenessReport: '',
    improvementSuggestions: [] as string[],
    treatmentEffectiveness: [] as { 
      treatment: string; 
      effectiveness: 'effective' | 'partially_effective' | 'ineffective';
      explanation: string;
    }[]
  };
  
  // Check if both analyses exist
  if (!currentAnalysis || !previousAnalysis) {
    result.effectivenessReport = "Cannot generate comparison: Missing analysis data.";
    return result;
  }
  
  // Calculate time between analyses
  const currentDate = new Date(currentAnalysis.timestamp);
  const previousDate = new Date(previousAnalysis.timestamp);
  const daysBetween = Math.round((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get severity scores
  const currentSeverity = currentAnalysis.severityScore?.overall || 
                         (currentAnalysis.diseaseStageEstimation === "Advanced" ? 8 : 
                          currentAnalysis.diseaseStageEstimation === "Moderate" ? 5 : 3);
  
  const previousSeverity = previousAnalysis.severityScore?.overall || 
                          (previousAnalysis.diseaseStageEstimation === "Advanced" ? 8 : 
                           previousAnalysis.diseaseStageEstimation === "Moderate" ? 5 : 3);
  
  // Calculate severity change
  const severityChange = currentSeverity - previousSeverity;
  const severityChangeDescription = 
    severityChange <= -3 ? "significantly improved" :
    severityChange < 0 ? "slightly improved" :
    severityChange === 0 ? "remained stable" :
    severityChange <= 2 ? "slightly worsened" : "significantly worsened";
  
  // Generate overall effectiveness report
  result.effectivenessReport = `Analysis comparison over ${daysBetween} days: The plant's condition has ${severityChangeDescription}.`;
  
  // Extract treatments that were recommended in the previous analysis
  const previousTreatments: string[] = [
    ...(previousAnalysis.treatmentOptions?.organic || []),
    ...(previousAnalysis.treatmentOptions?.chemical || []),
    ...(previousAnalysis.treatmentOptions?.ipm || []),
    ...(previousAnalysis.treatmentOptions?.culturalBiological || [])
  ];
  
  // Analyze each previous treatment for effectiveness
  previousTreatments.forEach(treatment => {
    // Extract the base treatment name (before any colon or parentheses)
    const treatmentBase = treatment.split(':')[0].split('(')[0].trim();
    
    // Skip if we can't identify the treatment clearly
    if (!treatmentBase || treatmentBase.length < 3) return;
    
    // Check if any significant change occurred
    let effectiveness: 'effective' | 'partially_effective' | 'ineffective';
    let explanation: string;
    
    if (severityChange <= -2) {
      effectiveness = 'effective';
      explanation = `This treatment appears to be effective, as the overall condition has improved significantly.`;
    } else if (severityChange < 0) {
      effectiveness = 'partially_effective';
      explanation = `This treatment appears to be somewhat effective, as the condition has improved slightly.`;
    } else if (severityChange === 0) {
      effectiveness = 'partially_effective';
      explanation = `This treatment may be preventing further spread, but isn't resolving the issue.`;
    } else {
      effectiveness = 'ineffective';
      explanation = `This treatment doesn't appear to be effective, as the condition has worsened.`;
    }
    
    result.treatmentEffectiveness.push({
      treatment: treatmentBase,
      effectiveness,
      explanation
    });
  });
  
  // Generate improvement suggestions
  if (severityChange >= 0) {
    // If condition worsened or stayed the same, suggest alternative treatments
    if (currentAnalysis.farmingPracticePreference === "Organic") {
      result.improvementSuggestions.push(
        "Consider increasing the frequency of organic treatments.",
        "Combine multiple organic treatments for a synergistic effect."
      );
      
      // If organic isn't working well, suggest considering IPM
      if (severityChange > 2) {
        result.improvementSuggestions.push(
          "The current organic-only approach may not be sufficient. Consider integrating some IPM (Integrated Pest Management) strategies while maintaining organic principles."
        );
      }
    } else if (severityChange > 3) {
      // For severe worsening, suggest more aggressive treatments
      result.improvementSuggestions.push(
        "The current treatment plan isn't effective. Consider switching to more aggressive treatments recommended in the current analysis.",
        "Consult with a local agricultural extension agent for specialized advice for your specific situation."
      );
    }
    
    // Additional general suggestions for worsening conditions
    result.improvementSuggestions.push(
      "Implement isolation measures to prevent spread to healthy plants.",
      "Review application methods to ensure proper coverage and adherence to recommended dosages."
    );
  } else {
    // If condition improved, suggest continuing current treatments
    result.improvementSuggestions.push(
      "Continue with the current treatment plan as it appears to be effective.",
      "Consider gradually reducing treatment frequency to prevent chemical buildup or resistance development."
    );
  }
  
  // Add specialized improvement suggestions based on the specific disease/pest
  if (currentAnalysis.diseaseOrPestName) {
    const diseaseLower = currentAnalysis.diseaseOrPestName.toLowerCase();
    
    // Disease-specific recommendations
    if (diseaseLower.includes("blight") || diseaseLower.includes("mildew") || diseaseLower.includes("rot")) {
      result.improvementSuggestions.push(
        "For fungal diseases like this, focus on improving air circulation around plants and reducing humidity.",
        "Water at the base of plants to keep foliage dry."
      );
    } else if (diseaseLower.includes("virus") || diseaseLower.includes("viral")) {
      result.improvementSuggestions.push(
        "For viral diseases, focus on controlling insect vectors that spread the virus.",
        "Remove and destroy (do not compost) severely affected plants to prevent virus reservoir."
      );
    } else if (diseaseLower.includes("aphid") || diseaseLower.includes("mite") || diseaseLower.includes("whitefly") || diseaseLower.includes("insect")) {
      result.improvementSuggestions.push(
        "For insect pests, consider introducing beneficial predators appropriate for your region.",
        "Use sticky traps to monitor population levels and effectiveness of treatments."
      );
    }
  }
  
  // Return the completed comparison
  return result;
};
