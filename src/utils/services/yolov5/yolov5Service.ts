import { AnalysisData } from '../../types/analysis.js';

const YOLOV5_API_URL = 'https://detect.roboflow.com/plant-disease-detection/1';
const YOLOV5_API_KEY = import.meta.env.VITE_YOLOV5_API_KEY || 'your_yolov5_api_key_here';

interface YOLOv5Response {
  predictions: Array<{
    class: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

// Mock function that returns a dummy response without making API calls
export const detectWithYOLOv5 = async (imageData: string): Promise<AnalysisData> => {
  console.log('YOLOv5 service is disabled. Using Gemini service instead.');
  
  return {
    disease_name: 'Analysis in progress',
    confidence: 0,
    recommendations: ['Please wait for Gemini analysis to complete'],
    severity: 'medium',
    treatment_steps: ['Waiting for analysis'],
    preventive_measures: ['Waiting for analysis'],
    additional_notes: 'YOLOv5 service is disabled',
    bounding_boxes: [],
    timestamp: new Date().toISOString()
  };
}; 