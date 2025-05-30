import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { SoilAnalysisResult } from '../analysis/soilAnalysis';

export interface SoilAnalysisReport {
  id?: string;
  userId: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    context?: string;
  };
  imageUrl?: string;
  analysis: SoilAnalysisResult;
  format: 'pdf' | 'csv' | 'text';
  language: 'en' | 'hi';
}

const COLLECTION_NAME = 'soil_analysis_reports';

export const saveSoilAnalysisReport = async (report: Omit<SoilAnalysisReport, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...report,
      timestamp: Timestamp.fromDate(report.timestamp)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving soil analysis report:', error);
    throw new Error('Failed to save soil analysis report');
  }
};

export const getUserSoilAnalysisReports = async (
  userId: string,
  limit: number = 10
): Promise<SoilAnalysisReport[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as SoilAnalysisReport[];
  } catch (error) {
    console.error('Error fetching soil analysis reports:', error);
    throw new Error('Failed to fetch soil analysis reports');
  }
};

export const getRecentSoilAnalysisReports = async (
  limit: number = 5
): Promise<SoilAnalysisReport[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as SoilAnalysisReport[];
  } catch (error) {
    console.error('Error fetching recent soil analysis reports:', error);
    throw new Error('Failed to fetch recent soil analysis reports');
  }
}; 