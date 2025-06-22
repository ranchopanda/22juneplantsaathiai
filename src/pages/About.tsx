import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo.svg";

const About = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Disease Detect", path: "/disease-detection" },
    { label: "Weather", path: "/weather" },
    { label: "Crop Info", path: "/crop-info" },
    { label: "Farming Tips", path: "#whats-next" },
    { label: "Govt. Schemes", path: "#whats-next" },
    { label: "Market Prices", path: "#whats-next" },
    { label: "Research Papers", path: "#whats-next" },
    { label: "Admin", path: "/admin/api-keys" },
  ];

  const sectionLinks = [
    { label: "Mission & Vision", href: "#mission-vision" },
    { label: "Who It's For", href: "#who-for" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Key Features", href: "#key-features" },
    { label: "What's Next?", href: "#whats-next" },
    { label: "Privacy", href: "#privacy" },
    { label: "FAQs", href: "#faqs" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-background dark:bg-kisan-brown-dark text-foreground min-h-screen">
        {/* Top Menu */}
        <nav className="w-full border-b border-gray-200 dark:border-kisan-brown bg-white dark:bg-kisan-brown-dark py-4 px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <img src={Logo} alt="Plant Saathi AI Logo" className="w-14 h-14" />
            <span className="text-2xl font-bold text-kisan-green dark:text-kisan-gold">Plant Saathi AI</span>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center text-sm font-medium">
            {menuItems.map((item) => (
              <a key={item.label} href={item.path} className="hover:text-kisan-green dark:hover:text-kisan-gold transition-colors">
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "hi" : "en")}>{language === "en" ? "EN" : "हिंदी"}</Button>
          </div>
        </nav>

        {/* Section Navigation */}
        <nav className="w-full bg-kisan-green/5 dark:bg-kisan-gold/10 py-2 px-4 flex flex-wrap gap-3 justify-center sticky top-0 z-30 border-b border-kisan-green/10 dark:border-kisan-gold/20">
          {sectionLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-kisan-green dark:text-kisan-gold hover:underline font-medium text-sm transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <main className="container mx-auto px-4 py-12 max-w-3xl">
          {/* Mission & Vision Section */}
          <section id="mission-vision" className="mb-12 text-center scroll-mt-24">
            <div className="inline-block px-4 py-2 rounded-full bg-kisan-green/10 dark:bg-kisan-gold/10 mb-4">
              <span className="text-kisan-green dark:text-kisan-gold font-semibold tracking-wide text-base">Our Mission & Vision</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-kisan-green dark:text-kisan-gold">Empowering Every Indian Farmer</h2>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-4">
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-kisan-green/20 dark:border-kisan-gold/20">
                <h3 className="text-lg font-semibold text-kisan-green dark:text-kisan-gold mb-2">Our Mission</h3>
                <p className="text-gray-700 dark:text-gray-200">Empower every Indian farmer with instant, reliable crop advice—no matter where they are.</p>
              </div>
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-kisan-green/20 dark:border-kisan-gold/20">
                <h3 className="text-lg font-semibold text-kisan-green dark:text-kisan-gold mb-2">Our Vision</h3>
                <p className="text-gray-700 dark:text-gray-200">A future where technology and tradition work together for sustainable, profitable farming.</p>
              </div>
            </div>
            <a href="#who-for" className="inline-block mt-4 text-kisan-green dark:text-kisan-gold hover:underline font-medium transition-colors">Learn who we help ↓</a>
          </section>

          {/* Who It's For */}
          <section id="who-for" className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-3 text-kisan-green dark:text-kisan-gold">Who It's For</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-200">
              <li><b>Farmers & Students:</b> From small rice growers to agriculture learners.</li>
              <li><b>All Major Crops:</b> Over 50 crops like rice, wheat, cotton, vegetables, pulses, and more.</li>
              <li><b>Full Problem Coverage:</b> 250+ diseases, pests, and nutrient issues.</li>
            </ul>
            <a href="#how-it-works" className="inline-block mt-4 text-kisan-green dark:text-kisan-gold hover:underline font-medium transition-colors">How it works →</a>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-3 text-kisan-green dark:text-kisan-gold">How It Works</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-200">
              <li><b>Take or Upload a Photo</b> — Use any smartphone camera—no extra gear needed.</li>
              <li><b>AI Checks Your Crop</b> — Our smart engine scans the image for problems.</li>
              <li><b>Get Easy Steps</b> — See simple treatment advice and relevant government help.</li>
            </ol>
            <a href="#key-features" className="inline-block mt-4 text-kisan-green dark:text-kisan-gold hover:underline font-medium transition-colors">See key features →</a>
          </section>

          {/* Key Features */}
          <section id="key-features" className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-3 text-kisan-green dark:text-kisan-gold">Key Features</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-200">
              <li><b>Built on Our Own Data:</b> Trained on farm photos from across India.</li>
              <li><b>Covers Whole India:</b> Available nationwide now, growing every day.</li>
              <li><b>Offline Coming Soon:</b> Use core tools without internet in future updates.</li>
            </ul>
            <a href="#whats-next" className="inline-block mt-4 text-kisan-green dark:text-kisan-gold hover:underline font-medium transition-colors">What's next? →</a>
          </section>

          {/* What's Next? */}
          <section id="whats-next" className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-3 text-kisan-green dark:text-kisan-gold">What's Next?</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-200">
              <li><b>Farming Tips:</b> Daily short guides from experts.</li>
              <li><b>Govt. Schemes:</b> Real-time updates on subsidies and support.</li>
              <li><b>Market Prices:</b> Live mandi rates to sell at the best price.</li>
              <li><b>Research Bytes:</b> Quick summaries of agriculture studies.</li>
            </ul>
            <a href="#privacy" className="inline-block mt-4 text-kisan-green dark:text-kisan-gold hover:underline font-medium transition-colors">See privacy →</a>
          </section>

          {/* Privacy You Can Trust */}
          <section id="privacy" className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-3 text-kisan-green dark:text-kisan-gold">Privacy You Can Trust</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-200">
              <li><b>Your Data Stays Yours:</b> End-to-end encryption—no selling your info.</li>
              <li><b>Try Without Signing Up:</b> Guest mode available.</li>
            </ul>
            <a href="#faqs" className="inline-block mt-4 text-kisan-green dark:text-kisan-gold hover:underline font-medium transition-colors">FAQs →</a>
          </section>

          {/* FAQs */}
          <section id="faqs" className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-3 text-kisan-green dark:text-kisan-gold">FAQs</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-200">
              <li><b>Is it free?</b> Yes—always free, no hidden costs.</li>
              <li><b>Need internet?</b> Yes today. Offline mode is on our roadmap.</li>
              <li><b>Which crops?</b> 50+ now, adding more each month.</li>
              <li><b>Questions?</b> Email us at <a href="mailto:stufi339@gmail.com" className="text-kisan-green underline">stufi339@gmail.com</a></li>
            </ul>
            <a href="#contact" className="inline-block mt-4 text-kisan-green dark:text-kisan-gold hover:underline font-medium transition-colors">Contact & Support →</a>
          </section>

          {/* Contact & Copyright */}
          <section id="contact" className="text-center text-gray-500 dark:text-gray-400 text-sm mt-12 scroll-mt-24">
            <hr className="my-6 border-gray-200 dark:border-gray-700" />
            <p>© 2024 Plant Saathi AI | <a href="mailto:stufi339@gmail.com" className="underline">stufi339@gmail.com</a> | +91 70047 41371</p>
          </section>
        </main>

        <CustomFooter />
      </div>
    </div>
  );
};

export default About;
