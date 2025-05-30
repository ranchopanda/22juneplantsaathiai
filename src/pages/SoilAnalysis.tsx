import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, Upload, Camera, Sprout, X, MapPin, ThermometerSun, Info,
  ArrowLeft, ArrowRight, AlertTriangle, Leaf, Globe, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraCapture from "@/components/CameraCapture";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { isMobileDevice } from "@/utils/cameraUtils";
import { getAnalysisHistory } from "@/utils/geminiAI";
import { analyzeSoil } from "@/utils/services/analysis/soilAnalysis";
import { saveFarmSnapshot, getFarmSnapshots, FarmDataSnapshot, FarmDataSnapshotRow } from "@/utils/farmDataSnapshots";
import { fetchSoilMapData, createHybridResult } from "@/utils/services/analysis/soilMapData";
import { generateReport, type ReportFormat } from "@/utils/services/analysis/reportGenerator";
import { 
  saveSoilAnalysisReport, 
  getUserSoilAnalysisReports,
  type SoilAnalysisReport 
} from "@/utils/services/firestore/soilAnalysisReports";
import { useAuth } from "@/hooks/use-auth";
import { analytics } from "@/utils/firebase";
import { logEvent } from "firebase/analytics";
import { useDropzone } from "react-dropzone";
import { imageToBase64 } from "@/utils/geminiAI";
import { SoilAnalysisResult } from "@/utils/services/analysis/soilAnalysis"; // Corrected import for SoilAnalysisResult
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Translations object (partial example)
const translations = {
  en: {
    analyzeSoil: "Analyze Soil",
    uploadImage: "Upload Image",
    imagePreview: "Image Preview",
    soilAnalysisResult: "Soil Analysis Result",
    soilType: "Soil Type",
    confidence: "Confidence",
    phLevel: "pH Level",
    organicMatter: "Estimated Organic Matter",
    nutrients: "Nutrient Levels",
    recommendations: "Recommendations",
    downloadReport: "Download Report",
    reportFormat: "Report Format",
    language: "Language",
    includeImage: "Include Image in Report",
    savingReport: "Saving Report...",
    reportSavedSuccess: "Report saved successfully!",
    reportSaveError: "Failed to save report.",
    analysisError: "Analysis error",
    uploadImageFirst: "Please upload an image first",
    enterLocation: "Enter Location (Optional)",
    locationPlaceholder: "e.g. Delhi, India or 28.644800, 77.216760",
    latitude: "Latitude (Optional)",
    longitude: "Longitude (Optional)",
    analyzing: "Analyzing...",
    downloading: "Downloading...",
    hybridResultInfo: "(Hybrid result from image and map data)",
    imageAnalysisInfo: "(From image analysis)",
    mapDataInfo: "(From soil map data)"
  },
  hi: {
    analyzeSoil: "मिट्टी का विश्लेषण करें",
    uploadImage: "छवि अपलोड करें",
    imagePreview: "छवि पूर्वावलोकन",
    soilAnalysisResult: "मिट्टी विश्लेषण परिणाम",
    soilType: "मिट्टी का प्रकार",
    confidence: "आत्मविश्वास",
    phLevel: "पीएच स्तर",
    organicMatter: "अनुमानित कार्बनिक पदार्थ",
    nutrients: "पोषक तत्वों का स्तर",
    recommendations: "सिफारिशें",
    downloadReport: "रिपोर्ट डाउनलोड करें",
    reportFormat: "रिपोर्ट प्रारूप",
    language: "भाषा",
    includeImage: "रिपोर्ट में छवि शामिल करें",
    savingReport: "रिपोर्ट सहेजा जा रहा है...",
    reportSavedSuccess: "रिपोर्ट सफलतापूर्वक सहेजी गई!",
    reportSaveError: "रिपोर्ट सहेजने में विफल।",
    analysisError: "विश्लेषण त्रुटि",
    uploadImageFirst: "कृपया पहले एक छवि अपलोड करें",
    enterLocation: "स्थान दर्ज करें (वैकल्पिक)",
    locationPlaceholder: "जैसे दिल्ली, भारत या 28.644800, 77.216760",
    latitude: "अक्षांश (वैकल्पिक)",
    longitude: "देशांतर (वैकल्पिक)",
    analyzing: "विश्लेषण कर रहा है...",
    downloading: "डाउनलोड हो रहा है...",
    hybridResultInfo: "(छवि और मानचित्र डेटा से हाइब्रिड परिणाम)",
    imageAnalysisInfo: "(छवि विश्लेषण से)",
    mapDataInfo: "(मिट्टी मानचित्र डेटा से)"
  }
};

