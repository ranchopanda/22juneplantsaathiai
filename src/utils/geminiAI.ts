// Helper functions
export { imageToBase64 } from './helpers/imageUtils';
export { storeAnalysisData, getAnalysisHistory } from './storage/analysisStorage';

// Main service functions - export from aiService
export {
  analyzePlantDisease,
  getQuickPlantAnalysis
} from './services/ai/aiService';

// Type definitions - export from types/analysisTypes
export type { AnalysisData } from './types/analysisTypes';

// Remove duplicate type exports from aiService since these are already exported through the service
