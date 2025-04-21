export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnalysisData {
  disease_name: string;
  confidence: number;
  recommendations: string[];
  severity: "low" | "medium" | "high";
  treatment_steps: string[];
  preventive_measures: string[];
  additional_notes: string;
  bounding_boxes: BoundingBox[];
  timestamp: string;
} 