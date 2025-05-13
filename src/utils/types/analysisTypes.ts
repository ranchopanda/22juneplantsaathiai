export interface FarmerContext {
  location?: string; // e.g., "Fresno, California, USA" or "Zone 9b"
  farmingPracticePreference?: "Organic" | "Conventional" | "IPM" | "Unspecified";
  symptomsObserved?: string; // "New leaves curling, yellowing. Saw whiteflies."
  percentageAffected?: string; // "<10%", "10-30%", "30-60%", ">60%"
  symptomsFirstNoticed?: string; // "<1 week ago", "1-2 weeks ago", ">2 weeks ago"
  plantVariety?: string; // "Roma VF", "Unknown"
  plantGrowthStage?: string; // "Seedling", "Flowering", "Fruiting"
  recentTreatmentsOrChanges?: string; // "Applied neem oil last week, increased watering 3 days ago"
  previousAnalysisId?: string; // Reference to previous analysis for tracking progression
  // Add any other relevant questions your chatbot will ask
}

export interface PotentialIssue {
  name: string; // e.g., 'Possible Early Blight' or 'Aphid Presence Suspected'
  reasoning: string; // Brief, e.g., 'Image shows circular lesions with concentric rings typical of early blight.'
}

export interface QuickAnalysisData {
  id: string; // Unique ID for the analysis
  timestamp: string; // ISO string
  potentialIssues: PotentialIssue[];
  initialConfidence: 'Very Low' | 'Low' | 'Medium' | 'High'; // Overall confidence for the initial assessment
  generalAdvice: string[]; // 1-3 very general, safe, actionable tips
  nextStepPrompt: string; // Message encouraging detailed analysis
  model_version?: string; // Model used for this quick analysis
  // Optionally include basic context used for this quick analysis
  crop_type_provided?: string;
  location_provided?: string;
  rawTextResponse?: string; // Added field to store the raw AI response
}

// New interface for detailed severity scoring
export interface SeverityScore {
  overall: number; // 1-10 scale where 10 is most severe
  leafDamage?: number; // 1-10 scale
  stemDamage?: number; // 1-10 scale
  fruitDamage?: number; // 1-10 scale
  rootDamage?: number; // 1-10 scale
  spreadRate?: number; // 1-10 scale, how quickly it's spreading
  treatmentDifficulty?: number; // 1-10 scale, how difficult to treat
  economicImpact?: number; // 1-10 scale, potential economic impact
}

// New interface for disease progression tracking
export interface ProgressionTracking {
  previousAnalysisId?: string; // Reference to previous analysis
  changeSinceLastAnalysis?: 'improved' | 'worsened' | 'unchanged' | 'unknown';
  progressionRate?: 'slow' | 'moderate' | 'rapid' | 'unknown';
  estimatedTimeToAction?: string; // e.g., "Immediate", "Within 24 hours", "Within 1 week"
  progressNotes?: string; // Notes on how the condition has evolved
}

export interface AnalysisData {
  id: string;
  type: string; // "plant_disease_or_pest" or legacy values
  timestamp: string;
  
  // Legacy fields (for backward compatibility)
  disease_name?: string;
  confidence?: number;
  description?: string;
  recommendations?: string[];
  treatment?: string[];
  severity?: string;
  crop_type?: string;
  yield_impact?: string;
  spread_risk?: string;
  recovery_chance?: string;
  treatment_steps?: string[];
  preventive_measures?: string[];
  additional_notes?: string;
  bounding_boxes?: {x: number, y: number, width: number, height: number}[];
  model_version?: string;
  
  // Enhanced data model
  diseaseOrPestName?: string;
  confidence_score?: number; // 0.0 to 1.0
  symptomsAnalysis?: string;
  diseaseStageEstimation?: "Early" | "Moderate" | "Advanced" | "Unknown";
  impactAssessment?: {
    yieldImpact: string; // e.g., "Low (5-10%)", "High (50-100%)"
    spreadRisk: "Low" | "Medium" | "High";
    recoveryChance: "Low" | "Medium" | "High"; // For the farm/unaffected plants
  };
  prioritizedActionPlan?: {
    immediateActions: string[]; // For next 24-72 hours
    shortTermManagement: string[]; // For next 1-3 weeks
    longTermPrevention: string[]; // For future seasons
  };
  treatmentOptions?: {
    organic: string[];
    chemical: string[];
    ipm: string[]; // Integrated Pest Management
    culturalBiological: string[];
  };
  preventiveMeasures?: string[]; // Can be part of longTermPrevention or separate
  resistantVarietiesNote?: string;
  imageUrl?: string; // If you want to store the image URL that was analyzed
  
  // Raw JSON response from the API for additional processing
  rawResponse?: string;
  
  // New fields for severity scoring and progression tracking
  severityScore?: SeverityScore;
  progressionTracking?: ProgressionTracking;
  
  // Extra fields for future extensions
  [key: string]: any;
}
