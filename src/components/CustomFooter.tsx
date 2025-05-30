import { Phone, Mail, MapPin } from "lucide-react";

const CustomFooter = () => {
  return (
    <footer className="bg-kisan-blue-dark text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Plant Saathi AI</h3>
            <p className="text-white/80 mb-4">
              Empowering Indian farmers with technology and information for sustainable agriculture.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-white/80">
              <li><a href="/" className="hover:text-kisan-gold transition-colors">Home</a></li>
              <li><a href="/disease-detection" className="hover:text-kisan-gold transition-colors">Disease Detection</a></li>
              <li><a href="/weather" className="hover:text-kisan-gold transition-colors">Weather Forecast</a></li>
              <li><a href="/crop-info" className="hover:text-kisan-gold transition-colors">Crop Information</a></li>
              <li><a href="/about" className="hover:text-kisan-gold transition-colors">About Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>7004741371</span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>stufi339@gmail.com</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Patna, Bihar, India</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/60 text-sm">
          <p>© 2024 Plant Saathi AI. All rights reserved.</p>
          <p className="mt-2">A prototype application for Indian farmers.</p>
        </div>
      </div>
    </footer>
  );
};

export default CustomFooter;