type Language = keyof typeof translations;

const SoilAnalysis = () => {
  const { user, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<string>('en');
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
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reports, setReports] = useState<SoilAnalysisReport[]>([]);
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SoilAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [reportLanguage, setReportLanguage] = useState<Language>('en');
  const [includeImageInReport, setIncludeImageInReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (user) {
      loadUserReports();
    }
  }, [user]);

  const loadUserReports = async () => {
    if (!user) return;
    try {
      const userReports = await getUserSoilAnalysisReports(user.uid);
      setReports(userReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load your soil analysis reports",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Load snapshots when component mounts
    const loadSnapshots = async () => {
      setLoadingSnapshots(true);
      try {
        // Assuming getFarmSnapshots returns FarmDataSnapshotRow[] or compatible
        const history = await getFarmSnapshots("soil_analysis");
        // You might need to map or transform history if its structure doesn't exactly match FarmDataSnapshot[]
        // For now, setting directly and we'll fix type errors as they appear
        setSnapshots(history as unknown as FarmDataSnapshot[]); // Temporary assertion
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          if (error instanceof Error) {
            console.error("Error loading snapshots:", error.message);
          } else {
            console.error("Error loading snapshots:", JSON.stringify(error, null, 2));
          }
        }
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
    console.log('handleImageUpload called');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', file.name);
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

  const handleImageDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalysisResult(null);
    setError(null);

    // Track image upload
    logEvent(analytics, 'soil_analysis_image_uploaded', {
      file_type: file.type,
      file_size: file.size
    });
  }, []);

  const handleAnalyze = async () => {
    if (!image) {
      toast({
        title: t.analysisError,
        description: t.uploadImageFirst,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert image to base64
      const base64Image = await imageToBase64(image);

      // Create a location context object for internal use and map data fetching
      const locationContext = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location: locationName,
      };

      // Track analysis start
      logEvent(analytics, 'soil_analysis_started', {
        has_location: !!locationContext.location,
        has_coordinates: !!(locationContext.latitude && locationContext.longitude)
      });

      // Get image analysis (pass locationName as string to analyzeSoil)
      const imageAnalysis = await analyzeSoil(base64Image, locationContext.location);
      console.log("Image Analysis Result:", imageAnalysis);

      // Get soil map data if coordinates are available
      let soilMapData = null;
      if (locationContext.latitude && locationContext.longitude) {
        soilMapData = await fetchSoilMapData(
          locationContext.latitude,
          locationContext.longitude
        );
        console.log("Soil Map Data:", soilMapData);
      }

      // Create hybrid result
      const result = createHybridResult(imageAnalysis, soilMapData);
      console.log("Hybrid Result:", result);

      setAnalysisResult(result);

      // Track successful analysis
      logEvent(analytics, 'soil_analysis_completed', {
        soil_type: result.soil_type,
        has_map_data: !!soilMapData,
        confidence: result.confidence
      });

    } catch (err) {
      console.error("Analysis error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(`${t.analysisError}: ${errorMessage}`);

      // Track analysis error
      logEvent(analytics, 'soil_analysis_error', {
        error_message: errorMessage
      });

      toast({
        title: t.analysisError,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!analysisResult) return;

    setIsDownloading(true);

    try {
      let imageUrl: string | undefined;
      if (includeImageInReport && imagePreview) {
        // Convert image preview URL back to Blob/File if needed for report generator
        // Or pass the base64 if the generator supports it
        // For simplicity, let's assume the generator can handle a data URL string
        imageUrl = imagePreview;
      }

      const reportBlob = await generateReport(analysisResult, {
        format: reportFormat,
        language: reportLanguage,
        includeImage: includeImageInReport,
        imageData: imageUrl,
      });

      // Create a download link
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soil_analysis_report.${reportFormat === 'text' ? 'txt' : reportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Track report download
      logEvent(analytics, 'soil_analysis_report_downloaded', {
        format: reportFormat,
        language: reportLanguage,
        include_image: includeImageInReport
      });

      // Save report to Firestore if authenticated
      if (isAuthenticated && user?.uid) {
        toast({
          title: t.savingReport,
        });
        try {
          const reportToSave: Omit<SoilAnalysisReport, 'id'> = {
            userId: user.uid,
            timestamp: new Date(),
            location: { // Fix: Save location as an object
               lat: parseFloat(latitude) || 0,
               lng: parseFloat(longitude) || 0,
               context: locationName || undefined,
            },
            imageUrl: imagePreview || null, // Save image preview URL
            analysis: analysisResult, // Save the full analysis result
            format: reportFormat,
            language: reportLanguage,
          };
          await saveSoilAnalysisReport(reportToSave);
          toast({
            title: t.reportSavedSuccess,
            variant: "default", // Fix: Use allowed variant
          });
          // Track report save
          logEvent(analytics, 'soil_analysis_report_saved');
        } catch (saveError) {
          console.error("Error saving report:", saveError);
          toast({
            title: t.reportSaveError,
            description: saveError instanceof Error ? saveError.message : "",
            variant: "destructive",
          });
          // Track report save error
          logEvent(analytics, 'soil_analysis_report_save_error', {
            error_message: saveError instanceof Error ? saveError.message : "Unknown error"
          });
        }
      }

    } catch (err) {
      console.error("Download error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({
        title: "Download Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
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
    
    if (!analysisResult) {
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
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-background dark:bg-kisan-brown-dark text-foreground min-h-screen">
        <Header 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          language={language}
          setLanguage={setLanguage}
        />
        
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
                <TabsTrigger value="analysis" className={activeTab === 'analysis' ? 'bg-kisan-green text-white' : ''}>Soil Analysis</TabsTrigger>
                <TabsTrigger value="history" className={activeTab === 'history' ? 'bg-kisan-green text-white' : ''}>Analysis History</TabsTrigger>
                <TabsTrigger value="guide" className={activeTab === 'guide' ? 'bg-kisan-green text-white' : ''}>How to Use</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {showCamera ? (
                      <div className="fixed inset-0 z-50 bg-black">
                        <CameraCapture
                          onCapture={handleCameraCapture}
                          onClose={() => setShowCamera(false)}
                          fullscreen={isMobileDevice()}
                        />
                      </div>
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
                          
                          {!imagePreview ? (
                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 md:p-10 text-center">
                                <Sprout className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                  Drag and drop a soil image here or click to browse
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-3 mobile-stack">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Label
                                          htmlFor="file-upload"
                                          className="bg-kisan-green hover:bg-kisan-green-dark text-white w-full sm:w-auto py-6 text-base camera-button flex items-center justify-center cursor-pointer rounded-md font-medium"
                                        >
                                          <Upload className="mr-2 h-5 w-5" />
                                          Browse Files
                                          <Input
                                            id="file-upload"
                                            ref={fileInputRef}
                                            type="file"
                                            className="sr-only"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                          />
                                        </Label>
                                      </TooltipTrigger>
                                      <TooltipContent>Upload a soil image</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-full sm:w-auto py-6 text-base flex items-center justify-center camera-button"
                                        onClick={() => setShowCamera(true)}
                                      >
                                        <Camera className="mr-2 h-5 w-5" />
                                        Take Photo
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Take a photo with your camera</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <img 
                                src={imagePreview} 
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
                                  onClick={handleAnalyze}
                                  disabled={isAnalyzing}
                                >
                                  {isAnalyzing ? (
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
                    {analysisResult ? (
                      <Card>
                        <CardContent className="p-6">
                          <div className="mb-6">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold">Soil Analysis Results</h3>
                              <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                                Confidence: {analysisResult.confidence}%
                              </div>
                            </div>
                            
                            <div className="mt-4 p-3 rounded-lg bg-kisan-green/10 dark:bg-kisan-green/20">
                              <h4 className="font-semibold text-kisan-green dark:text-kisan-gold">
                                {analysisResult.soil_type}
                              </h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <div className="text-sm px-2 py-1 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full flex items-center">
                                  <ThermometerSun className="h-3 w-3 mr-1" />
                                  pH: {analysisResult.ph_level}
                                </div>
                                {analysisResult.estimated_organic_matter && (
                                  <div className="text-sm px-2 py-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                                    Organic Matter: {analysisResult.estimated_organic_matter}
                                  </div>
                                )}
                                {analysisResult.location_context && (
                                  <div className="text-sm px-2 py-1 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {analysisResult.location_context}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Image quality indicator if available */}
                            {analysisResult.image_quality_score !== undefined && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Image Quality</span>
                                  <span>{analysisResult.image_quality_score}%</span>
                                </div>
                                <Progress value={analysisResult.image_quality_score} className="h-1.5" />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Nutrient Analysis
                              </h4>
                              <div className="space-y-2">
                                {analysisResult.nutrients?.map((nutrient, index) => ( // Use analysisResult.nutrients and map directly
                                  <div key={index} className="border rounded-md p-3"> {/* Use index as key if nutrient object has no unique ID */}
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium">{nutrient.name}</span> {/* Access name from nutrient object */}
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        nutrient.level === 'High'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                          : nutrient.level === 'Medium'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                      }`}>
                                        {nutrient.level} {/* Access level from nutrient object */}
                                      </span>
                                    </div>
                                    {/* Nutrient level visualization - adjust based on if level string or numeric percentage */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                                       {/* If level is a string like "High", "Medium", "Low" */}
                                       <div
                                         className={`h-1.5 rounded-full ${
                                           nutrient.level === 'High' ? 'bg-green-500 dark:bg-green-400' : nutrient.level === 'Medium' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-red-500 dark:bg-red-400'
                                        }`}
                                        style={{ width: `${nutrient.level === 'High' ? '90' : nutrient.level === 'Medium' ? '50' : '20'}%` }} // Approximate width
                                       />
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {nutrient.recommendation} {/* Access recommendation from nutrient object */}
                                    </p>

                                    {/* Show confidence for each nutrient assessment */}
                                    {nutrient.confidence !== undefined && ( // Check for confidence property on nutrient object
                                      <div className="flex justify-end mt-1">
                                        <span className="text-xs text-gray-500">
                                          Confidence: {nutrient.confidence}% {/* Access confidence from nutrient object */}
                                        </span>
                                      </div>
                                    )}
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
                                  {analysisResult.organic_solutions?.map((solution, index) => (
                                    <li key={index}>{solution}</li>
                                  ))}
                                </ul>
                              ) : (
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5 border rounded-md p-3">
                                  {analysisResult.chemical_solutions?.map((solution, index) => (
                                    <li key={index}>{solution}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            
                            {/* Suitable crops section */}
                            {analysisResult.suitable_crops && analysisResult.suitable_crops.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Suitable Crops
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {analysisResult.suitable_crops.map((crop, index) => (
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
                                {analysisResult.recommendations?.map((recommendation, index) => (
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : imagePreview ? (
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
                    ) : reports.length > 0 ? (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Previous Soil Analyses</h3>
                        
                        <div className="space-y-4">
                          {reports.map((report) => (
                            <div 
                              key={report.id}
                              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{report.analysis?.soil_type || "Unknown Soil Type"}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {report.analysis?.ph_level ? `pH: ${report.analysis.ph_level} • ` : ''}
                                    {new Date(report.timestamp).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-sm px-2 py-1 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                                  {report.analysis?.confidence ? `${(report.analysis.confidence * 100).toFixed(2)}% match` : 'N/A'}
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
                        <Button onClick={() => setActiveTab('analysis')} className="bg-kisan-green text-white mt-2">Start Your First Analysis</Button>
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

      {/* Report Format Selection */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={reportFormat === 'pdf' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportFormat('pdf')}
        >
          PDF
        </Button>
        <Button
          variant={reportFormat === 'csv' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportFormat('csv')}
        >
          CSV
        </Button>
        <Button
          variant={reportFormat === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportFormat('text')}
        >
          Text
        </Button>
      </div>

      {/* Download Button */}
      {analysisResult && (
        <Button
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download {reportFormat.toUpperCase()}
        </Button>
      )}

      {/* Show a progress bar during analysis */}
      {isAnalyzing && <Progress value={70} className="w-full my-4" />}

      {/* Add warning if image quality is low */}
      {analysisResult?.image_quality_score !== undefined && analysisResult.image_quality_score < 50 && (
        <div className="mt-2 p-2 bg-amber-100 text-amber-800 rounded text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Image quality is low. Try retaking the photo for better results.
        </div>
      )}

      {/* Add a Back to Top button at the bottom of the page */}
      <Button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-6 right-6 z-50 bg-kisan-green text-white rounded-full shadow-lg p-3 hover:bg-kisan-green-dark" aria-label="Back to Top">
        ↑
      </Button>
    </div>
  );
};

export default SoilAnalysis;
