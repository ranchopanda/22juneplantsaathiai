import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Camera, Cloud, Database, Zap } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-kisan-green-light/10 via-white to-kisan-gold/10 dark:from-kisan-green-dark/30 dark:via-gray-900 dark:to-kisan-gold-dark/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-kisan-green-dark dark:text-kisan-gold">
              किसान कृषि दोस्त AI
            </h1>
            <p className="text-xl md:text-2xl mb-6 text-gray-700 dark:text-gray-300">
              Your AI-powered farming assistant for better crop management and increased productivity
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                className="bg-kisan-green hover:bg-kisan-green-dark text-white text-lg shadow-lg transform transition-all duration-300 hover:scale-105" 
                size="lg"
                onClick={() => navigate("/disease-detection")}
              >
                <Camera className="mr-2 h-5 w-5" />
                Detect Disease Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-kisan-green text-kisan-green hover:bg-kisan-green/10 dark:border-kisan-gold dark:text-kisan-gold"
                onClick={() => navigate("/weather")}
              >
                <Cloud className="mr-2 h-5 w-5" />
                Check Weather
              </Button>
            </div>
          </div>
          
          <div className="hidden md:block relative">
            <div className="relative h-80 w-full overflow-hidden rounded-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-kisan-green to-kisan-gold opacity-20 dark:opacity-40 z-10 rounded-xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1606041008023-472dfb5e530f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=100" 
                alt="Indian Farmer in Field"
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-20 animate-pulse-slow">
                <Camera className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
              </div>
              
              <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-20 animate-pulse-slow delay-75">
                <Database className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
              </div>
              
              <div className="absolute bottom-4 left-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-20 animate-pulse-slow delay-150">
                <Zap className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
              </div>
              
              <div className="absolute top-1/3 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-20 animate-pulse-slow delay-300">
                <Cloud className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute -z-10 top-20 right-0 w-72 h-72 bg-kisan-green/10 rounded-full blur-3xl"></div>
      <div className="absolute -z-10 bottom-10 left-10 w-60 h-60 bg-kisan-gold/10 rounded-full blur-3xl"></div>
    </div>
  );
};

export default HeroSection;
