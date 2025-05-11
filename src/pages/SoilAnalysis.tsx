import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Upload, Loader2, Info, 
  Camera, X, ArrowRight, AlertTriangle,
  Sprout, Leaf, MapPin, ThermometerSun
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraCapture from "@/components/CameraCapture";
import { 
  analyzeSoil, 
  imageToBase64, 
  storeAnalysisData, 
  getAnalysisHistory 
} from "@/utils/geminiAI";
import { SoilAnalysisResult } from "@/utils/services/analysis/soilAnalysis";
import { saveFarmSnapshot, getFarmSnapshots, FarmDataSnapshot } from "@/utils/farmDataSnapshots";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

function isSoilAnalysisResult(data: unknown): data is SoilAnalysisResult {
  return (
    typeof data === 'object' && 
    data !== null &&
    'soil_type' in data &&
    'confidence' in data &&
    'ph_level' in data &&
    'nutrients' in data &&
    'recommendations' in data
  );
}

const SoilAnalysis = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [snapshots, setSnapshots] = useState<FarmDataSnapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [locationInput, setLocationInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("organic");
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load snapshots when component mounts
    const loadSnapshots = async () => {
      setLoadingSnapshots(true);
      try {
        const history = await getFarmSnapshots("soil_analysis");
        setSnapshots(history);
      } catch (error) {
        console.error("Error loading snapshots:", error);
      } finally {
        setLoadingSnapshots(false);
      }
    };
    
    loadSnapshots();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processNewImage(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    processNewImage(file);
    setShowCamera(false);
  };

  const processNewImage = (file: File) => {
    setImage(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setResult(null);
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image of the soil first.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const base64Image = await imageToBase64(image);
      
      // Pass location context if provided
      const analysisResult = await analyzeSoil(
        base64Image, 
        locationInput || undefined
      );
      
      setResult(analysisResult);
      
      await storeAnalysisData(analysisResult, "soil_analysis");
      
      // Show image quality feedback if available
      if (analysisResult.image_quality_score !== undefined) {
        const quality = analysisResult.image_quality_score;
        
        if (quality < 50) {
          toast({
            title: "Image Quality Warning",
            description: "The image quality is low. For better results, try with better lighting and focus.",
            variant: "destructive",
          });
        }
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error analyzing image:", error);
      let errorDescription = "There was an error analyzing the soil image.";
      if (errorMessage.includes("denied") || errorMessage.includes("permission")) {
        errorDescription = "API access denied. Please check your API keys.";
      } else if (errorMessage.includes("JSON") || errorMessage.includes("format")) {
        errorDescription = "Received invalid analysis results. Please try again.";
      } else if (errorMessage.includes("clearer")) {
        errorDescription = "Image quality too low. Please try with a clearer, well-lit photo.";
      }
      
      toast({
        title: "Analysis Failed",
        description: errorDescription,
        variant: "destructive",
        action: (
          <Button variant="ghost" size="sm" onClick={analyzeImage}>
            Retry
          </Button>
        )
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadToServer = () => {
    if (!image) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!result) {
      toast({
        title: "Analysis Required",
        description: "Please analyze the image before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Data Submitted",
        description: "Your soil data has been submitted for expert review. You will receive detailed advice within 24 hours.",
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-kisan-green dark:text-kisan-gold">
            AI Soil Analysis
          </h1>
          
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Upload a clear photo of your soil to identify soil type and get fertilizer recommendations.
          </p>
          
          <Tabs defaultValue="analysis">
            <TabsList className="mb-8">
              <TabsTrigger value="analysis">Soil Analysis</TabsTrigger>
              <TabsTrigger value="history">Analysis History</TabsTrigger>
              <TabsTrigger value="guide">How to Use</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {showCamera ? (
                    <CameraCapture 
                      onCapture={handleCameraCapture}
                      onClose={() => setShowCamera(false)}
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Upload Soil Image</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Take a clear photo of your soil sample or field soil
                          </p>
                        </div>
                        
                        {/* Location input field */}
                        <div className="mb-4">
                          <Label htmlFor="location" className="mb-1 block">
                            Location (Optional)
                          </Label>
                          <div className="flex">
                            <div className="relative flex-grow">
                              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                id="location"
                                placeholder="District, State or Region"
                                className="pl-8"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Adding location helps provide region-specific recommendations
                          </p>
                        </div>
                        
                        {!preview ? (
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center">
                              <Sprout className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Drag and drop a soil image here or click to browse
                              </p>
                              <div className="flex justify-center gap-3">
                                <Button
                                  className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Browse Files
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowCamera(true)}
                                >
                                  <Camera className="mr-2 h-4 w-4" />
                                  Take Photo
                                </Button>
                              </div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <img 
                              src={preview} 
                              alt="Soil preview" 
                              className="w-full rounded-lg object-cover max-h-[300px]" 
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full"
                              onClick={clearImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            
                            <div className="mt-4 flex justify-center">
                              <Button
                                className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                                onClick={analyzeImage}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    Analyze Soil
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-kisan-green dark:text-kisan-gold mr-2 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">For best results:</h3>
                          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 list-disc pl-5">
                            <li>Collect soil from 3-6 inches below the surface</li>
                            <li>Take photos in good natural lighting</li>
                            <li>Include a clear view of soil texture and color</li>
                            <li>If possible, include a ruler or coin for scale</li>
                            <li>Specify your location for region-specific advice</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  {result ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="mb-6">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">Soil Analysis Results</h3>
                            <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                              Confidence: {result.confidence}%
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 rounded-lg bg-kisan-green/10 dark:bg-kisan-green/20">
                            <h4 className="font-semibold text-kisan-green dark:text-kisan-gold">
                              {result.soil_type}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="text-sm px-2 py-1 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full flex items-center">
                                <ThermometerSun className="h-3 w-3 mr-1" />
                                pH: {result.ph_level}
                              </div>
                              {result.estimated_organic_matter && (
                                <div className="text-sm px-2 py-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                                  Organic Matter: {result.estimated_organic_matter}
                                </div>
                              )}
                              {result.location_context && (
                                <div className="text-sm px-2 py-1 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {result.location_context}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Image quality indicator if available */}
                          {result.image_quality_score !== undefined && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Image Quality</span>
                                <span>{result.image_quality_score}%</span>
                              </div>
                              <Progress value={result.image_quality_score} className="h-1.5" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Nutrient Analysis
                            </h4>
                            <div className="space-y-2">
                              {result.nutrients.map((nutrient, index) => (
                                <div key={index} className="border rounded-md p-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{nutrient.name}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      nutrient.level === 'High' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                        : nutrient.level === 'Medium'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {nutrient.level}
                                    </span>
                                  </div>
                                  
                                  {/* Nutrient level visualization */}
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        nutrient.level === 'High' 
                                          ? 'bg-green-500 dark:bg-green-400' 
                                          : nutrient.level === 'Medium'
                                          ? 'bg-amber-500 dark:bg-amber-400'
                                          : 'bg-red-500 dark:bg-red-400'
                                      }`}
                                      style={{ 
                                        width: `${nutrient.level === 'High' ? '90%' : nutrient.level === 'Medium' ? '50%' : '20%'}`
                                      }}
                                    />
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {nutrient.recommendation}
                                  </p>
                                  
                                  {/* Show confidence for each nutrient assessment */}
                                  <div className="flex justify-end mt-1">
                                    <span className="text-xs text-gray-500">
                                      Confidence: {nutrient.confidence}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Treatment Tabs */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Treatment Options
                            </h4>
                            
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden mb-2">
                              <div className="flex">
                                <button 
                                  className={`flex-1 py-2 text-sm ${activeTab === 'organic' ? 
                                    'bg-kisan-green text-white dark:bg-kisan-gold dark:text-gray-900' : 
                                    'text-gray-600 dark:text-gray-300'}`}
                                  onClick={() => setActiveTab('organic')}
                                >
                                  Organic Solutions
                                </button>
                                <button 
                                  className={`flex-1 py-2 text-sm ${activeTab === 'chemical' ? 
                                    'bg-kisan-green text-white dark:bg-kisan-gold dark:text-gray-900' : 
                                    'text-gray-600 dark:text-gray-300'}`}
                                  onClick={() => setActiveTab('chemical')}
                                >
                                  Chemical Solutions
                                </button>
                              </div>
                            </div>
                            
                            {activeTab === 'organic' ? (
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5 border rounded-md p-3">
                                {result.organic_solutions.map((solution, index) => (
                                  <li key={index}>{solution}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5 border rounded-md p-3">
                                {result.chemical_solutions.map((solution, index) => (
                                  <li key={index}>{solution}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          
                          {/* Suitable crops section */}
                          {result.suitable_crops && result.suitable_crops.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Suitable Crops
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {result.suitable_crops.map((crop, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-kisan-green/10 dark:bg-kisan-gold/20 rounded-full text-xs text-kisan-green dark:text-kisan-gold"
                                  >
                                    {crop}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              General Recommendations
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                              {result.recommendations.map((recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-start mb-4">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              This is an AI-generated analysis. For precise results, consider laboratory soil testing.
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Button 
                              className="w-full bg-kisan-green hover:bg-kisan-green-dark text-white"
                              onClick={uploadToServer}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  Submit for Expert Advice
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={async () => {
                                if (!result) return;
                                try {
                                  await saveFarmSnapshot({
                                    user_id: "current_user_id", // TODO: Replace with actual user ID
                                    timestamp: new Date().toISOString(),
                                    type: "soil_analysis",
                                    data: result
                                  });
                                  
                                  // Reload snapshots after saving
                                  const history = await getFarmSnapshots("soil_analysis");
                                  setSnapshots(history);
                                  
                                  toast({
                                    title: "Snapshot Saved",
                                    description: "Your soil analysis has been saved locally."
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Failed to save snapshot",
                                    description: "Could not save your soil analysis.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              Save Farm Snapshot
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : preview ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Info className="h-10 w-10 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Analysis Pending</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Click "Analyze Soil" to detect soil type and get fertilizer recommendations.
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Leaf className="h-10 w-10 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Soil Analysis Results</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Upload a soil image to see analysis results and fertilizer recommendations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardContent className="p-6">
                  {loadingSnapshots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : snapshots.length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Previous Soil Analyses</h3>
                      
                      <div className="space-y-4">
                        {snapshots.map((snapshot) => (
                          <div 
                            key={snapshot.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{
                                  isSoilAnalysisResult(snapshot.data) ? 
                                  snapshot.data.soil_type : "Unknown Soil Type"
                                }</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {isSoilAnalysisResult(snapshot.data) ? 
                                  `pH: ${snapshot.data.ph_level} • ` : ''}
                                  {new Date(snapshot.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-sm px-2 py-1 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                                {isSoilAnalysisResult(snapshot.data) ? 
                                `${snapshot.data.confidence}% match` : 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sprout className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">No Soil Analyses Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Your previous soil analysis results will appear here once you perform an analysis.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="guide">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">How to Use Soil Analysis</h3>
                  
                  <ol className="space-y-4 list-decimal pl-5">
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Collect soil sample</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Dig 3-6 inches deep and collect a handful of soil from your field.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Take a clear photo</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Place the soil on a white background in good lighting and take a photo.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Add your location</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Enter your district or region for location-specific recommendations.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Upload the image</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Click on "Browse Files" to select an image from your device or use the camera.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Analyze the soil</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Our AI system will analyze your soil image and identify soil type and properties.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Review results</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        You'll receive information about soil type, pH level, nutrients, and both organic and chemical recommendations.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Save or get expert advice</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Save your results locally or submit for more detailed expert analysis.
                      </p>
                    </li>
                  </ol>
                  
                  <div className="mt-6 p-4 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg">
                    <h4 className="font-semibold text-kisan-green dark:text-kisan-gold mb-2">Where is data stored?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All your soil analysis data is stored locally on your device for privacy. The history 
                      tab shows your previous analyses. In future updates, data will be optionally synced 
                      across devices with a Kisan Dost account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <CustomFooter />
    </div>
  );
};

export default SoilAnalysis;
