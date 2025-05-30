import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StatisticsSection from "@/components/StatisticsSection";
import CallToAction from "@/components/CallToAction";
import CustomFooter from "@/components/CustomFooter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Map, CloudRain, BarChart3, Camera, LayoutGrid, Wheat, Sprout, Volume2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgriAIChatbot from "@/components/GeminiChatbot";
import Logo from "@/assets/logo.svg";

// Language context would be ideal, but for now we'll use the local state
const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<string>("en");
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis on component mount
  useEffect(() => {
    // Check if SpeechSynthesis is available in the browser
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
    
    // Cleanup function to cancel any ongoing speech on unmount
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // Simulate loading
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Data loaded",
        description: "Welcome to Plant Saathi AI!",
        variant: "success",
      });
    }, 1500);
  }, [toast]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const playInstructions = (instructions: string[]) => {
    if (!speechSynthesisRef.current) {
      toast({
        title: "Voice Not Available",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    // Cancel any existing speech
    speechSynthesisRef.current.cancel();
    
    // If we're currently speaking, just stop
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    
    // Join instructions into a single message with pauses
    const text = instructions.join(". ");
    
    // Create a new speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language based on current language
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    
    // Set voice properties
    utterance.rate = 0.9; // Slightly slower than normal
    utterance.pitch = 1;
    
    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "An error occurred while playing voice instructions.",
        variant: "destructive",
      });
    };
    
    // Speak the text
    speechSynthesisRef.current.speak(utterance);
    
    toast({
      title: language === "hi" ? "वॉयस निर्देश" : "Voice Instructions",
      description: language === "hi" ? "निर्देश बोले जा रहे हैं" : "Playing voice instructions",
    });
  };

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
    if (!isChatbotOpen) {
      toast({
        title: language === "hi" ? "कृषि सहायक" : "Farming Assistant",
        description: language === "hi" ? "आपका सहायक अब उपलब्ध है" : "Your assistant is now available",
      });
    }
  };

  const featuredCrops = [
    {
      name: "Rice",
      hindiName: "चावल",
      description: "India's staple food crop, grown mainly in the monsoon season.",
      icon: <Sprout className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://images.unsplash.com/photo-1536054097400-49d5cf47e6ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      fallbackImage: "https://images.pexels.com/photos/4264039/pexels-photo-4264039.jpeg?auto=compress&cs=tinysrgb&w=800",
      action: () => navigate("/crop-info")
    },
    {
      name: "Wheat",
      hindiName: "गेहूं",
      description: "A major rabi crop grown during winter months across northern India.",
      icon: <Wheat className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      fallbackImage: "https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=800",
      action: () => navigate("/crop-info")
    },
    {
      name: "Cotton",
      hindiName: "कपास",
      description: "India is one of the world's largest producers of cotton.",
      icon: <Sprout className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://images.unsplash.com/photo-1597843786411-a7fa8ad44cf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      fallbackImage: "https://images.pexels.com/photos/139300/pexels-photo-139300.jpeg?auto=compress&cs=tinysrgb&w=800",
      action: () => navigate("/crop-info")
    },
    {
      name: "Sugarcane",
      hindiName: "गन्ना",
      description: "Perennial crop that's vital for sugar production and byproducts.",
      icon: <Leaf className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://images.unsplash.com/photo-1611891388940-d93557237213?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      fallbackImage: "https://images.pexels.com/photos/3680317/pexels-photo-3680317.jpeg?auto=compress&cs=tinysrgb&w=800",
      action: () => navigate("/crop-info")
    }
  ];

  const aiTools = [
    {
      title: "Plant Disease Detection",
      hindiTitle: "फसल रोग पहचानें",
      description: "Upload images of your crops to identify diseases and get treatment recommendations.",
      icon: <Camera className="h-12 w-12 p-2 bg-green-100 text-green-600 rounded-lg" />,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      action: () => {
        toast({
          title: language === "hi" ? "नेविगेट हो रहा है..." : "Navigating...",
          description: language === "hi" ? "रोग पहचान पेज पर जा रहे हैं" : "Going to disease detection page",
        });
        navigate("/disease-detection");
      },
      instructions: [
        "Take a photo of crop leaves",
        "Get disease details and treatment",
        "Learn prevention measures"
      ],
      hindiInstructions: [
        "फसल के पत्ते की फोटो लें",
        "रोग का विवरण और उपचार पाएं",
        "रोकथाम के उपाय जानें"
      ]
    },
    {
      title: "Weather Forecast",
      hindiTitle: "आज का मौसम",
      description: "Get accurate weather predictions for your specific location to plan farming activities.",
      icon: <CloudRain className="h-12 w-12 p-2 bg-blue-100 text-blue-600 rounded-lg" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      action: () => {
        toast({
          title: language === "hi" ? "मौसम डेटा लोड हो रहा है..." : "Loading weather data...",
          description: language === "hi" ? "उत्तर प्रदेश के लिए मौसम की जानकारी" : "Weather information for UP",
        });
        navigate("/weather");
      },
      instructions: [
        "Check weather for your location",
        "View rainfall and temperature forecast",
        "Get advice for farming activities"
      ],
      hindiInstructions: [
        "स्थान के अनुसार मौसम जानें",
        "वर्षा और तापमान का पूर्वानुमान",
        "खेती गतिविधियों के लिए सलाह"
      ]
    },
    {
      title: "Soil Analysis",
      hindiTitle: "मिट्टी जांच",
      description: "Analyze soil composition using AI to determine optimal crops and fertilizers.",
      icon: <Map className="h-12 w-12 p-2 bg-amber-100 text-amber-600 rounded-lg" />,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      action: () => {
        toast({
          title: language === "hi" ? "मिट्टी विश्लेषण" : "Soil Analysis",
          description: language === "hi" ? "मिट्टी की जांच के लिए तैयार" : "Ready for soil testing",
        });
        navigate("/soil-analysis");
      },
      instructions: [
        "Upload a photo of your soil",
        "Get nutrient analysis",
        "Receive fertilizer recommendations"
      ],
      hindiInstructions: [
        "मिट्टी की फोटो अपलोड करें",
        "पोषक तत्वों का विश्लेषण पाएं",
        "उपयुक्त उर्वरक सलाह"
      ]
    },
    {
      title: "Yield Prediction",
      hindiTitle: "उपज अनुमान",
      description: "Predict crop yields based on weather, soil, and farming practices data.",
      icon: <BarChart3 className="h-12 w-12 p-2 bg-purple-100 text-purple-600 rounded-lg" />,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      action: () => {
        toast({
          title: language === "hi" ? "उपज अनुमान तैयार हो रहा है" : "Preparing yield prediction",
          description: language === "hi" ? "अपनी फसल का चयन करें" : "Select your crop",
        });
        navigate("/yield-prediction");
      },
      instructions: [
        "Select crop, soil and location",
        "Get potential yield information",
        "View income estimates"
      ],
      hindiInstructions: [
        "फसल, मिट्टी और स्थान का चयन करें",
        "संभावित उपज की जानकारी",
        "आय का अनुमान देखें"
      ]
    },
    {
      title: "Crop Information",
      hindiTitle: "फसल की जानकारी",
      description: "Access detailed information about various crops, growing methods, and market trends.",
      icon: <LayoutGrid className="h-12 w-12 p-2 bg-indigo-100 text-indigo-600 rounded-lg" />,
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      action: () => {
        toast({
          title: language === "hi" ? "फसल जानकारी" : "Crop Information",
          description: language === "hi" ? "फसलों के बारे में जानकारी" : "Information about crops",
        });
        navigate("/crop-info");
      },
      instructions: [
        "Browse details for various crops",
        "Learn suitable farming methods",
        "Check crop market prices"
      ],
      hindiInstructions: [
        "विभिन्न फसलों का विवरण देखें",
        "उपयुक्त खेती विधियां जानें",
        "फसल बाजार मूल्य की जानकारी"
      ]
    }
  ];

  const renderBrandedLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <img src={Logo} alt="Plant Saathi AI Logo" className="w-24 h-24 mb-6 animate-bounce" />
      <div className="w-12 h-12 border-4 border-kisan-green border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-lg text-kisan-green font-semibold">Loading Plant Saathi AI...</p>
    </div>
  );

  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <div key={index} className="skeleton-card">
        <div className="skeleton-image" />
        <div className="skeleton-content">
          <div className="skeleton-title" />
          <div className="skeleton-text w-full" />
          <div className="skeleton-text w-3/4" />
          <div className="skeleton-text-sm w-1/2" />
          <div className="skeleton-button" />
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        language={language}
        setLanguage={setLanguage}
      />
      
      <HeroSection />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold mb-3">
              {language === "hi" ? "AI-आधारित कृषि समाधान" : "AI-Powered Farming Solutions"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {language === "hi" 
                ? "हमारी अत्याधुनिक AI तकनीक भारतीय किसानों को डेटा-संचालित निर्णय लेने, उत्पादकता बढ़ाने और टिकाऊ कृषि अभ्यासों को प्राप्त करने में मदद करती है।" 
                : "Our cutting-edge AI technology helps Indian farmers make data-driven decisions, increase productivity, and achieve sustainable agriculture practices."}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              renderBrandedLoading()
            ) : (
              aiTools.map((tool, index) => (
                <Card 
                  key={index} 
                  className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl group"
                >
                  <CardHeader className="p-6">
                    <div className={`rounded-lg inline-block mb-3 ${tool.color} transition-transform group-hover:scale-110 duration-300`}>
                      {tool.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                      {language === "hi" ? tool.hindiTitle : tool.title}
                      <button 
                        onClick={() => playInstructions(language === "hi" ? tool.hindiInstructions : tool.instructions)}
                        className={`p-2 ${isSpeaking ? 'bg-kisan-green dark:bg-kisan-gold' : 'bg-kisan-green/10 dark:bg-kisan-green/20'} rounded-full hover:bg-kisan-green/20 dark:hover:bg-kisan-green/30 transition-all duration-300 hover:scale-110`}
                        aria-label="Play voice instructions"
                      >
                        <Volume2 className={`h-5 w-5 ${isSpeaking ? 'text-white' : 'text-kisan-green dark:text-kisan-gold'} ${isSpeaking ? 'animate-pulse' : ''}`} />
                      </button>
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-2">
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {(language === "hi" ? tool.hindiInstructions : tool.instructions).map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-0 pb-6 px-6">
                    <Button 
                      onClick={tool.action}
                      className="w-full h-12 text-base bg-kisan-green hover:bg-kisan-green-dark text-white dark:bg-kisan-green-dark dark:hover:bg-kisan-green transition-all duration-300 transform hover:translate-y-[-2px]"
                    >
                      {language === "hi" ? "इस्तेमाल करें" : "Try Now"}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-kisan-green/5 dark:bg-kisan-green/10 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold mb-3">
                {language === "hi" ? "प्रमुख फसलें" : "Featured Crops"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {language === "hi" 
                  ? "भारत की प्रमुख फसलों के बारे में जानकारी, जिसमें खेती के तरीके, रोग निवारण और बाजार अंतर्दृष्टि शामिल हैं।"
                  : "Browse information about India's major crops, including growing methods, disease prevention, and market insights."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                renderBrandedLoading()
              ) : (
                featuredCrops.map((crop, index) => (
                  <Card 
                    key={index} 
                    className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl group"
                  >
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={crop.image} 
                        alt={language === "hi" ? crop.hindiName : crop.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (crop.fallbackImage && target.src !== crop.fallbackImage) {
                            target.src = crop.fallbackImage;
                          }
                        }}
                      />
                    </div>
                    <CardHeader className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="transition-transform group-hover:scale-110 duration-300">
                          {crop.icon}
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          {language === "hi" ? crop.hindiName : crop.name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {crop.description}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4">
                      <Button 
                        variant="outline" 
                        onClick={crop.action}
                        className="w-full border-kisan-green text-kisan-green hover:bg-kisan-green hover:text-white dark:border-kisan-gold dark:text-kisan-gold dark:hover:bg-kisan-gold/20 transition-all duration-300"
                      >
                        {language === "hi" ? "और जानें" : "Learn More"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
            
            <div className="text-center mt-10">
              <Button 
                onClick={() => navigate("/crop-info")}
                variant="outline"
                className="border-kisan-green text-kisan-green hover:bg-kisan-green hover:text-white dark:border-kisan-gold dark:text-kisan-gold dark:hover:bg-kisan-gold/20 transition-all duration-300 transform hover:translate-y-[-2px]"
              >
                {language === "hi" ? "सभी फसलें देखें" : "View All Crops"}
              </Button>
            </div>
          </div>
        </div>
        
        <StatisticsSection />
        <CallToAction />
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg md:hidden z-40">
        <div className="flex justify-around items-center p-3">
          <button onClick={() => navigate("/disease-detection")} className="flex flex-col items-center group p-2 active:bg-gray-100 dark:active:bg-gray-700 rounded-lg touch-action-manipulation">
            <Camera className="h-6 w-6 text-kisan-green dark:text-kisan-gold transition-transform group-active:scale-90" />
            <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">
              {language === "hi" ? "रोग पहचानें" : "Diseases"}
            </span>
          </button>
          <button onClick={() => navigate("/weather")} className="flex flex-col items-center group p-2 active:bg-gray-100 dark:active:bg-gray-700 rounded-lg touch-action-manipulation">
            <CloudRain className="h-6 w-6 text-kisan-green dark:text-kisan-gold transition-transform group-active:scale-90" />
            <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">
              {language === "hi" ? "मौसम" : "Weather"}
            </span>
          </button>
          <button onClick={() => navigate("/soil-analysis")} className="flex flex-col items-center group p-2 active:bg-gray-100 dark:active:bg-gray-700 rounded-lg touch-action-manipulation">
            <Map className="h-6 w-6 text-kisan-green dark:text-kisan-gold transition-transform group-active:scale-90" />
            <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">
              {language === "hi" ? "मिट्टी जांच" : "Soil"}
            </span>
          </button>
          <button onClick={() => navigate("/crop-info")} className="flex flex-col items-center group p-2 active:bg-gray-100 dark:active:bg-gray-700 rounded-lg touch-action-manipulation">
            <Wheat className="h-6 w-6 text-kisan-green dark:text-kisan-gold transition-transform group-active:scale-90" />
            <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">
              {language === "hi" ? "फसल जानकारी" : "Crops"}
            </span>
          </button>
        </div>
      </div>
      
      {/* Chatbot Button */}
      <button 
        onClick={toggleChatbot} 
        className="fixed bottom-20 right-4 md:bottom-4 md:right-4 p-3 rounded-full bg-kisan-green text-white shadow-lg z-50 hover:bg-kisan-green-dark transition-all duration-300 hover:scale-110"
        aria-label="Open chatbot"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
      
      <AgriAIChatbot 
        language={language} 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
      
      <CustomFooter />
    </div>
  );
};

export default Index;
