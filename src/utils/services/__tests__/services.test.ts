import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeWithGemini } from '../gemini/geminiService';
import { AnalysisData } from '../../types/analysis';

// Mock the Gemini API
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockImplementation(() => ({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => `
            Disease: Test Disease
            Confidence: 0.85
            Severity: medium
            Recommendations:
            - Test recommendation 1
            - Test recommendation 2
            Treatment:
            - Test treatment 1
            - Test treatment 2
            Prevention:
            - Test prevention 1
            - Test prevention 2
            Additional Notes: Test notes
          `
        }
      })
    }))
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT'
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
    BLOCK: 'BLOCK'
  }
}));

describe('Plant Disease Detection Services', () => {
  // Sample base64 image data (minimal valid base64 string)
  const sampleImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

  describe('Gemini Service', () => {
    it('should analyze plant diseases using Gemini', async () => {
      const result = await analyzeWithGemini(sampleImageData);
      
      expect(result).toHaveProperty('disease_name');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('treatment_steps');
      expect(result).toHaveProperty('preventive_measures');
      expect(result).toHaveProperty('additional_notes');
      expect(result).toHaveProperty('bounding_boxes');
      expect(result).toHaveProperty('timestamp');
      
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.treatment_steps)).toBe(true);
      expect(Array.isArray(result.preventive_measures)).toBe(true);
      expect(Array.isArray(result.bounding_boxes)).toBe(true);
      
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high']).toContain(result.severity);
    });
  });
}); 