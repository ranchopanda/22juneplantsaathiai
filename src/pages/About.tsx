import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, UploadCloud, Globe, Smartphone, ShieldCheck, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const About = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
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
            About Kisan Krishi Dost AI
          </h1>
          
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-kisan-green dark:text-kisan-gold">
                  Our Mission
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Kisan Krishi Dost AI was created with a clear mission: to empower Indian farmers with AI-powered tools that make modern agricultural knowledge accessible to everyone.
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300 list-none">
                  <li className="flex items-start">
                    <div className="h-5 w-5 mt-0.5 mr-2 rounded-full bg-kisan-green flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                    <span><strong>Reduce crop losses</strong> through early disease detection and prevention</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 mt-0.5 mr-2 rounded-full bg-kisan-green flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                    <span><strong>Boost yields</strong> with personalized crop management recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 mt-0.5 mr-2 rounded-full bg-kisan-green flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                    <span><strong>Access expert advice</strong> in your language, even with limited literacy</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 mt-0.5 mr-2 rounded-full bg-kisan-green flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                    <span><strong>Make data-driven decisions</strong> for sustainable and profitable farming</span>
                  </li>
                </ul>
              </div>
              
              <div className="relative rounded-lg overflow-hidden h-64 md:h-auto">
                <img 
                  src="https://images.unsplash.com/photo-1589951911944-7f5ef2d99d35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                  alt="Indian farmers working in field"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-kisan-green/10 flex items-center justify-center mb-4">
                      <Users className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Built For Indian Farmers</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Designed specifically for Indian agriculture with local crop varieties, diseases, and farming practices.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-kisan-green/10 flex items-center justify-center mb-4">
                      <Globe className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Multi-lingual Support</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Available in major Indian languages to reach farmers in all regions of the country.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-kisan-green/10 flex items-center justify-center mb-4">
                      <UploadCloud className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Works Offline</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Core features accessible without internet connection for remote areas with limited connectivity.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-kisan-green dark:text-kisan-gold">
                Our Impact
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-kisan-green dark:text-kisan-gold">50,000+</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Farmers Using App</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-kisan-green dark:text-kisan-gold">25</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Indian States</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-kisan-green dark:text-kisan-gold">95%</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Disease Detection Accuracy</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-kisan-green dark:text-kisan-gold">30%</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Average Yield Increase</p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-kisan-green dark:text-kisan-gold">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                <div className="h-40 bg-green-50 dark:bg-green-900/20 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1590682680695-43b964a3ae17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Farmer taking photo of crop"
                    className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-kisan-green text-white flex items-center justify-center">
                      <span className="text-2xl font-bold">1</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-semibold mb-2">Upload or Capture</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Take a picture of your crop using your smartphone camera or upload an existing photo.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                <div className="h-40 bg-blue-50 dark:bg-blue-900/20 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="AI analyzing image"
                    className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-kisan-green text-white flex items-center justify-center">
                      <span className="text-2xl font-bold">2</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Our AI instantly analyzes the image to identify diseases, nutrient deficiencies, or pests.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                <div className="h-40 bg-amber-50 dark:bg-amber-900/20 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1586282391848-2bc7ff2412d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Farmer receiving recommendations"
                    className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-kisan-green text-white flex items-center justify-center">
                      <span className="text-2xl font-bold">3</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-semibold mb-2">Get Recommendations</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Receive detailed treatment recommendations, preventive measures, and government scheme information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-kisan-brown dark:text-kisan-gold-light flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Mobile Compatibility
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Kisan Krishi Dost AI works on all smartphones, including basic Android devices. The app is optimized for:
                </p>
                <ul className="space-y-2">
                  <li className="flex">
                    <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">Low bandwidth environments</span>
                  </li>
                  <li className="flex">
                    <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">Minimal storage requirements (under 50MB)</span>
                  </li>
                  <li className="flex">
                    <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">Fast disease detection within seconds</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-kisan-brown dark:text-kisan-gold-light flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Data Privacy
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We take farmers' data privacy seriously:
                </p>
                <ul className="space-y-2">
                  <li className="flex">
                    <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">All data is encrypted and securely stored</span>
                  </li>
                  <li className="flex">
                    <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">Your crop data is never sold to third parties</span>
                  </li>
                  <li className="flex">
                    <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">Option to use the app without creating an account</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
          
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-kisan-green dark:text-kisan-gold">
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Is the app completely free to use?
                </AccordionTrigger>
                <AccordionContent>
                  Yes, Kisan Krishi Dost AI is completely free for all farmers. We believe in making advanced agricultural technology accessible to everyone. The app is supported by government agricultural extension programs and nonprofit agricultural research organizations.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  How accurate is the disease detection?
                </AccordionTrigger>
                <AccordionContent>
                  Our AI model has been trained on over 1 million images of crop diseases specific to Indian agriculture. It currently has a 95% accuracy rate for the most common crop diseases. The model is continuously improving as more farmers use the app.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Do I need an internet connection to use the app?
                </AccordionTrigger>
                <AccordionContent>
                  An internet connection is required to use the app's features. We've optimized the app to work well even on low-bandwidth connections typically found in rural areas. Some features like disease detection use efficient AI models that require minimal data transfer.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Which crops are currently supported?
                </AccordionTrigger>
                <AccordionContent>
                  We currently support major Indian crops including rice, wheat, cotton, sugarcane, tomato, potato, chili, maize, soybean, groundnut, and several pulses. We're continuously adding more crops based on farmer demand and seasonal patterns.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  How can I provide feedback or report issues?
                </AccordionTrigger>
                <AccordionContent>
                  We welcome feedback! You can report issues or suggest improvements directly through the app's feedback form. Alternatively, you can contact our support team at help@kisankrishi.in or call our toll-free helpline at 1800-XXX-XXXX (available 9am to 5pm, Monday to Saturday).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
          
          <section className="mb-16">
            <div className="bg-kisan-green text-white rounded-lg p-8 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
              <p className="mb-6 max-w-xl mx-auto">
                Our support team is available to assist you with any questions about using Kisan Krishi Dost AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-white text-kisan-green hover:bg-gray-100">
                  Contact Support
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  View Tutorial
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
