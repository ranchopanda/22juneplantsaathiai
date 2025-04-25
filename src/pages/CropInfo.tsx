import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, BarChart, Clock, Droplets, Sun, Thermometer, AlertTriangle } from "lucide-react";

const crops = [
  {
    id: "rice",
    name: "Rice (धान)",
    image: "https://source.unsplash.com/random/600x400/?rice,paddy",
    description: "Rice is a staple food crop in India, particularly important in eastern and southern regions. It's grown in the kharif season and requires abundant water.",
    varieties: ["Basmati", "IR-36", "Pusa Basmati", "Sona Masuri", "Gobindobhog"],
    seasons: ["Kharif (June-July)", "Rabi (Nov-Dec in some regions)"],
    regions: ["West Bengal", "Uttar Pradesh", "Punjab", "Andhra Pradesh", "Tamil Nadu", "Bihar"],
    water_requirements: "High (1200-1600 mm rainfall or irrigation)",
    temperature: "24-30°C (ideal)",
    soil_type: "Clay or clay loam soils with good water retention",
    growth_period: "90-150 days depending on variety",
    pests_diseases: [
      "Rice Blast (Magnaporthe grisea)",
      "Brown Planthopper (Nilaparvata lugens)",
      "Bacterial Leaf Blight (Xanthomonas oryzae)",
      "Rice Stem Borer (Scirpophaga incertulas)"
    ],
    cultivation_tips: [
      "Proper water management is crucial - maintain 2-5 cm standing water in fields",
      "Transplant seedlings at 20-25 days old for optimal yields",
      "Use certified seeds of suitable varieties for your region",
      "Apply balanced fertilization - N:P:K ratio of 120:60:60 kg/ha for most varieties",
      "Implement Integrated Pest Management (IPM) for sustainable control"
    ],
    market_info: "Rice is a controlled commodity with MSP (Minimum Support Price). Current MSP for common paddy is ₹2,040 per quintal (2023-24). Direct procurement by Food Corporation of India (FCI) and state agencies."
  },
  {
    id: "wheat",
    name: "Wheat (गेहूं)",
    image: "https://source.unsplash.com/random/600x400/?wheat,farm",
    description: "Wheat is a major rabi crop in India and the second most important cereal crop after rice. It's primarily grown in the northern states during winter months.",
    varieties: ["HD-2967", "PBW-550", "DBW-17", "WH-542", "Lokwan"],
    seasons: ["Rabi (October-November sowing)"],
    regions: ["Uttar Pradesh", "Punjab", "Haryana", "Madhya Pradesh", "Rajasthan"],
    water_requirements: "Medium (450-650 mm over the season)",
    temperature: "20-25°C (growing), 15-20°C (ripening)",
    soil_type: "Well-drained loam or clay loam soils, pH 6.5-7.5",
    growth_period: "120-150 days",
    pests_diseases: [
      "Powdery Mildew (Blumeria graminis)",
      "Rust (Yellow, Brown, and Black)",
      "Loose Smut (Ustilago tritici)",
      "Aphids",
      "Termites"
    ],
    cultivation_tips: [
      "Timely sowing (late October to mid-November) is crucial for good yields",
      "First irrigation at crown root initiation stage (21-25 days after sowing)",
      "Apply fertilizers at recommended doses (120:60:40 kg NPK/ha)",
      "Control weeds early, especially Phalaris minor (Gulli Danda)",
      "Monitor for rust diseases, especially in humid conditions"
    ],
    market_info: "MSP for wheat is ₹2,125 per quintal (2023-24). Primary marketing through FCI, state agencies, and open market. Major mandis in Khanna (Punjab), Karnal (Haryana), and Sehore (MP)."
  },
  {
    id: "cotton",
    name: "Cotton (कपास)",
    image: "https://source.unsplash.com/random/600x400/?cotton,field",
    description: "Cotton is an important cash crop in India, which is one of the largest producers globally. It provides raw material for the textile industry and supports millions of farmers.",
    varieties: ["Bt Cotton hybrids", "DCH-32", "MCU-5", "LRA-5166", "Desi Cotton varieties"],
    seasons: ["Kharif (May-June sowing)"],
    regions: ["Gujarat", "Maharashtra", "Telangana", "Andhra Pradesh", "Punjab", "Haryana", "Rajasthan"],
    water_requirements: "Medium (500-800 mm spread across growing season)",
    temperature: "21-30°C (ideal range)",
    soil_type: "Well-drained, deep black cotton soils (regur) or alluvial soils, pH 6.5-8.0",
    growth_period: "150-180 days",
    pests_diseases: [
      "Bollworms (American, Pink, and Spotted)",
      "Whitefly (Bemisia tabaci)",
      "Jassids (Amrasca biguttula)",
      "Cotton Leaf Curl Virus Disease",
      "Bacterial Blight"
    ],
    cultivation_tips: [
      "Use certified Bt cotton seeds for bollworm resistance",
      "Maintain optimal plant population (11,000-13,000 plants/acre)",
      "Follow IPM practices to minimize pesticide use",
      "Monitor for whitefly and pink bollworm which can develop resistance",
      "Apply micronutrients, especially zinc and boron in deficient soils"
    ],
    market_info: "MSP for medium staple cotton is ₹6,080 per quintal (2023-24). Marketing through Cotton Corporation of India (CCI) and private traders. Prices fluctuate based on international markets."
  },
  {
    id: "sugarcane",
    name: "Sugarcane (गन्ना)",
    image: "https://source.unsplash.com/random/600x400/?sugarcane",
    description: "Sugarcane is a major cash crop in India, which is the second-largest producer globally. It is the primary source of sugar and is also used for jaggery, molasses, and biofuel production.",
    varieties: ["Co 86032", "Co 0238", "Co 0118", "CoJ 64", "CoVC 99463"],
    seasons: ["Spring (Feb-March)", "Autumn (Sept-Oct)", "Adsali (July-Aug)"],
    regions: ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Bihar"],
    water_requirements: "High (1500-2500 mm over the growing period)",
    temperature: "24-30°C (optimum growth)",
    soil_type: "Deep, well-drained loamy soils, pH 6.5-7.5",
    growth_period: "10-12 months (plant crop), 9-10 months (ratoon crop)",
    pests_diseases: [
      "Red Rot (Colletotrichum falcatum)",
      "Smut (Ustilago scitaminea)",
      "Early Shoot Borer (Chilo infuscatellus)",
      "Top Borer (Scirpophaga excerptalis)",
      "Pyrilla (Pyrilla perpusilla)"
    ],
    cultivation_tips: [
      "Use 3-eye bud setts treated with fungicide for planting",
      "Plant in trenches/furrows at 75-90 cm row spacing",
      "Apply balanced fertilization (250:100:120 kg NPK/ha)",
      "Earthing up at 90-120 days protects against lodging",
      "Trash mulching conserves moisture and suppresses weeds",
      "Ratoon management can provide cost-effective subsequent harvests"
    ],
    market_info: "Fair and Remunerative Price (FRP) set by govt (₹315 per quintal for 2023-24). Direct sale to sugar mills based on recovery percentage. Payment often in installments according to State Advised Price (SAP)."
  },
  {
    id: "potato",
    name: "Potato (आलू)",
    image: "https://source.unsplash.com/random/600x400/?potato,crop",
    description: "Potato is an important vegetable crop in India, cultivated primarily in the winter season. It's a staple food and a source of income for many small and marginal farmers.",
    varieties: ["Kufri Jyoti", "Kufri Pukhraj", "Kufri Chipsona", "Kufri Bahar", "Kufri Sindhuri"],
    seasons: ["Rabi (Oct-Nov sowing in plains)", "Spring (Jan-Feb in hills)"],
    regions: ["Uttar Pradesh", "West Bengal", "Bihar", "Punjab", "Gujarat"],
    water_requirements: "Medium (500-700 mm during growing season)",
    temperature: "15-25°C (optimum for growth)",
    soil_type: "Well-drained sandy loam to clay loam, pH 5.5-6.5",
    growth_period: "90-120 days depending on variety",
    pests_diseases: [
      "Late Blight (Phytophthora infestans)",
      "Early Blight (Alternaria solani)",
      "Potato Tuber Moth (Phthorimaea operculella)",
      "Potato Cyst Nematode",
      "Viral diseases (Leaf roll, Mosaic)"
    ],
    cultivation_tips: [
      "Use certified seed tubers for planting (2-2.5 tons/ha)",
      "Pre-sprouting seed tubers improves emergence and yields",
      "Ridge planting with proper earthing up prevents greening",
      "Practice dehaulming (cutting plant tops) 10-15 days before harvest for better skin set",
      "Monitor for late blight during humid conditions",
      "Store seed potatoes in well-ventilated, cool, diffused light conditions"
    ],
    market_info: "High price volatility. Cold storage facilities crucial for off-season marketing. Major markets in Agra, Farrukhabad (UP), Hooghly (WB) and Jalandhar (Punjab). Processing industry growing for chips and french fries."
  },
  {
    id: "tomato",
    name: "Tomato (टमाटर)",
    image: "https://source.unsplash.com/random/600x400/?tomato,plant",
    description: "Tomato is one of the most important vegetable crops in India, grown year-round in different regions. It's a high-value crop that serves as a major source of vitamins and minerals.",
    varieties: ["Pusa Ruby", "Arka Vikas", "Arka Rakshak", "Pusa Hybrid-1", "NS-585"],
    seasons: ["Year-round (Different regions and seasons)", "Winter crop in plains", "Summer crop in hills"],
    regions: ["Andhra Pradesh", "Maharashtra", "Karnataka", "Madhya Pradesh", "Telangana", "Odisha"],
    water_requirements: "Medium (600-800 mm spread throughout growing season)",
    temperature: "20-27°C (day), 15-20°C (night)",
    soil_type: "Well-drained loamy soils rich in organic matter, pH 6.0-7.0",
    growth_period: "90-120 days from transplanting to final harvest",
    pests_diseases: [
      "Early Blight (Alternaria solani)",
      "Late Blight (Phytophthora infestans)",
      "Tomato Leaf Curl Virus (Transmitted by whitefly)",
      "Fruit Borer (Helicoverpa armigera)",
      "Root-knot Nematode (Meloidogyne spp.)"
    ],
    cultivation_tips: [
      "Nursery raising for 25-30 days before transplanting",
      "Staking or trellising improves quality and disease management",
      "Mulching conserves moisture and suppresses weeds",
      "Pruning of lower leaves and extra shoots improves air circulation",
      "Regular fungicide sprays during humid periods",
      "Use of yellow sticky traps for whitefly monitoring"
    ],
    market_info: "Highly volatile prices. Marketing through APMC mandis and directly to retailers. Growing demand from processing industry for puree, ketchup. Cold chain crucial for reducing post-harvest losses."
  }
];

