import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { analytics } from "@/utils/firebase";
import { logEvent } from "firebase/analytics";
import Index from "./pages/Index";
import DiseaseDetection from "./pages/DiseaseDetection";
import Weather from "./pages/Weather";
import CropInfo from "./pages/CropInfo";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import SuccessStories from "./pages/SuccessStories";
import YieldPrediction from "./pages/YieldPrediction";
import SoilAnalysis from "./pages/SoilAnalysis";
import AdminApiKeyPage from "./pages/admin/api-keys";
import { ThemeProvider } from '@/components/theme-provider';
import BottomNavBar from '@/components/CustomFooter';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Log app initialization
    logEvent(analytics, 'app_initialized');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/disease-detection" element={<DiseaseDetection />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/crop-info" element={<CropInfo />} />
                <Route path="/about" element={<About />} />
                <Route path="/success-stories" element={<SuccessStories />} />
                <Route path="/yield-prediction" element={<YieldPrediction />} />
                <Route path="/soil-analysis" element={<SoilAnalysis />} />
                <Route path="/admin/api-keys" element={<AdminApiKeyPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNavBar />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
