import { useState } from "react";
import { DetectionResult } from "@/types/DetectionResult";
import { AnalysisData } from "@/utils/types/analysisTypes";
import { imageToBase64 } from "@/utils/geminiAI";
import { analyzePlantDisease } from "@/utils/services/analysis/plantDiseaseAnalysis";
import { storeAnalysisData } from "@/utils/storage/analysisStorage";
import { saveFarmSnapshot } from "@/utils/farmDataSnapshots";
import { useToast } from "@/hooks/use-toast";

export const useDiseasePrediction = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      try {
        const base64 = await imageToBase64(file);
        setBase64Image(base64);
      } catch (error) {
        console.error("Error converting image to base64:", error);
        toast({
          title: "Error",
          description: "Failed to convert image to base64.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalysis = async () => {
    if (!base64Image) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const analysisData: AnalysisData = await analyzePlantDisease(base64Image);
      
      const mappedResult: DetectionResult = {
        disease_name: analysisData.disease_name || "Unknown",
        confidence: analysisData.confidence || 0,
        disease_stage: "Unknown", // Default value as analysisData doesn't have this field
        symptoms: [analysisData.description || "Unknown symptoms"],
        action_plan: analysisData.recommendations || [],
        treatments: {
          organic: analysisData.treatment?.slice(0, 2) || [],
          chemical: analysisData.treatment?.slice(2) || []
        },
        faqs: [
          {
            question: "What is this disease?",
            answer: analysisData.description || "Unknown disease"
          }
        ],
        tips: analysisData.recommendations || [],
        yield_impact: analysisData.yield_impact,
        spread_risk: analysisData.spread_risk,
        recovery_chance: analysisData.recovery_chance,
        bounding_boxes: analysisData.bounding_boxes
      };

      setDetectionResult(mappedResult);

      const analysisId = await storeAnalysisData(analysisData, "plant_disease");

      await saveFarmSnapshot({
        user_id: "anonymous",
        type: "plant_disease",
        timestamp: new Date().toISOString(),
        data: {
          ...analysisData,
          analysisId
        }
      });

      toast({
        title: "Analysis Complete",
        description: `Disease detected: ${mappedResult.disease_name}`,
      });
    } catch (error) {
      console.error("Disease detection error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedImage,
    detectionResult,
    loading,
    handleImageChange,
    handleAnalysis
  };
};
