import { useState } from "react";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ImageUploader } from "@/components/disease-detection/ImageUploader";
import { AnalysisResults } from "@/components/disease-detection/AnalysisResults";
import { useDiseasePrediction } from "@/hooks/useDiseasePrediction";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ThumbsDown, ThumbsUp, Sparkles } from "lucide-react";

const DiseaseDetection = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const {
    selectedImage,
    detectionResult,
    loading,
    isAdvancedAnalysis,
    handleImageChange,
    handleAnalysis,
    handleRequestBetterAnalysis
  } = useDiseasePrediction();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent hover:text-kisan-green dark:hover:text-kisan-gold" 
          onClick={() => navigate(-1)}
        >
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold mb-4">
              Plant Disease Detection
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Upload an image of the affected plant to diagnose potential diseases.
            </p>
          </div>

          <Card className="mb-8 border-none shadow-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImageUploader
                    onImageChange={handleImageChange}
                    selectedImage={selectedImage}
                  />
                </div>

                <div>
                  {detectionResult ? (
                    <div className="space-y-4">
                      {isAdvancedAnalysis && (
                        <div className="flex items-center justify-center mb-4">
                          <Badge variant="outline" className="px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Enhanced Analysis with Gemini 2.5 Flash</span>
                          </Badge>
                        </div>
                      )}
                      
                      <AnalysisResults result={detectionResult} />
                      
                      {!isAdvancedAnalysis && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
                            <div className="flex items-start">
                              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                  Was this analysis helpful?
                                </h4>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  If you're not satisfied with the results, we can analyze your image using our most advanced AI model for better accuracy.
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex justify-center gap-3 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-1 bg-white dark:bg-gray-800"
                                onClick={() => {
                                  /* Satisfaction feedback could be tracked here */
                                }}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>Helpful</span>
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-1 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                onClick={handleRequestBetterAnalysis}
                                disabled={loading}
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span>Need Better Analysis</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-600">
                      <p className="text-gray-500 dark:text-gray-400">No image analyzed yet. Upload an image to detect plant diseases.</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-kisan-green hover:bg-kisan-green-dark text-white"
                onClick={handleAnalysis}
                disabled={loading || !selectedImage}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isAdvancedAnalysis ? "Analyzing with Advanced AI..." : "Analyzing Image..."}
                  </div>
                ) : (
                  "Analyze Image"
                )}
              </Button>
              
              {detectionResult && isAdvancedAnalysis && (
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>This analysis was performed using Gemini 2.5 Flash Preview for maximum accuracy.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <CustomFooter />
    </div>
  );
};

export default DiseaseDetection;
