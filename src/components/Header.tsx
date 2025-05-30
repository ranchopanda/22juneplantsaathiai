import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Moon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import Logo from "@/assets/logo.svg";

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const Header = ({ darkMode, toggleDarkMode, language, setLanguage }: HeaderProps) => {
  const isMobile = useIsMobile();
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'bn', name: 'বাংলা' }
  ];
  
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-kisan-brown-dark border-b border-gray-200 dark:border-kisan-brown shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={Logo} alt="Plant Saathi AI Logo" className="w-12 h-12" />
          <div className="font-mukta">
            <h1 className="text-xl font-bold text-kisan-green">
              प्लांट साथी एआई
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Your AI Farming Assistant
            </p>
          </div>
        </Link>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 pt-10">
                <Link to="/" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                  Home
                </Link>
                <Link to="/disease-detection" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                  {language === "hi" ? "रोग पहचान" : "Disease Detection"}
                </Link>
                <Link to="/weather" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                  {language === "hi" ? "मौसम" : "Weather"}
                </Link>
                <Link to="/crop-info" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                  {language === "hi" ? "फसल जानकारी" : "Crop Info"}
                </Link>
                <Link to="/about" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                  {language === "hi" ? "हमारे बारे में" : "About"}
                </Link>
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                  <div className="px-4 py-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Language</p>
                    <select 
                      className="w-full p-2 border rounded-md dark:bg-gray-800"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {darkMode ? (language === "hi" ? "लाइट मोड" : "Light Mode") : (language === "hi" ? "डार्क मोड" : "Dark Mode")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center space-x-6">
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-kisan-green dark:hover:text-kisan-gold transition-colors">
                {language === "hi" ? "होम" : "Home"}
              </Link>
              <Link to="/disease-detection" className="text-gray-700 dark:text-gray-200 hover:text-kisan-green dark:hover:text-kisan-gold transition-colors">
                {language === "hi" ? "रोग पहचान" : "Disease Detection"}
              </Link>
              <Link to="/weather" className="text-gray-700 dark:text-gray-200 hover:text-kisan-green dark:hover:text-kisan-gold transition-colors">
                {language === "hi" ? "मौसम" : "Weather"}
              </Link>
              <Link to="/crop-info" className="text-gray-700 dark:text-gray-200 hover:text-kisan-green dark:hover:text-kisan-gold transition-colors">
                {language === "hi" ? "फसल जानकारी" : "Crop Info"}
              </Link>
              <Link to="/about" className="text-gray-700 dark:text-gray-200 hover:text-kisan-green dark:hover:text-kisan-gold transition-colors">
                {language === "hi" ? "हमारे बारे में" : "About"}
              </Link>
            </nav>
            
            <div className="flex items-center space-x-3">
              <select 
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-kisan-green"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleDarkMode}
                className="rounded-full"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
