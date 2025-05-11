export interface CropData {
  idealTemperature: { min: number; max: number };
  idealRainfall: { min: number; max: number };
  yieldRange: { min: number; max: number }; // per hectare
  pricePerTon: number; // INR, could be updated periodically
}

export interface SoilData {
  productivityWeight: number;
}

export interface DiseaseData {
  lossPercent: { min: number; max: number };
}

// Mock data store - in a real app, this would come from a database
const cropDatabase: Record<string, CropData> = {
  "Rice": {
    idealTemperature: { min: 21, max: 37 },
    idealRainfall: { min: 1000, max: 2000 },
    yieldRange: { min: 3, max: 7 },
    pricePerTon: 20000
  },
  "Wheat": {
    idealTemperature: { min: 15, max: 24 },
    idealRainfall: { min: 500, max: 900 },
    yieldRange: { min: 2.5, max: 5 },
    pricePerTon: 22000
  },
  "Maize": {
    idealTemperature: { min: 18, max: 33 },
    idealRainfall: { min: 600, max: 1200 },
    yieldRange: { min: 4, max: 8 },
    pricePerTon: 18000
  },
  "Cotton": { 
    idealTemperature: { min: 20, max: 35 },
    idealRainfall: { min: 700, max: 1300 },
    yieldRange: { min: 1.5, max: 3 },
    pricePerTon: 60000
  },
  "Sugarcane": {
    idealTemperature: { min: 20, max: 35 },
    idealRainfall: { min: 1200, max: 2500 },
    yieldRange: { min: 60, max: 100 },
    pricePerTon: 3500
  },
  "Groundnut": {
    idealTemperature: { min: 25, max: 35 },
    idealRainfall: { min: 500, max: 1000 },
    yieldRange: { min: 1.5, max: 2.5 },
    pricePerTon: 50000
  },
  "Bajra": {
    idealTemperature: { min: 25, max: 35 },
    idealRainfall: { min: 400, max: 800 },
    yieldRange: { min: 1.5, max: 3 },
    pricePerTon: 23000
  },
  "Jowar": {
    idealTemperature: { min: 25, max: 35 },
    idealRainfall: { min: 400, max: 900 },
    yieldRange: { min: 1.5, max: 3.5 },
    pricePerTon: 25000
  },
  "Jute": {
    idealTemperature: { min: 24, max: 38 },
    idealRainfall: { min: 1200, max: 2500 },
    yieldRange: { min: 2, max: 3.5 },
    pricePerTon: 40000
  },
  "Sesame": {
    idealTemperature: { min: 25, max: 35 },
    idealRainfall: { min: 500, max: 900 },
    yieldRange: { min: 0.5, max: 1.2 },
    pricePerTon: 80000
  }
};

const soilDatabase: Record<string, SoilData> = {
  "Alluvial Soil": { productivityWeight: 1.0 },
  "Black Cotton Soil": { productivityWeight: 0.9 },
  "Red Soil": { productivityWeight: 0.75 },
  "Laterite Soil": { productivityWeight: 0.6 },
  "Desert Soil": { productivityWeight: 0.4 }
};

const diseaseDatabase: Record<string, Record<string, DiseaseData>> = {
  "Rice": {
    "Blast": { lossPercent: { min: 20, max: 50 } },
    "Leaf Blight": { lossPercent: { min: 10, max: 30 } },
    "Rust": { lossPercent: { min: 5, max: 25 } }
  },
  "Wheat": {
    "Rust": { lossPercent: { min: 10, max: 40 } },
    "Powdery Mildew": { lossPercent: { min: 5, max: 20 } },
    "Leaf Blight": { lossPercent: { min: 15, max: 35 } }
  },
  "Maize": {
    "Rust": { lossPercent: { min: 5, max: 20 } },
    "Leaf Blight": { lossPercent: { min: 10, max: 30 } }
  },
  "Cotton": {
    "Leaf Blight": { lossPercent: { min: 10, max: 25 } },
    "Powdery Mildew": { lossPercent: { min: 5, max: 15 } }
  },
  "Sugarcane": {
    "Rust": { lossPercent: { min: 5, max: 20 } },
    "Powdery Mildew": { lossPercent: { min: 5, max: 15 } }
  },
  "Groundnut": {
    "Leaf Spot": { lossPercent: { min: 15, max: 40 } },
    "Rust": { lossPercent: { min: 10, max: 35 } },
    "Collar Rot": { lossPercent: { min: 20, max: 45 } }
  },
  "Bajra": {
    "Downy Mildew": { lossPercent: { min: 20, max: 50 } },
    "Ergot": { lossPercent: { min: 15, max: 35 } },
    "Rust": { lossPercent: { min: 10, max: 25 } }
  },
  "Jowar": {
    "Grain Mold": { lossPercent: { min: 15, max: 40 } },
    "Anthracnose": { lossPercent: { min: 10, max: 30 } },
    "Leaf Blight": { lossPercent: { min: 5, max: 25 } }
  },
  "Jute": {
    "Stem Rot": { lossPercent: { min: 20, max: 50 } },
    "Anthracnose": { lossPercent: { min: 10, max: 30 } },
    "Leaf Mosaic": { lossPercent: { min: 15, max: 35 } }
  },
  "Sesame": {
    "Phyllody": { lossPercent: { min: 25, max: 60 } },
    "Leaf Spot": { lossPercent: { min: 10, max: 30 } },
    "Root Rot": { lossPercent: { min: 15, max: 45 } }
  }
};

// Default data for crops or diseases not in database
const defaultCropData: CropData = {
  idealTemperature: { min: 20, max: 35 },
  idealRainfall: { min: 800, max: 1200 },
  yieldRange: { min: 2, max: 5 },
  pricePerTon: 25000
};

const defaultSoilData: SoilData = {
  productivityWeight: 0.7
};

const defaultDiseaseData: DiseaseData = {
  lossPercent: { min: 10, max: 30 }
};

export const getCropData = async (crop: string): Promise<CropData> => {
  // Simulate async database call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(cropDatabase[crop] || defaultCropData);
    }, 100);
  });
};

export const getSoilData = async (soilType: string): Promise<SoilData> => {
  // Simulate async database call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(soilDatabase[soilType] || defaultSoilData);
    }, 100);
  });
};

export const getDiseaseImpact = async (disease: string, crop: string): Promise<DiseaseData> => {
  // Simulate async database call
  return new Promise((resolve) => {
    setTimeout(() => {
      const cropDiseases = diseaseDatabase[crop] || {};
      resolve(cropDiseases[disease] || defaultDiseaseData);
    }, 100);
  });
};

export const getDiseasesForCrop = async (crop: string): Promise<string[]> => {
  // Simulate async database call
  return new Promise((resolve) => {
    setTimeout(() => {
      const cropDiseases = diseaseDatabase[crop];
      if (cropDiseases) {
        resolve(Object.keys(cropDiseases));
      } else {
        resolve([]);
      }
    }, 100);
  });
}; 