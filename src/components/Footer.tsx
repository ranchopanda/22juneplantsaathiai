import { Link } from 'react-router-dom';
import { Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';
import Logo from "@/assets/logo.svg";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-kisan-brown-dark border-t border-gray-200 dark:border-kisan-brown">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={Logo} alt="Plant Saathi AI Logo" className="w-16 h-16 mb-2" />
            <h3 className="text-xl font-semibold text-kisan-green dark:text-kisan-gold mb-4">
              प्लांट साथी एआई
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Empowering Indian farmers with AI-powered solutions for better crop management and productivity.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-kisan-green dark:hover:text-kisan-gold">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-kisan-green dark:hover:text-kisan-gold">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-kisan-green dark:hover:text-kisan-gold">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-kisan-green dark:text-kisan-gold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/disease-detection" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Disease Detection
                </Link>
              </li>
              <li>
                <Link to="/weather" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Weather Forecast
                </Link>
              </li>
              <li>
                <Link to="/crop-info" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Crop Information
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-kisan-green dark:text-kisan-gold mb-4">Coming Soon</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Farming Tips
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Government Schemes
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Market Prices
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-kisan-green dark:hover:text-kisan-gold">
                  Research Papers
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-kisan-green dark:text-kisan-gold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-kisan-green dark:text-kisan-gold" />
                <span className="text-gray-600 dark:text-gray-300">+91 7004741371</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-kisan-green dark:text-kisan-gold" />
                <span className="text-gray-600 dark:text-gray-300">stufi339@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-kisan-brown mt-8 pt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            © 2024 प्लांट साथी एआई. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
