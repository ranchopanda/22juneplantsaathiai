import { useState } from "react";
import { DetectionResult } from "@/types/DetectionResult";
import { AnalysisData, FarmerContext } from "@/utils/types/analysisTypes";
import { imageToBase64 } from "@/utils/geminiAI";
import { analyzePlantDisease, analyzeWithAdvancedModel } from "@/utils/services/analysis/plantDiseaseAnalysis";
import { storeAnalysisData } from "@/utils/storage/analysisStorage";
import { saveFarmSnapshot, createStructuredData } from "@/utils/farmDataSnapshots";
import { useToast } from "@/hooks/use-toast";

export const useDiseasePrediction = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [previousAnalysisData, setPreviousAnalysisData] = useState<AnalysisData | null>(null);
  const [isAdvancedAnalysis, setIsAdvancedAnalysis] = useState<boolean>(false);
  const [farmerContext, setFarmerContext] = useState<FarmerContext>({});
  const { toast } = useToast();

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file); // Store the file for later upload
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

  // Update farmer context information
  const updateFarmerContext = (newContext: Partial<FarmerContext>) => {
    setFarmerContext(prevContext => ({
      ...prevContext,
      ...newContext
    }));
  };

  // Maps AnalysisData to DetectionResult format
  const mapToDetectionResult = (analysisData: AnalysisData): DetectionResult => {
    // Use enhanced fields if available, fall back to legacy fields
    const diseaseName = analysisData.diseaseOrPestName || analysisData.disease_name || "Unknown";
    const confidenceScore = analysisData.confidence_score !== undefined 
      ? analysisData.confidence_score * 100 // Convert 0-1 to percentage
      : analysisData.confidence || 0;
    
    const symptoms = [analysisData.symptomsAnalysis || analysisData.description || "Unknown symptoms"];
    
    // Gather action plan from prioritized actions if available
    let actionPlan: string[] = [];
    if (analysisData.prioritizedActionPlan) {
      if (analysisData.prioritizedActionPlan.immediateActions?.length) {
        actionPlan = actionPlan.concat(
          ["IMMEDIATE ACTIONS (next 24-72 hours):"],
          analysisData.prioritizedActionPlan.immediateActions
        );
      }
      if (analysisData.prioritizedActionPlan.shortTermManagement?.length) {
        actionPlan = actionPlan.concat(
          ["SHORT-TERM MANAGEMENT (next 1-3 weeks):"],
          analysisData.prioritizedActionPlan.shortTermManagement
        );
      }
      if (analysisData.prioritizedActionPlan.longTermPrevention?.length) {
        actionPlan = actionPlan.concat(
          ["LONG-TERM PREVENTION:"],
          analysisData.prioritizedActionPlan.longTermPrevention
        );
      }
    }
    
    // If no enhanced action plan, use legacy recommendations
    if (actionPlan.length === 0 && analysisData.recommendations) {
      actionPlan = analysisData.recommendations;
    }

    // Treatment options
    const organicTreatments = analysisData.treatmentOptions?.organic || [];
    const chemicalTreatments = analysisData.treatmentOptions?.chemical || [];
    const ipmTreatments = analysisData.treatmentOptions?.ipm || [];
    const culturalTreatments = analysisData.treatmentOptions?.culturalBiological || [];
    
    // If no enhanced treatment options, distribute legacy treatments
    if (organicTreatments.length === 0 && chemicalTreatments.length === 0 && analysisData.treatment) {
      // Divide existing treatments between organic and chemical (simplified approach)
      const midpoint = Math.ceil(analysisData.treatment.length / 2);
      const legacyOrganicTreatments = analysisData.treatment.slice(0, midpoint);
      const legacyChemicalTreatments = analysisData.treatment.slice(midpoint);
      
      // Only use these if the enhanced fields don't have values
      if (organicTreatments.length === 0) organicTreatments.push(...legacyOrganicTreatments);
      if (chemicalTreatments.length === 0) chemicalTreatments.push(...legacyChemicalTreatments);
    }

    // Gather additional information and tips
    const tips = analysisData.preventiveMeasures || [];
    if (analysisData.resistantVarietiesNote) {
      tips.push(`RESISTANT VARIETIES: ${analysisData.resistantVarietiesNote}`);
    }

    // Get impact data
    const yieldImpact = analysisData.impactAssessment?.yieldImpact || analysisData.yield_impact || "Unknown";
    const spreadRisk = analysisData.impactAssessment?.spreadRisk || analysisData.spread_risk || "Medium";
    const recoveryChance = analysisData.impactAssessment?.recoveryChance || analysisData.recovery_chance || "Medium";

    // Create Disease Stage information
    const diseaseStage = analysisData.diseaseStageEstimation || "Unknown"; 

    // Extract YouTube video recommendations from the raw response if available
    let recommendedVideos: string[] = [];
    if (analysisData.rawResponse) {
      try {
        const parsedResponse = JSON.parse(analysisData.rawResponse);
        if (parsedResponse.analysisType === "diseased_plant" && parsedResponse.recommendedVideos) {
          recommendedVideos = parsedResponse.recommendedVideos;
        } else if (parsedResponse.analysisType === "weed" && parsedResponse.recommendedVideos) {
          recommendedVideos = parsedResponse.recommendedVideos;
        }
      } catch (error) {
        console.warn("Failed to parse raw response for video recommendations:", error);
      }
    }

    // Create FAQ questions from the analysis
    const faqs = [
      {
        question: "What is this disease/pest?",
        answer: analysisData.symptomsAnalysis || analysisData.description || `Identified as ${diseaseName}`
      },
      {
        question: "How severe is the infection/infestation?",
        answer: `Disease stage: ${diseaseStage}. Yield Impact: ${yieldImpact}. Spread risk: ${spreadRisk}. Recovery chance: ${recoveryChance}.`
      }
    ];

    // Add a specific FAQ about resistant varieties if we have that information
    if (analysisData.resistantVarietiesNote) {
      faqs.push({
        question: "Are there resistant varieties I should consider?",
        answer: analysisData.resistantVarietiesNote
      });
    }

    // Add additional notes if available
    if (analysisData.additional_notes) {
      faqs.push({
        question: "Is there anything else I should know?",
        answer: analysisData.additional_notes
      });
    }

    return {
      disease_name: diseaseName,
      confidence: confidenceScore,
      disease_stage: diseaseStage,
      symptoms: symptoms,
      action_plan: actionPlan,
      treatments: {
        organic: organicTreatments,
        chemical: chemicalTreatments,
        ipm: ipmTreatments || [],
        cultural: culturalTreatments || []
      },
      recommended_videos: recommendedVideos,
      faqs: faqs,
      tips: tips,
      yield_impact: yieldImpact,
      spread_risk: spreadRisk,
      recovery_chance: recoveryChance,
      bounding_boxes: analysisData.bounding_boxes || [],
      model_version: analysisData.model_version || "unknown"
    };
  };

  const handleAnalysis = async (contextData: Partial<FarmerContext> = {}) => {
    if (!base64Image) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    // Update farmer context with any new data provided
    if (Object.keys(contextData).length > 0) {
      updateFarmerContext(contextData);
    }

    setLoading(true);
    setPreviousAnalysisData(null);
    setIsAdvancedAnalysis(false);
    
    try {
      // Use the current farmerContext state combined with any new context data
      const currentContext: FarmerContext = { ...farmerContext, ...contextData };
      
      const analysisData: AnalysisData = await analyzePlantDisease(base64Image, currentContext);
      setPreviousAnalysisData(analysisData);
      
      const mappedResult = mapToDetectionResult(analysisData);
      setDetectionResult(mappedResult);

      try {
        const analysisId = await storeAnalysisData(analysisData, "plant_disease");

        // Create structured data for the snapshot
        const structuredData = createStructuredData(analysisData, "plant_disease");
        
        // Add crop information from context if available
        if (currentContext.crop) {
          structuredData.crop = currentContext.crop;
        }

        // Use try-catch to prevent error in saveFarmSnapshot from breaking the main flow
        try {
          await saveFarmSnapshot({
            user_id: "anonymous", // In a real app, use authenticated user ID
            type: "plant_disease",
            timestamp: new Date().toISOString(),
            data: {
              ...analysisData,
              analysisId,
              farmerContext: currentContext,
              structuredData // Add the structured data
            }
          }, imageFile || undefined); // Pass the image file for upload
        } catch (snapshotError) {
          console.warn("Failed to save farm snapshot, but analysis is complete:", snapshotError);
          // Continue with successful analysis even if snapshot saving fails
        }
      } catch (storageError) {
        console.warn("Failed to store analysis data, but proceeding with UI display:", storageError);
        // The analysis was successful, so we still want to display the results
      }

      toast({
        title: "Analysis Complete",
        description: `Disease detected: ${mappedResult.disease_name}`,
      });
    } catch (error) {
      console.error("Disease detection error:", error);
      
      // Check if we have a previous analysis to fall back to
      if (previousAnalysisData) {
        toast({
          title: "Analysis Partially Complete",
          description: "Using previous analysis results. There was an issue with the latest analysis.",
          variant: "destructive",
        });
        // Use previous results to display something
        const mappedResult = mapToDetectionResult(previousAnalysisData);
        setDetectionResult(mappedResult);
      } else {
        toast({
          title: "Analysis Failed",
          description: "There was an error analyzing the image. Please try again or use a different image.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle feedback when user is unsatisfied with the result
  const handleRequestBetterAnalysis = async (contextData: Partial<FarmerContext> = {}) => {
    if (!previousAnalysisData || !base64Image) {
      toast({
        title: "Cannot Enhance Analysis",
        description: "No previous analysis data available to improve upon.",
        variant: "destructive",
      });
      return;
    }

    // Update farmer context
    if (Object.keys(contextData).length > 0) {
      updateFarmerContext(contextData);
    }

    setLoading(true);
    setIsAdvancedAnalysis(true);
    
    try {
      // Combine existing context with any new data
      const currentContext: FarmerContext = { ...farmerContext, ...contextData };
      
      // Get enhanced analysis using the advanced model
      const enhancedAnalysisData: AnalysisData = await analyzeWithAdvancedModel(
        base64Image,
        previousAnalysisData,
        currentContext
      );
      
      setPreviousAnalysisData(enhancedAnalysisData);
      
      const mappedResult = mapToDetectionResult(enhancedAnalysisData);
      setDetectionResult(mappedResult);

      try {
        const analysisId = await storeAnalysisData(
          enhancedAnalysisData,
          "plant_disease_enhanced"
        );

        // Create structured data with type 'plant_disease_enhanced'
        const structuredData = createStructuredData(enhancedAnalysisData, "plant_disease_enhanced");
        
        // Add crop information from context if available
        if (currentContext.crop) {
          structuredData.crop = currentContext.crop;
        }

        try {
          await saveFarmSnapshot({
            user_id: "anonymous", // In a real app, use authenticated user ID
            type: "plant_disease_enhanced",
            timestamp: new Date().toISOString(),
            data: {
              ...enhancedAnalysisData,
              analysisId,
              farmerContext: currentContext,
              structuredData // Add the structured data
            }
          }, imageFile || undefined); // Pass the image file for upload
        } catch (snapshotError) {
          console.warn(
            "Failed to save enhanced farm snapshot, but analysis is complete:",
            snapshotError
          );
        }
      } catch (storageError) {
        console.warn("Failed to store enhanced analysis data, but proceeding with UI display:", storageError);
      }

      toast({
        title: "Enhanced Analysis Complete",
        description: `Detailed analysis of ${mappedResult.disease_name} with additional insights.`,
      });
    } catch (error) {
      console.error("Enhanced disease analysis error:", error);
      toast({
        title: "Enhanced Analysis Failed",
        description: "Could not perform detailed analysis. Using previous results.",
        variant: "destructive",
      });
      // Keep showing the previous analysis results
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedImage,
    detectionResult,
    loading,
    isAdvancedAnalysis,
    farmerContext,
    handleImageChange,
    updateFarmerContext,
    handleAnalysis,
    handleRequestBetterAnalysis,
  };
};