const CropInfo = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCrops, setFilteredCrops] = useState(crops);
  const [selectedCrop, setSelectedCrop] = useState(crops[0]);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  useEffect(() => {
    const results = crops.filter(crop =>
      crop.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCrops(results);
  }, [searchTerm]);

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

        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-kisan-green dark:text-kisan-gold">
            Crop Information Database
          </h1>
          
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Access comprehensive information about major crops grown across India, including cultivation practices, varieties, and pest management.
          </p>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-kisan-green dark:focus:ring-kisan-gold"
              placeholder="Search for a crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-kisan-green dark:text-kisan-gold">
                    All Crops
                  </h3>
                  
                  <div className="space-y-2">
                    {filteredCrops.map(crop => (
                      <div 
                        key={crop.id}
                        className={`p-2 rounded-md cursor-pointer transition-colors ${
                          selectedCrop.id === crop.id 
                            ? 'bg-kisan-green text-white' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedCrop(crop)}
                      >
                        {crop.name}
                      </div>
                    ))}
                    
                    {filteredCrops.length === 0 && (
                      <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                        No crops matching your search.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              <Card>
                <CardContent className="p-6">
                  {selectedCrop && (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold text-kisan-green dark:text-kisan-gold">
                            {selectedCrop.name}
                          </h2>
                        </div>
                        
                        <div className="aspect-video rounded-lg overflow-hidden mb-4">
                          <img 
                            src={selectedCrop.image} 
                            alt={selectedCrop.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {selectedCrop.description}
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center">
                              <Thermometer className="h-4 w-4 text-kisan-green dark:text-kisan-gold mr-2" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Temperature</span>
                            </div>
                            <p className="mt-1 font-medium">{selectedCrop.temperature}</p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center">
                              <Droplets className="h-4 w-4 text-kisan-green dark:text-kisan-gold mr-2" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Water Needs</span>
                            </div>
                            <p className="mt-1 font-medium">{selectedCrop.water_requirements}</p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-kisan-green dark:text-kisan-gold mr-2" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Growth Period</span>
                            </div>
                            <p className="mt-1 font-medium">{selectedCrop.growth_period}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Tabs defaultValue="cultivation">
                        <TabsList className="grid grid-cols-4 mb-6">
                          <TabsTrigger value="cultivation">Cultivation</TabsTrigger>
                          <TabsTrigger value="varieties">Varieties</TabsTrigger>
                          <TabsTrigger value="pests">Pests & Diseases</TabsTrigger>
                          <TabsTrigger value="market">Market Info</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="cultivation" className="mt-0">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium mb-2 text-kisan-brown dark:text-kisan-gold-light">
                                Growing Seasons
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {selectedCrop.seasons.map((season, index) => (
                                  <span key={index} className="bg-kisan-green/10 text-kisan-green dark:bg-kisan-gold/10 dark:text-kisan-gold px-3 py-1 rounded-full text-sm">
                                    {season}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium mb-2 text-kisan-brown dark:text-kisan-gold-light">
                                Major Growing Regions
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {selectedCrop.regions.map((region, index) => (
                                  <span key={index} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
                                    {region}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium mb-2 text-kisan-brown dark:text-kisan-gold-light">
                                Soil Type
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300">
                                {selectedCrop.soil_type}
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium mb-2 text-kisan-brown dark:text-kisan-gold-light">
                                Cultivation Tips
                              </h3>
                              <ul className="space-y-2">
                                {selectedCrop.cultivation_tips.map((tip, index) => (
                                  <li key={index} className="flex">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                                    <span className="text-gray-600 dark:text-gray-300">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="varieties" className="mt-0">
                          <div>
                            <h3 className="text-lg font-medium mb-4 text-kisan-brown dark:text-kisan-gold-light">
                              Popular Varieties
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {selectedCrop.varieties.map((variety, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                  <h4 className="font-medium text-kisan-green dark:text-kisan-gold mb-1">
                                    {variety}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {index % 2 === 0 ? 'High yielding variety' : 'Disease resistant variety'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="pests" className="mt-0">
                          <div>
                            <h3 className="text-lg font-medium mb-4 text-kisan-brown dark:text-kisan-gold-light">
                              Common Pests & Diseases
                            </h3>
                            
                            <div className="space-y-4">
                              {selectedCrop.pests_diseases.map((pest, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                  <div className="flex items-start">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                      <h4 className="font-medium mb-1">{pest}</h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {index % 2 === 0 
                                          ? 'Early detection and proper fungicide/pesticide application is crucial for management.'
                                          : 'Implement cultural practices like crop rotation and resistant varieties for prevention.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="market" className="mt-0">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium mb-2 text-kisan-brown dark:text-kisan-gold-light">
                                Market Information
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300">
                                {selectedCrop.market_info}
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium mb-4 text-kisan-brown dark:text-kisan-gold-light">
                                Price Trends
                              </h3>
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center h-52">
                                <div className="flex flex-col items-center">
                                  <BarChart className="h-10 w-10 text-gray-400 mb-3" />
                                  <p className="text-gray-500 dark:text-gray-400 text-center">
                                    Historical price charts will be available in the next update.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CropInfo;
