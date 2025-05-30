import { SoilAnalysisResult } from './soilAnalysis';

interface SoilMapData {
  soil_type: string;
  ph_level: string;
  confidence: number;
  estimated_organic_matter: string;
  nutrientProxy: {
    name: string;
    level: 'Low' | 'Medium' | 'High';
    confidence: number;
    recommendation: string;
  }[];
}

// Mock soil map data - In production, this would be fetched from a GIS database
const mockSoilMapData: Record<string, SoilMapData> = {
  '28.5,77.2': { // Delhi region
    soil_type: 'Alluvial Soil',
    ph_level: '6.2-6.8',
    confidence: 85,
    estimated_organic_matter: 'Medium',
    nutrientProxy: [
      {
        name: 'Nitrogen (N)',
        level: 'Low',
        confidence: 80,
        recommendation: 'Apply 45 kg/ha Urea before sowing'
      },
      {
        name: 'Phosphorus (P)',
        level: 'Medium',
        confidence: 75,
        recommendation: 'Apply 30 kg/ha Single Super Phosphate'
      },
      {
        name: 'Potassium (K)',
        level: 'High',
        confidence: 70,
        recommendation: 'No additional Potassium needed this season'
      }
    ]
  },
  '19.1,72.8': { // Mumbai region
    soil_type: 'Laterite Soil',
    ph_level: '5.5-6.0',
    confidence: 80,
    estimated_organic_matter: 'Low',
    nutrientProxy: [
      {
        name: 'Nitrogen (N)',
        level: 'Low',
        confidence: 85,
        recommendation: 'Apply 50 kg/ha Urea and organic manure'
      },
      {
        name: 'Phosphorus (P)',
        level: 'Low',
        confidence: 80,
        recommendation: 'Apply 40 kg/ha Single Super Phosphate'
      },
      {
        name: 'Potassium (K)',
        level: 'Medium',
        confidence: 75,
        recommendation: 'Apply 20 kg/ha Muriate of Potash'
      }
    ]
  }
};

export const fetchSoilMapData = async (lat: number, lng: number): Promise<SoilMapData | null> => {
  // Round coordinates to 1 decimal place for mock data lookup
  const key = `${lat.toFixed(1)},${lng.toFixed(1)}`;
  
  // In production, this would make an API call to a GIS service
  return mockSoilMapData[key] || null;
};

export const createHybridResult = (
  imageAnalysis: SoilAnalysisResult,
  mapData: SoilMapData | null
): SoilAnalysisResult => {
  if (!mapData) return imageAnalysis;

  // Helper function to determine which source to use based on confidence
  const getBestSource = (imageValue: any, imageConfidence: number, mapValue: any, mapConfidence: number) => {
    return imageConfidence >= mapConfidence ? imageValue : mapValue;
  };

  // Create hybrid nutrients array
  const hybridNutrients = imageAnalysis.nutrients.map(imageNutrient => {
    const mapNutrient = mapData.nutrientProxy.find(n => n.name === imageNutrient.name);
    
    if (!mapNutrient) return imageNutrient;

    return {
      name: imageNutrient.name,
      level: getBestSource(
        imageNutrient.level,
        imageNutrient.confidence,
        mapNutrient.level,
        mapNutrient.confidence
      ),
      confidence: Math.max(imageNutrient.confidence, mapNutrient.confidence),
      recommendation: getBestSource(
        imageNutrient.recommendation,
        imageNutrient.confidence,
        mapNutrient.recommendation,
        mapNutrient.confidence
      )
    };
  });

  return {
    ...imageAnalysis,
    soil_type: getBestSource(
      imageAnalysis.soil_type,
      imageAnalysis.confidence,
      mapData.soil_type,
      mapData.confidence
    ),
    ph_level: getBestSource(
      imageAnalysis.ph_level,
      imageAnalysis.confidence,
      mapData.ph_level,
      mapData.confidence
    ),
    estimated_organic_matter: getBestSource(
      imageAnalysis.estimated_organic_matter,
      imageAnalysis.confidence,
      mapData.estimated_organic_matter,
      mapData.confidence
    ),
    nutrients: hybridNutrients,
    confidence: Math.max(imageAnalysis.confidence, mapData.confidence)
  };
}; 