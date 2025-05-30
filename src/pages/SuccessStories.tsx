import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import SuccessStoryForm from "@/components/SuccessStoryForm";

const SuccessStories = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold">
              Farmers' Success Stories
            </h1>
            
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-kisan-green hover:bg-kisan-green-dark text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Share Your Story
            </Button>
          </div>
          
          {showForm ? (
            <Card className="mb-10">
              <CardContent className="p-6">
                <SuccessStoryForm onClose={() => setShowForm(false)} />
              </CardContent>
            </Card>
          ) : null}
          
          {/* Placeholder state - no stories yet */}
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Success Stories Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Be the first to share how Plant Saathi AI helped improve your farming practices and yield.
            </p>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-kisan-green hover:bg-kisan-green-dark text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Share Your Success Story
            </Button>
          </div>
          
          <div className="mt-12 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-center text-sm text-amber-800 dark:text-amber-200">
              Your success story helps inspire and guide other farmers. Share your experience with using Plant Saathi AI.
            </p>
          </div>
        </div>
      </main>
      
      <CustomFooter />
    </div>
  );
};

export default SuccessStories;
