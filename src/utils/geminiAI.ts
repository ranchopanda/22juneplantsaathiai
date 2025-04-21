// Helper functions
export { imageToBase64 } from './helpers/imageUtils';
export { storeAnalysisData, getAnalysisHistory } from './storage/analysisStorage';

// Main service functions - export from geminiAIService
export { 
  analyzePlantDisease,
  analyzeSoil,
  analyzeGitError,
  predictYield
} from './services/geminiAIService';

// Type definitions - export from types/analysisTypes
export type { AnalysisData } from './types/analysisTypes';

// Remove duplicate type exports from geminiAIService since these are already exported through the service
