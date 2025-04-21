export interface DetectionResult {
  disease_name: string;
  common_name?: string;
  confidence: number;
  disease_stage: string;
  symptoms: string[];
  action_plan: string[];
  treatments: {
    organic: string[];
    chemical: string[];
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  tips: string[];
  weather_tip?: string;
  regional_tip?: string;
  crop_stage_advice?: string;
  bounding_boxes?: {x: number, y: number, width: number, height: number}[];
  
  // New fields from enhanced prompt
  yield_impact?: string;
  spread_risk?: string;
  recovery_chance?: string;
  next_steps?: string[];
  prevention_tips?: string[];
  environment_conditions?: {
    temperature_range?: string;
    humidity_level?: string;
    ideal_planting_conditions?: string;
  };
  disease_spread_timeframe?: string;
  image_comparison?: {
    previous_image_status?: string;
    comparison_notes?: string;
  };
  interactive_resources?: {
    video_tutorial?: string;
    qr_code_for_resource?: string;
  };
  associated_pests?: string[];
  pest_control?: string[];
  seasonal_alerts?: string[];
  progress_tracking?: {
    initial_diagnosis_date?: string;
    last_update_date?: string;
    recovery_status?: string;
  };
  cost_estimate?: {
    fungicide_cost?: string;
    labor_cost?: string;
    total_estimate?: string;
  };
  relevant_youtube_videos_hindi?: Array<{
    title: string;
    url: string;
  }>;
}
