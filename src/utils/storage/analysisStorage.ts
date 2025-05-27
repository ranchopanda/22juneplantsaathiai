import { AnalysisData } from '../types/analysisTypes';

export const storeAnalysisData = (data: any, type: string) => {
  try {
    // Create a unique ID for the analysis
    const id = `${type}_${Date.now()}`;
    
    // Get existing history or initialize an empty array
    const historyJSON = localStorage.getItem('analysis_history') || '[]';
    const history = JSON.parse(historyJSON) as AnalysisData[];
    
    // Add the new analysis with metadata
    const analysisData: AnalysisData = {
      id,
      timestamp: new Date().toISOString(),
      type,
      ...data
    };
    
    // Add to history (at the beginning)
    history.unshift(analysisData);
    
    // Limit history to 20 items to prevent localStorage from getting too large
    const limitedHistory = history.slice(0, 20);
    
    // Save back to localStorage
    localStorage.setItem('analysis_history', JSON.stringify(limitedHistory));
    
    console.log(`Stored ${type} data with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Error storing analysis data:", error);
    return null;
  }
};

export const getAnalysisHistory = (type?: string) => {
  try {
    const historyJSON = localStorage.getItem('analysis_history') || '[]';
    const history = JSON.parse(historyJSON) as AnalysisData[];
    
    if (type) {
      return history.filter(item => item.type === type);
    }
    
    return history;
  } catch (error) {
    console.error("Error retrieving analysis history:", error);
    return [];
  }
};
