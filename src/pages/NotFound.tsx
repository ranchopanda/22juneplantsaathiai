import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        typeof location.pathname === 'object' ? JSON.stringify(location.pathname, null, 2) : location.pathname
      );
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-24 h-24 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-6xl font-bold text-kisan-green dark:text-kisan-gold">404</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-kisan-green-dark dark:text-kisan-gold">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved to another URL.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="border-kisan-green text-kisan-green dark:border-kisan-gold dark:text-kisan-gold">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")} className="bg-kisan-green hover:bg-kisan-green-dark text-white">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
