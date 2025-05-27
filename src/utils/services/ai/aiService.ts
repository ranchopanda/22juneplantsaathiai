import { AnalysisData, FarmerContext, QuickAnalysisData, PotentialIssue, SeverityScore, ProgressionTracking } from "../../types/analysisTypes";
import { API_KEYS, SAFETY_SETTINGS as CONFIG_SAFETY_SETTINGS } from "../config/geminiConfig";

// Get a valid API key from the API_KEYS array
const getApiKey = (): string => {
  const validKey = API_KEYS.find(key => key && key.length > 0);
  if (!validKey) {
    throw new Error("No valid AgriAI API key found in configuration.");
  }
  return validKey;
};

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
        if (process.env.NODE_ENV === "development") {
          console.log("Trying fallback model for final attempt...");
        }
        currentEndpoint = API_ENDPOINTS.fallback;
      }

      // Get API key for this request
      const apiKey = getApiKey();
      const requestUrl = `${currentEndpoint}?key=${apiKey}`;
      
      if (process.env.NODE_ENV === "development") {
        console.log(`API request attempt ${attempt + 1}/${maxRetries} to AI analysis engine`);
      }
      
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (process.env.NODE_ENV === "development") {
          console.error(`Attempt ${attempt + 1} failed with status ${response.status}:`,
            typeof errorData === 'object' ? JSON.stringify(errorData, null, 2) : errorData);
        }
        
        // Check for rate limit or overload conditions
        const isOverloaded = 
          response.status === 503 || 
          response.status === 429 || 
          errorData.error?.message?.includes("overloaded") ||
          errorData.error?.message?.includes("quota");
        
        if (isOverloaded && attempt < maxRetries - 1) {
          // Calculate backoff delay with exponential increase
          const backoffDelay = initialDelay * Math.pow(2, attempt);
          if (process.env.NODE_ENV === "development") {
            console.log(`Service overloaded. Retrying in ${backoffDelay/1000} seconds...`);
          }
          await sleep(backoffDelay);
          continue;
        }
        
        // Get more specific error message from AgriAI response
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
        if (process.env.NODE_ENV === "development") {
          console.log(`Error: ${error.message}. Retrying in ${backoffDelay/1000} seconds...`);
        }
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
  try {
    // Ensure valid API key exists by calling getApiKey() - will throw if none found
    getApiKey();

    let promptText = `SYSTEM: You are AgriAdvisor AI. Provide a QUICK and PRELIMINARY assessment based ONLY on the provided image and minimal context (location, crop type).

Your response MUST follow these formats based on what you see in the image:

1. If the image is a HEALTHY PLANT:
   Respond: "This plant appears healthy. No visible disease or weed presence."
   Then share 2-3 basic tips to keep the crop healthy (watering, weeding, spacing, etc.)

2. If the image shows a DISEASED PLANT:
   Format your response as:
   Crop Name:
   Disease Name:
   Pathogen (if known):
   Severity Level: (Low / Moderate / High)
   Confidence Level: (%)
   
   🔍 Symptoms (English):
   - Describe symptoms seen in the image
   
   🛠️ Action Plan:
   - 3-5 farmer-friendly treatment steps
   
   🌱 Organic Treatment:
   - Name and how to apply
   
   ⚠️ Chemical Treatment:
   - Name, dosage, when to spray, and precautions
   
   🎥 YouTube Videos in Hindi:
   - Suggest 2 Hindi videos that explain this disease or treatment

3. If the image shows a WEED:
   Format your response as:
   Weed Name (if known):
   Why it is harmful:
   - Nutrient competition / pest host / yield loss, etc.
   
   How to control it:
   - Manual method
   - Organic method (like vinegar, mulch, cow dung slurry)
   - Chemical method (name, dosage, timing)
   
   🎥 YouTube Videos in Hindi:
   - Suggest 1-2 videos in Hindi showing farmers how to remove or control this weed.

IMPORTANT: 
- Use simple English with short sentences
- Tailor advice for Indian farmers
- If weed or disease name is unknown, describe what it looks like and suggest a common solution
- For this quick analysis, just provide the text in the format above, not as JSON

FARMER PROVIDED IMAGE AND MINIMAL CONTEXT:
Image: [Attached Below]
`;

  if (quickContext.location) promptText += `Location: ${quickContext.location}\n`;
  if (quickContext.plantVariety) promptText += `Crop Type: ${quickContext.plantVariety}\n`;

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
      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected API response structure for quick analysis:",
          typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData);
      }
      throw new Error("Failed to extract text from AI analysis engine response for quick analysis.");
    }

    let rawText = responseData.candidates[0].content.parts[0].text;
    
    // Create a structured response based on the text
    const isHealthy = rawText.includes("This plant appears healthy") || rawText.toLowerCase().includes("no visible disease");
    const isWeed = rawText.toLowerCase().includes("weed name") || (rawText.toLowerCase().includes("weed") && !rawText.toLowerCase().includes("disease"));
    
    let potentialIssues: PotentialIssue[] = [];
    let initialConfidence = "Low" as "Low" | "Medium" | "High" | "Very Low";
    let generalAdvice: string[] = [];
    let nextStepPrompt = "";
    
    if (isHealthy) {
      potentialIssues = [{ name: "Healthy Plant", reasoning: "No visible disease or pest issues detected in image." }];
      initialConfidence = "High" as "Low" | "Medium" | "High" | "Very Low";
      
      // Extract care tips
      const tipMatches = rawText.match(/- [^\n]+/g);
      if (tipMatches) {
        generalAdvice = tipMatches.map(tip => tip.replace(/^- /, ''));
      } else {
        generalAdvice = ["Regular watering", "Keep area weed-free", "Monitor regularly for any changes"];
      }
      nextStepPrompt = "Your plant looks healthy! Continue with regular care.";
    } 
    else if (isWeed) {
      // Extract weed name
      const weedNameMatch = rawText.match(/Weed Name[^:]*:\s*([^\n]+)/);
      const weedName = weedNameMatch ? weedNameMatch[1].trim() : "Unknown Weed";
      
      potentialIssues = [{ name: `Weed: ${weedName}`, reasoning: "Weed detected in image." }];
      initialConfidence = "Medium" as "Low" | "Medium" | "High" | "Very Low";
      
      // Extract control methods
      const controlMatches = rawText.match(/- [^\n]+/g);
      if (controlMatches) {
        generalAdvice = controlMatches.slice(0, 3).map(method => method.replace(/^- /, ''));
      } else {
        generalAdvice = ["Remove manually", "Apply organic mulch", "Consider appropriate herbicide if severe"];
      }
      nextStepPrompt = "Consider removing this weed promptly to prevent competition with your crops.";
    }
    else {
      // It's a disease - extract disease name
      const diseaseNameMatch = rawText.match(/Disease Name:\s*([^\n]+)/);
      const diseaseName = diseaseNameMatch ? diseaseNameMatch[1].trim() : "Unknown Disease";
      
      // Extract confidence level
      const confidenceMatch = rawText.match(/Confidence Level:\s*(\d+)/);
      const confidence = confidenceMatch ? confidenceMatch[1] : "60";
      
      // Extract severity
      const severityMatch = rawText.match(/Severity Level:\s*([^\n]+)/);
      const severity = severityMatch ? severityMatch[1].trim() : "Moderate";
      
      // Determine initialConfidence based on confidence and severity
      if (parseInt(confidence) > 80 || severity.toLowerCase().includes("high")) {
        initialConfidence = "High" as "Low" | "Medium" | "High" | "Very Low";
      } else if (parseInt(confidence) > 60 || severity.toLowerCase().includes("moderate")) {
        initialConfidence = "Medium" as "Low" | "Medium" | "High" | "Very Low";
      } else {
        initialConfidence = "Low" as "Low" | "Medium" | "High" | "Very Low";
      }
      
      // Extract symptoms
      const symptomsSection = rawText.split("🔍 Symptoms")[1]?.split("🛠️")[0];
      const symptomsMatches = symptomsSection?.match(/- [^\n]+/g);
      const symptomsReasoning = symptomsMatches ? 
        symptomsMatches.map(s => s.replace(/^- /, '')).join("; ") : 
        "Visual symptoms detected in image";
      
      potentialIssues = [{ name: diseaseName, reasoning: symptomsReasoning }];
      
      // Extract action plan
      const actionSection = rawText.split("🛠️ Action Plan")[1]?.split("🌱")[0];
      const actionMatches = actionSection?.match(/- [^\n]+/g);
      if (actionMatches) {
        generalAdvice = actionMatches.map(action => action.replace(/^- /, ''));
      } else {
        generalAdvice = ["Isolate affected plants", "Remove infected plant parts", "Apply appropriate treatment"];
      }
      
      nextStepPrompt = "This disease requires prompt attention. Follow the recommended treatment plan.";
    }

    // Construct QuickAnalysisData
    const quickAnalysisResult: QuickAnalysisData = {
      id: `gemini-quick-${new Date().getTime()}`,
      timestamp: new Date().toISOString(),
      potentialIssues: potentialIssues,
      initialConfidence: initialConfidence,
      generalAdvice: generalAdvice,
      nextStepPrompt: nextStepPrompt,
      model_version: responseData.modelId || API_ENDPOINTS.primary.split('/').pop()?.split(':')[0], // Extract model name
      crop_type_provided: quickContext.plantVariety,
      location_provided: quickContext.location,
      rawTextResponse: rawText // Include full raw text for frontend display
    };

    return quickAnalysisResult;

  } catch (error) {
    console.error(`Failed to get quick analysis:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to get quick analysis with AI analysis engine API: ${error.message}`);
    }
    throw new Error("Failed to get quick analysis with AI analysis engine API due to an unknown error.");
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
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        console.error('Error tracking disease progression:', error.message);
      } else {
        console.error('Error tracking disease progression:', JSON.stringify(error, null, 2));
      }
    }
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
  try {
    // Ensure valid API key exists by calling getApiKey() - will throw if none found
    getApiKey();

    // Construct the detailed prompt with added content for severity scoring
    let promptText = `SYSTEM: You are AgriAdvisor AI, an expert agronomist and plant pathologist specializing in Indian agriculture. Analyze the provided plant image and all contextual information from the farmer.

Your response MUST follow these formats based on what you see in the image:

1. If the image is a HEALTHY PLANT:
   Respond in JSON format:
   {
     "analysisType": "healthy_plant",
     "message": "This plant appears healthy. No visible disease or weed presence.",
     "healthTips": [
       "Tip 1 to keep the crop healthy",
       "Tip 2...",
       "Tip 3..."
     ]
   }

2. If the image shows a DISEASED PLANT:
   Respond in JSON format:
   {
     "analysisType": "diseased_plant",
     "cropName": "Name of crop",
     "diseaseName": "Name of disease",
     "pathogen": "Pathogen name if known or 'Unknown'",
     "severityLevel": "Low / Moderate / High",
     "confidenceLevel": percentage as number (e.g., 85),
     "symptoms": [
       "Symptom 1 seen in the image",
       "Symptom 2...",
       "Symptom 3..."
     ],
     "actionPlan": [
       "Step 1 - farmer-friendly treatment",
       "Step 2...",
       "Step 3...",
       "Step 4...",
       "Step 5..."
     ],
     "organicTreatment": {
       "name": "Name of organic treatment",
       "application": "How to apply"
     },
     "chemicalTreatment": {
       "name": "Name of chemical treatment",
       "dosage": "Recommended dosage",
       "timing": "When to spray",
       "precautions": "Safety precautions"
     },
     "recommendedVideos": [
       "Title of Hindi YouTube video about this disease or treatment",
       "Title of another Hindi YouTube video"
     ],
     "diseaseStageEstimation": "Early / Moderate / Advanced",
     "yieldImpact": "Potential yield loss percentage or description",
     "spreadRisk": "Low / Medium / High"
   }

3. If the image shows a WEED:
   Respond in JSON format:
   {
     "analysisType": "weed",
     "weedName": "Name of weed if known or description if unknown",
     "harmfulEffects": [
       "Effect 1 (e.g., Nutrient competition)",
       "Effect 2...",
       "Effect 3..."
     ],
     "controlMethods": {
       "manual": "Description of manual removal method",
       "organic": "Name and application of organic method",
       "chemical": "Name, dosage and timing of chemical method"
     },
     "recommendedVideos": [
       "Title of Hindi YouTube video about controlling this weed",
       "Title of another Hindi YouTube video"
     ]
   }

IMPORTANT: 
- Use simple English with short sentences
- Tailor advice for Indian farmers
- If weed or disease name is unknown, describe what it looks like and suggest a common solution
- Ensure JSON format is valid

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
        if (process.env.NODE_ENV === "development") {
          console.error("Unexpected API response structure:",
            typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData);
        }
        throw new Error("Failed to extract text from AI analysis engine response.");
    }
      
    let rawText = responseData.candidates[0].content.parts[0].text;

    // AI might wrap JSON in ```json ... ```, so strip it.
    rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    // Parse the JSON response directly
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (jsonError) {
      if (process.env.NODE_ENV === "development") {
        if (jsonError instanceof Error) {
          console.error("Failed to parse JSON response:", jsonError.message);
        } else {
          console.error("Failed to parse JSON response:", JSON.stringify(jsonError, null, 2));
        }
      }
      
      // Attempt to extract a JSON object if it exists within the text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0]);
        } catch (secondJsonError) {
          if (process.env.NODE_ENV === "development") {
            if (secondJsonError instanceof Error) {
              console.error("Failed to parse extracted JSON:", secondJsonError.message);
            } else {
              console.error("Failed to parse extracted JSON:", JSON.stringify(secondJsonError, null, 2));
            }
          }
          throw new Error("Failed to parse AI analysis engine response as JSON.");
        }
      } else {
        throw new Error("Failed to parse AI analysis engine response as JSON.");
      }
    }

    // Construct the full AnalysisData object based on analysis type
    const analysisResult: AnalysisData = {
      id: `gemini-detailed-${new Date().getTime()}`,
      type: "plant_disease_or_pest",
      timestamp: new Date().toISOString(),
      rawResponse: rawText,  // Store the raw response for debugging
      
      // Default values
      disease_name: "Unknown",
      confidence: 0,
      description: "",
      severity: "Unknown",
      crop_type: farmerContext.plantVariety || "Unknown Plant",
      yield_impact: "Unknown",
      spread_risk: "Unknown",
      recovery_chance: "Unknown",
      recommendations: [],
      treatment_steps: [],
      preventive_measures: [],
      additional_notes: "",
      model_version: responseData.modelId || "gemini-2.0-flash",
      diseaseOrPestName: "Unknown",
      confidence_score: 0,
      symptomsAnalysis: "",
      diseaseStageEstimation: "Unknown",
      impactAssessment: {
        yieldImpact: "Unknown",
        spreadRisk: "Medium" as "Low" | "Medium" | "High",
        recoveryChance: "Medium" as "Low" | "Medium" | "High"
      },
      prioritizedActionPlan: {
        immediateActions: [],
        shortTermManagement: [],
        longTermPrevention: []
      },
      treatmentOptions: {
        organic: [],
        chemical: [],
        ipm: [],
        culturalBiological: []
      },
      resistantVarietiesNote: "",
      imageUrl: imageData?.substring(0, 20) ? `[Image data truncated]` : null,
    };
    
    // Process based on analysis type
    if (parsedResult.analysisType === "healthy_plant") {
      // Healthy plant
      analysisResult.disease_name = "Healthy Plant";
      analysisResult.diseaseOrPestName = "Healthy Plant";
      analysisResult.confidence = 90;
      analysisResult.confidence_score = 0.9;
      analysisResult.description = parsedResult.message;
      analysisResult.symptomsAnalysis = parsedResult.message;
      analysisResult.severity = "None";
      analysisResult.diseaseStageEstimation = "Unknown";
      analysisResult.recommendations = parsedResult.healthTips || [];
      analysisResult.preventive_measures = parsedResult.healthTips || [];
      analysisResult.prioritizedActionPlan.longTermPrevention = parsedResult.healthTips || [];
      analysisResult.additional_notes = "Plant appears healthy. Continue regular maintenance.";
      
      // Calculate basic severity score for healthy plant
      analysisResult.severityScore = {
        overall: 1,
        leafDamage: 0,
        stemDamage: 0,
        fruitDamage: 0,
        rootDamage: 0,
        spreadRate: 0,
        economicImpact: 0,
        treatmentDifficulty: 0
      };
    } 
    else if (parsedResult.analysisType === "diseased_plant") {
      // Diseased plant
      analysisResult.disease_name = parsedResult.diseaseName;
      analysisResult.diseaseOrPestName = parsedResult.diseaseName;
      analysisResult.confidence = parsedResult.confidenceLevel || 75;
      analysisResult.confidence_score = (parsedResult.confidenceLevel || 75) / 100;
      analysisResult.description = parsedResult.symptoms?.join(". ") || "";
      analysisResult.symptomsAnalysis = parsedResult.symptoms?.join(". ") || "";
      analysisResult.severity = parsedResult.severityLevel || "Moderate";
      analysisResult.diseaseStageEstimation = parsedResult.diseaseStageEstimation || parsedResult.severityLevel || "Moderate";
      analysisResult.yield_impact = parsedResult.yieldImpact || "Unknown";
      analysisResult.spread_risk = parsedResult.spreadRisk || "Medium";
      
      // Set recommendations and treatment steps
      analysisResult.recommendations = parsedResult.actionPlan || [];
      analysisResult.treatment_steps = [];
      
      // Add organic treatment
      if (parsedResult.organicTreatment?.name) {
        const organicDescription = `${parsedResult.organicTreatment.name}: ${parsedResult.organicTreatment.application}`;
        analysisResult.treatment_steps.push(organicDescription);
        analysisResult.treatmentOptions.organic.push(organicDescription);
      }
      
      // Add chemical treatment
      if (parsedResult.chemicalTreatment?.name) {
        const chemicalDescription = `${parsedResult.chemicalTreatment.name}: ${parsedResult.chemicalTreatment.dosage}. Apply: ${parsedResult.chemicalTreatment.timing}. ${parsedResult.chemicalTreatment.precautions}`;
        analysisResult.treatment_steps.push(chemicalDescription);
        analysisResult.treatmentOptions.chemical.push(chemicalDescription);
      }
      
      // Action plan distribution
      if (parsedResult.actionPlan && parsedResult.actionPlan.length > 0) {
        // Split action plan between immediate and short term
        const midpoint = Math.ceil(parsedResult.actionPlan.length / 2);
        analysisResult.prioritizedActionPlan.immediateActions = parsedResult.actionPlan.slice(0, midpoint);
        analysisResult.prioritizedActionPlan.shortTermManagement = parsedResult.actionPlan.slice(midpoint);
      }
      
      // Add YouTube video recommendations to notes
      if (parsedResult.recommendedVideos && parsedResult.recommendedVideos.length > 0) {
        analysisResult.additional_notes = `Recommended Hindi YouTube videos: ${parsedResult.recommendedVideos.join(", ")}`;
      }
      
      // Build impact assessment
      analysisResult.impactAssessment = {
        yieldImpact: parsedResult.yieldImpact || "Unknown",
        spreadRisk: parsedResult.spreadRisk || "Medium",
        recoveryChance: parsedResult.severityLevel === "High" ? "Low" : 
                        parsedResult.severityLevel === "Moderate" ? "Medium" : "High"
      };
      
      // Calculate severity score
      analysisResult.severityScore = calculateSeverityScore(parsedResult);
    }
    else if (parsedResult.analysisType === "weed") {
      // Weed analysis
      analysisResult.disease_name = `Weed: ${parsedResult.weedName}`;
      analysisResult.diseaseOrPestName = `Weed: ${parsedResult.weedName}`;
      analysisResult.confidence = 85;
      analysisResult.confidence_score = 0.85;
      analysisResult.description = parsedResult.harmfulEffects?.join(". ") || "";
      analysisResult.symptomsAnalysis = `This is a weed: ${parsedResult.weedName}. ${parsedResult.harmfulEffects?.join(". ")}`;
      analysisResult.severity = "Moderate";
      analysisResult.diseaseStageEstimation = "Unknown";
      
      // Set recommendations
      const controlMethods = [];
      if (parsedResult.controlMethods?.manual) {
        controlMethods.push(`Manual control: ${parsedResult.controlMethods.manual}`);
      }
      if (parsedResult.controlMethods?.organic) {
        controlMethods.push(`Organic control: ${parsedResult.controlMethods.organic}`);
      }
      if (parsedResult.controlMethods?.chemical) {
        controlMethods.push(`Chemical control: ${parsedResult.controlMethods.chemical}`);
      }
      
      analysisResult.recommendations = controlMethods;
      analysisResult.treatment_steps = controlMethods;
      
      // Organize into treatment options
      if (parsedResult.controlMethods?.organic) {
        analysisResult.treatmentOptions.organic.push(parsedResult.controlMethods.organic);
      }
      if (parsedResult.controlMethods?.chemical) {
        analysisResult.treatmentOptions.chemical.push(parsedResult.controlMethods.chemical);
      }
      if (parsedResult.controlMethods?.manual) {
        analysisResult.treatmentOptions.culturalBiological.push(parsedResult.controlMethods.manual);
      }
      
      // Action plan distribution
      analysisResult.prioritizedActionPlan = {
        immediateActions: [`Remove the weed: ${parsedResult.controlMethods?.manual || "Manual removal is recommended"}`],
        shortTermManagement: parsedResult.controlMethods?.organic ? 
          [`Apply organic control: ${parsedResult.controlMethods.organic}`] : [],
        longTermPrevention: ["Maintain clean field borders", "Use crop rotation", "Use clean equipment"]
      };
      
      // Add YouTube video recommendations to notes
      if (parsedResult.recommendedVideos && parsedResult.recommendedVideos.length > 0) {
        analysisResult.additional_notes = `Recommended Hindi YouTube videos: ${parsedResult.recommendedVideos.join(", ")}`;
      }
      
      // Calculate severity score for weed
      analysisResult.severityScore = {
        overall: 5,  // Medium priority for weeds
        leafDamage: 0,
        stemDamage: 0,
        fruitDamage: 0,
        rootDamage: 0,
        spreadRate: 6,  // Weeds tend to spread
        economicImpact: 5,  // Medium economic impact
        treatmentDifficulty: 4  // Usually manageable
      };
    }
    else {
      // Fallback for unknown analysis type
      console.warn("Unknown analysis type in response:", parsedResult.analysisType);
      
      // Try to extract some useful information
      if (parsedResult.diseaseName || parsedResult.diseaseOrPestName) {
        analysisResult.disease_name = parsedResult.diseaseName || parsedResult.diseaseOrPestName;
        analysisResult.diseaseOrPestName = parsedResult.diseaseName || parsedResult.diseaseOrPestName;
      }
      
      if (parsedResult.symptoms || parsedResult.symptomsAnalysis) {
        analysisResult.description = parsedResult.symptoms || parsedResult.symptomsAnalysis;
        analysisResult.symptomsAnalysis = parsedResult.symptoms || parsedResult.symptomsAnalysis;
      }
      
      if (parsedResult.actionPlan || parsedResult.recommendations) {
        analysisResult.recommendations = parsedResult.actionPlan || parsedResult.recommendations || [];
      }
      
      // Calculate basic severity score
      analysisResult.severityScore = calculateSeverityScore(parsedResult);
    }
    
    // Track disease progression if previous analysis ID is provided
    if (farmerContext.previousAnalysisId) {
      analysisResult.progressionTracking = await trackDiseaseProgression(
        parsedResult,
        farmerContext.previousAnalysisId
      );
    }
    
    return analysisResult;

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        console.error(`Failed to analyze image:`, error.message);
      } else {
        console.error(`Failed to analyze image:`, JSON.stringify(error, null, 2));
      }
    }
    // Be more specific about the error passed upwards
    if (error instanceof Error) {
        throw new Error(`Failed to analyze image with AI analysis engine API: ${error.message}`);
    }
    throw new Error("Failed to analyze image with AI analysis engine API due to an unknown error.");
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

// --- Named exports for compatibility with the rest of the app ---
export { analyzeWithGemini as analyzePlantDisease };
export { getQuickAnalysisFromGemini as getQuickPlantAnalysis };
// Add more exports here as you implement more AI features (e.g., analyzeSoil, predictYield, etc.)
