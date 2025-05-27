import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, BarChart3, Droplets, Thermometer, Leaf, AlertTriangle, MapPin, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storeAnalysisData } from "@/utils/geminiAI";
import { predictYield, YieldPredictionResult } from "@/utils/services/analysis/yieldPrediction";
import { saveFarmSnapshot } from "@/utils/farmDataSnapshots";
import { getLocationAndWeatherData, WeatherData } from "@/utils/services/weatherService";
import { getDiseasesForCrop } from "@/utils/services/cropKnowledgeService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const YieldPrediction = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [crop, setCrop] = useState<string>("");
  const [area, setArea] = useState<number>(1);
  const [soilType, setSoilType] = useState<string>("");
  const [rainfall, setRainfall] = useState<number>(800);
  const [temperature, setTemperature] = useState<number>(28);
  const [disease, setDisease] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [locationData, setLocationData] = useState<WeatherData | null>(null);
  const [fetchingWeather, setFetchingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [availableDiseaseOptions, setAvailableDiseaseOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "none", label: "No Disease" }
  ]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch location and weather data on component mount
    fetchWeatherData();
  }, []);

  useEffect(() => {
    if (crop) {
      const fetchDiseases = async () => {
        try {
          const diseases = await getDiseasesForCrop(crop);
          const newOptions = [
            { value: "none", label: "No Disease" },
            ...diseases.map(d => ({ value: d, label: d }))
          ];
          setAvailableDiseaseOptions(newOptions);
          setDisease("none");
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            if (error instanceof Error) {
              console.error("Error fetching diseases for crop:", error.message);
            } else {
              console.error("Error fetching diseases for crop:", JSON.stringify(error, null, 2));
            }
          }
          setAvailableDiseaseOptions([{ value: "none", label: "No Disease" }]);
          setDisease("none");
        }
      };
      fetchDiseases();
    } else {
      setAvailableDiseaseOptions([{ value: "none", label: "No Disease" }]);
      setDisease("none");
    }
  }, [crop]);

  const fetchWeatherData = async () => {
    setFetchingWeather(true);
    setWeatherError(null);
    
    try {
      const data = await getLocationAndWeatherData();
      setLocationData(data);
      
      // Set the fetched temperature and rainfall
      setTemperature(data.temperature);
      setRainfall(data.rainfall);
      
      toast({
        title: "Location Detected",
        description: `Detected ${data.location.district}, ${data.location.state}. Weather data loaded.`,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        if (error instanceof Error) {
          console.error("Failed to fetch weather data:", error.message);
        } else {
          console.error("Failed to fetch weather data:", JSON.stringify(error, null, 2));
        }
      }
      setWeatherError("Failed to detect your location. Using default weather data.");
      toast({
        title: "Weather Data Error",
        description: "Failed to fetch local weather data. Using default values.",
        variant: "destructive",
      });
    } finally {
      setFetchingWeather(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handlePredict = async () => {
    if (!crop || !soilType) {
      toast({
        title: "Missing Information",
        description: "Please select a crop type and soil type.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await predictYield(
        crop,
        area,
        soilType,
        rainfall,
        temperature,
        disease === "none" ? null : disease
      );

      setPrediction(result);
      
      // Store prediction data with fixed structure to match AnalysisData interface
      await storeAnalysisData(
        {
          confidence: result.confidence,
          recommendations: result.recommendations,
          soil_type: soilType,
          predicted_yield: result.predictedYield,
          potential_income: result.potentialIncome,
          crop_type: crop
        },
        "yield_prediction"
      );

      // Also save the data in our Supabase database
      await saveFarmSnapshot({
        user_id: "anonymous", // In a real app, this would be the user's ID
        type: "yield_prediction",
        timestamp: new Date().toISOString(),
        data: {
          crop,
          area,
          soilType,
          rainfall,
          temperature,
          disease: disease === "none" ? "none" : disease,
          result,
          location: locationData?.location
        }
      });

      toast({
        title: "Prediction Complete",
        description: `Predicted yield: ${result.predictedYield} ${result.yieldUnit}`,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        if (error instanceof Error) {
          console.error("Error in yield prediction:", error.message);
        } else {
          console.error("Error in yield prediction:", JSON.stringify(error, null, 2));
        }
      }
      toast({
        title: "Prediction Failed",
        description: "There was an error generating the yield prediction.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cropOptions = [
    { value: "Rice", label: "Rice (Paddy)" },
    { value: "Wheat", label: "Wheat" },
    { value: "Maize", label: "Maize (Corn)" },
    { value: "Cotton", label: "Cotton" },
    { value: "Sugarcane", label: "Sugarcane" },
    { value: "Jute", label: "Jute" },
    { value: "Sesame", label: "Sesame (Til)" },
    { value: "Groundnut", label: "Groundnut (Peanut)" },
    { value: "Bajra", label: "Bajra (Pearl Millet)" },
    { value: "Jowar", label: "Jowar (Sorghum)" }
  ];

  const soilOptions = [
    { value: "Alluvial Soil", label: "Alluvial Soil" },
    { value: "Black Cotton Soil", label: "Black Cotton Soil (Regur)" },
    { value: "Red Soil", label: "Red Soil" },
    { value: "Laterite Soil", label: "Laterite Soil" },
    { value: "Desert Soil", label: "Desert/Arid Soil" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent hover:text-kisan-green dark:hover:text-kisan-gold" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6 space-x-3">
            <div className="p-2 rounded-full bg-kisan-green/10 dark:bg-kisan-green/20">
              <BarChart3 className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
            </div>
            <h1 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold">
              AI Crop Yield Prediction
            </h1>
          </div>
          
          <Card className="mb-8 border-none shadow-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-300">
                  Enter your farm details to get an AI-powered prediction of crop yield and potential income.
                </p>
                
                {locationData && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{locationData.location.district}, {locationData.location.state}</span>
                  </div>
                )}
              </div>
              
              {weatherError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Location Detection Failed</AlertTitle>
                  <AlertDescription>
                    {weatherError} You can still use the application with default values.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-kisan-green text-white dark:bg-kisan-green-dark p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Farm Information</CardTitle>
                    <CardDescription className="text-white/80">
                      Enter details about your farm and growing conditions
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={fetchWeatherData}
                    disabled={fetchingWeather}
                  >
                    {fetchingWeather ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="sr-only">Refresh Weather Data</span>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="crop" className="text-gray-700 dark:text-gray-300">Crop Type</Label>
                    <Select 
                      value={crop} 
                      onValueChange={setCrop}
                    >
                      <SelectTrigger id="crop" className="w-full mt-1">
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="area" className="text-gray-700 dark:text-gray-300">Land Area (hectares)</Label>
                    <Input
                      id="area"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={area}
                      onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="soil" className="text-gray-700 dark:text-gray-300">Soil Type</Label>
                    <Select 
                      value={soilType} 
                      onValueChange={setSoilType}
                    >
                      <SelectTrigger id="soil" className="w-full mt-1">
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                      <SelectContent>
                        {soilOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="rainfall" className="text-gray-700 dark:text-gray-300">
                        Average Rainfall (mm/year)
                      </Label>
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-mono">
                        {rainfall} mm
                      </span>
                    </div>
                    <div className="flex items-center mt-2">
                      <Droplets className="text-blue-500 dark:text-blue-400 h-4 w-4 mr-2" />
                      <Slider
                        id="rainfall"
                        min={200}
                        max={2000}
                        step={50}
                        value={[rainfall]}
                        onValueChange={(value) => setRainfall(value[0])}
                        className="flex-1"
                      />
                    </div>
                    {locationData && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-detected rainfall for {locationData.location.district}: ~{locationData.rainfall} mm/year
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="temperature" className="text-gray-700 dark:text-gray-300">
                        Average Temperature (°C)
                      </Label>
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-mono">
                        {temperature} °C
                      </span>
                    </div>
                    <div className="flex items-center mt-2">
                      <Thermometer className="text-red-500 dark:text-red-400 h-4 w-4 mr-2" />
                      <Slider
                        id="temperature"
                        min={15}
                        max={40}
                        step={1}
                        value={[temperature]}
                        onValueChange={(value) => setTemperature(value[0])}
                        className="flex-1"
                      />
                    </div>
                    {locationData && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-detected temperature for {locationData.location.district}: ~{locationData.temperature}°C
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="disease" className="text-gray-700 dark:text-gray-300">Disease Presence</Label>
                    <Select 
                      value={disease} 
                      onValueChange={setDisease}
                    >
                      <SelectTrigger id="disease" className="w-full mt-1">
                        <SelectValue placeholder="Any disease?" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDiseaseOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-kisan-green hover:bg-kisan-green-dark text-white"
                  onClick={handlePredict}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Prediction...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Predict Yield
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <div>
              {prediction ? (
                <Card className="border-none shadow-lg overflow-hidden">
                  <CardHeader className="bg-kisan-green text-white dark:bg-kisan-green-dark p-4">
                    <CardTitle className="text-lg">Prediction Results</CardTitle>
                    <CardDescription className="text-white/80">
                      Based on your farm information and AI analysis
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg p-4 text-center">
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Predicted Yield</div>
                        <div className="text-2xl font-bold text-kisan-green dark:text-kisan-gold">
                          {prediction.predictedYield} {prediction.yieldUnit}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Confidence: {prediction.confidence}%
                        </div>
                      </div>
                      
                      <div className="col-span-2 sm:col-span-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Potential Income</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ₹{prediction.potentialIncome.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Based on current market prices
                        </div>
                      </div>
                      
                      {/* Display ideal vs. actual conditions comparison when available */}
                      {prediction.idealConditions && prediction.actualConditions && (
                        <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <div className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                            Growing Conditions Comparison
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500 mb-2">Ideal Conditions</div>
                              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Temperature: {prediction.idealConditions.temperature.min}-{prediction.idealConditions.temperature.max}°C</li>
                                <li>Rainfall: {prediction.idealConditions.rainfall.min}-{prediction.idealConditions.rainfall.max} mm</li>
                                <li>Soil Productivity: 100%</li>
                              </ul>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-2">Your Conditions</div>
                              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                                <li className={temperature < prediction.idealConditions.temperature.min || temperature > prediction.idealConditions.temperature.max ? 'text-amber-600' : 'text-green-600'}>
                                  Temperature: {temperature}°C
                                </li>
                                <li className={rainfall < prediction.idealConditions.rainfall.min || rainfall > prediction.idealConditions.rainfall.max ? 'text-amber-600' : 'text-green-600'}>
                                  Rainfall: {rainfall} mm
                                </li>
                                <li className={prediction.actualConditions.soilProductivityFactor < 0.7 ? 'text-amber-600' : 'text-green-600'}>
                                  Soil Productivity: {Math.round(prediction.actualConditions.soilProductivityFactor * 100)}%
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {prediction.diseaseLossPercent && (
                        <div className="col-span-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-amber-700 dark:text-amber-400">Disease Impact</div>
                              <div className="text-sm text-amber-600 dark:text-amber-500">
                                Estimated {prediction.diseaseLossPercent}% yield loss due to {disease}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Leaf className="h-4 w-4 text-kisan-green dark:text-kisan-gold mr-2" />
                          Recommendations
                        </div>
                        <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                          {prediction.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-flex items-center justify-center rounded-full bg-kisan-green/10 dark:bg-kisan-green/20 h-5 w-5 text-xs text-kisan-green dark:text-kisan-gold font-medium mr-2 mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                      <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        This prediction is based on AI analysis and should be used as a guide only. Actual yields may vary based on many factors including weather events and farming practices.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md">
                  <div className="w-16 h-16 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-kisan-green dark:text-kisan-gold" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Yield Prediction</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    Fill in your farm details and click "Predict Yield" to see 
                    your estimated crop yield and potential income.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <CustomFooter />
    </div>
  );
};

export default YieldPrediction;
