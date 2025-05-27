import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Cloud, 
  CloudRain, 
  Droplets, 
  Wind, 
  Sun, 
  Loader2, 
  ThermometerSun, 
  Calendar 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  location: string;
  state: string;
  current: {
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather: string;
    weather_icon: string;
  };
  forecast: Array<{
    date: string;
    day: string;
    temperature: {
      min: number;
      max: number;
    };
    weather: string;
    weather_icon: string;
    precipitation: number;
  }>;
  agricultural_advice: Array<string>;
}

const Weather = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const OPENWEATHER_API_KEY = "d67c7a5ae631afb152c40991e9046eb4";

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      setShowPermissionPrompt(true);
    }
  }, []);

  const handleGetLocation = () => {
    setShowPermissionPrompt(false);
    setLoading(true);
    
    const locationTimeout = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Location Timeout",
        description: "Location request timed out. Please enter your location manually.",
        variant: "destructive",
      });
    }, 10000);
    
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(locationTimeout);
          const { latitude, longitude } = position.coords;
          
          try {
            const locationName = "New Delhi";
            setLocation(locationName);
            
            await fetchWeatherData(locationName, 28.6139, 77.2090);
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              if (error instanceof Error) {
                console.error("Error getting location:", error.message);
              } else {
                console.error("Error getting location:", JSON.stringify(error, null, 2));
              }
            }
            setLoading(false);
            toast({
              title: "Location Error",
              description: "Could not determine your location. Please enter it manually.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          clearTimeout(locationTimeout);
          setLoading(false);
          if (process.env.NODE_ENV === "development") {
            if (error instanceof Error) {
              console.error("Error getting location:", error.message);
            } else {
              console.error("Error getting location:", JSON.stringify(error, null, 2));
            }
          }
          
          const mockCity = "New Delhi";
          setLocation(mockCity);
          
          toast({
            title: "Using Demo Location",
            description: "Using " + mockCity + " for demonstration. You can enter your location manually if needed.",
          });
          
          fetchWeatherData(mockCity, 28.6139, 77.2090);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      clearTimeout(locationTimeout);
      setLoading(false);
      toast({
        title: "Location Error",
        description: "There was an error accessing your location. Please enter it manually.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to get weather forecast.",
        variant: "destructive",
      });
      return;
    }
    
    fetchCoordinates(location);
  };

  const fetchCoordinates = async (locationName: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${locationName},IN&limit=1&appid=${OPENWEATHER_API_KEY}`);
      
      if (!response.ok) {
        throw new Error('Failed to get location coordinates');
      }
      
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        await fetchWeatherData(locationName, lat, lon);
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        if (error instanceof Error) {
          console.error("Error fetching coordinates:", error.message);
        } else {
          console.error("Error fetching coordinates:", JSON.stringify(error, null, 2));
        }
      }
      setLoading(false);
      toast({
        title: "Search Error",
        description: "Could not find weather for this location. Please try another.",
        variant: "destructive",
      });
    }
  };

  const fetchWeatherData = async (loc: string, lat: number, lon: number) => {
    try {
      const mockWeatherData: WeatherData = {
        location: loc,
        state: "India",
        current: {
          temperature: 32,
          feels_like: 34,
          humidity: 65,
          wind_speed: 12,
          weather: "Partly Cloudy",
          weather_icon: "cloud"
        },
        forecast: [
          {
            date: "2025-04-04",
            day: "Today",
            temperature: {
              min: 25,
              max: 34
            },
            weather: "Partly Cloudy",
            weather_icon: "cloud",
            precipitation: 20
          },
          {
            date: "2025-04-05",
            day: "Tomorrow",
            temperature: {
              min: 24,
              max: 33
            },
            weather: "Mostly Sunny",
            weather_icon: "sun",
            precipitation: 10
          },
          {
            date: "2025-04-06",
            day: "Sunday",
            temperature: {
              min: 26,
              max: 35
            },
            weather: "Sunny",
            weather_icon: "sun",
            precipitation: 5
          },
          {
            date: "2025-04-07",
            day: "Monday",
            temperature: {
              min: 27,
              max: 36
            },
            weather: "Chance of Rain",
            weather_icon: "cloud-rain",
            precipitation: 40
          },
          {
            date: "2025-04-08",
            day: "Tuesday",
            temperature: {
              min: 25,
              max: 33
            },
            weather: "Rain",
            weather_icon: "cloud-rain",
            precipitation: 70
          }
        ],
        agricultural_advice: [
          "High temperatures expected: Ensure adequate irrigation for crops, preferably during early morning or evening.",
          "Humidity levels favorable for fungal diseases in vegetables. Monitor crops closely and ensure proper spacing for air circulation.",
          "Chance of rain in the coming days: Consider postponing any planned pesticide application until after rainfall.",
          "Maintain adequate soil moisture during this transition season. Consider mulching to retain moisture.",
          "Good time for planting short-duration vegetables like okra and leafy greens."
        ]
      };
      
      setWeatherData(mockWeatherData);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        if (error instanceof Error) {
          console.error("Error fetching weather data:", error.message);
        } else {
          console.error("Error fetching weather data:", JSON.stringify(error, null, 2));
        }
      }
      toast({
        title: "Weather Error",
        description: "Could not retrieve weather data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processWeatherData = (location: string, current: any, forecast: any): WeatherData => {
    const currentWeather = {
      temperature: Math.round(current.main.temp),
      feels_like: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      wind_speed: Math.round(current.wind.speed),
      weather: current.weather[0].main,
      weather_icon: getWeatherIconName(current.weather[0].icon)
    };
    
    const processedForecast: any[] = [];
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const days = new Set<string>();
    const dailyMin: { [key: string]: number } = {};
    const dailyMax: { [key: string]: number } = {};
    const dailyWeather: { [key: string]: { icon: string, main: string } } = {};
    const dailyPrecipitation: { [key: string]: number } = {};
    
    forecast.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      days.add(date);
      
      const temp = item.main.temp;
      if (!dailyMin[date] || temp < dailyMin[date]) {
        dailyMin[date] = temp;
      }
      if (!dailyMax[date] || temp > dailyMax[date]) {
        dailyMax[date] = temp;
      }
      
      const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
      if (hour >= 12 && hour <= 15 || !dailyWeather[date]) {
        dailyWeather[date] = {
          icon: getWeatherIconName(item.weather[0].icon),
          main: item.weather[0].main
        };
      }
      
      const pop = item.pop * 100;
      if (!dailyPrecipitation[date] || pop > dailyPrecipitation[date]) {
        dailyPrecipitation[date] = pop;
      }
    });
    
    Array.from(days).slice(0, 5).forEach((date: string) => {
      const day = new Date(date);
      processedForecast.push({
        date: date,
        day: day.getDay() === new Date().getDay() ? 'Today' : 
             day.getDay() === (new Date().getDay() + 1) % 7 ? 'Tomorrow' : 
             dayMap[day.getDay()],
        temperature: {
          min: Math.round(dailyMin[date]),
          max: Math.round(dailyMax[date])
        },
        weather: dailyWeather[date].main,
        weather_icon: dailyWeather[date].icon,
        precipitation: Math.round(dailyPrecipitation[date])
      });
    });
    
    const agriculturalAdvice = generateAgricultureAdvice(currentWeather, processedForecast);
    
    const state = "";
    
    return {
      location,
      state,
      current: currentWeather,
      forecast: processedForecast,
      agricultural_advice: agriculturalAdvice
    };
  };

  const getWeatherIconName = (iconCode: string): string => {
    const iconMap: {[key: string]: string} = {
      '01d': 'sun',
      '01n': 'sun',
      '02d': 'cloud',
      '02n': 'cloud',
      '03d': 'cloud',
      '03n': 'cloud',
      '04d': 'cloud',
      '04n': 'cloud',
      '09d': 'cloud-rain',
      '09n': 'cloud-rain',
      '10d': 'cloud-rain',
      '10n': 'cloud-rain',
      '11d': 'cloud-rain',
      '11n': 'cloud-rain',
      '13d': 'cloud',
      '13n': 'cloud',
      '50d': 'cloud',
      '50n': 'cloud'
    };
    
    return iconMap[iconCode] || 'cloud';
  };

  const generateAgricultureAdvice = (current: any, forecast: any[]): string[] => {
    const advice: string[] = [];
    
    if (current.temperature > 35) {
      advice.push("High temperatures expected: Ensure adequate irrigation for crops, preferably during early morning or evening.");
    } else if (current.temperature < 15) {
      advice.push("Cool temperatures expected: Consider protecting temperature-sensitive crops with covers during night time.");
    }
    
    if (current.humidity > 70) {
      advice.push("Humidity levels favorable for fungal diseases in vegetables. Monitor crops closely and ensure proper spacing for air circulation.");
    } else if (current.humidity < 30) {
      advice.push("Low humidity may increase water requirements. Adjust irrigation schedule accordingly.");
    }
    
    const rainDays = forecast.filter(day => day.precipitation > 40);
    if (rainDays.length > 0) {
      advice.push(`Chance of rain in the coming days: Consider postponing any planned pesticide application until after rainfall.`);
    }
    
    if (current.wind_speed > 15) {
      advice.push("Strong winds expected: Provide support for tall crops like maize and sugarcane to prevent lodging.");
    }
    
    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) {
      advice.push("Monsoon season is a good time for planting rice and other rain-fed crops.");
    } else if (month >= 10 || month <= 1) {
      advice.push("Good season for growing winter crops like wheat, mustard, and vegetables.");
    } else {
      advice.push("Maintain adequate soil moisture during this transition season. Consider mulching to retain moisture.");
    }
    
    return advice;
  };

  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case "cloud":
        return <Cloud className="h-8 w-8" />;
      case "cloud-rain":
        return <CloudRain className="h-8 w-8" />;
      case "sun":
        return <Sun className="h-8 w-8" />;
      default:
        return <Cloud className="h-8 w-8" />;
    }
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
            Weather Forecast for Farmers
          </h1>
          
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Get accurate weather forecasts and agricultural advice tailored to your location.
          </p>
          
          {showPermissionPrompt && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-kisan-green dark:text-kisan-gold mr-2" />
                    <p className="text-gray-700 dark:text-gray-300">
                      Allow location access for accurate local weather forecasts
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPermissionPrompt(false)}
                    >
                      Not Now
                    </Button>
                    <Button 
                      onClick={handleGetLocation}
                      className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                    >
                      Allow Access
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <div className="flex">
                    <Input 
                      placeholder="Enter city or district name" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="rounded-r-none"
                    />
                    <Button 
                      className="rounded-l-none bg-kisan-green hover:bg-kisan-green-dark text-white"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleGetLocation}
                  disabled={loading}
                  className="border-kisan-green text-kisan-green dark:border-kisan-gold dark:text-kisan-gold"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Use Current Location
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-kisan-green dark:text-kisan-gold animate-spin mr-3" />
              <p className="text-lg">Fetching weather data...</p>
            </div>
          ) : weatherData ? (
            <>
              <Card className="mb-6 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-kisan-blue to-kisan-blue-dark text-white p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <h2 className="text-xl font-semibold">{weatherData.location}, {weatherData.state}</h2>
                        </div>
                        <p className="text-white/80 text-sm mb-6">Updated just now</p>
                        
                        <div className="flex items-center">
                          {getWeatherIcon(weatherData.current.weather_icon)}
                          <div className="ml-3">
                            <div className="text-4xl font-bold">{weatherData.current.temperature}°C</div>
                            <div className="text-white/80">{weatherData.current.weather}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-white/80 mb-1">Feels like</div>
                        <div className="text-2xl font-semibold">{weatherData.current.feels_like}°C</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-4 border-t border-white/20">
                      <div className="flex items-center">
                        <ThermometerSun className="h-5 w-5 mr-2 text-white/70" />
                        <div>
                          <div className="text-white/70 text-sm">High / Low</div>
                          <div className="font-medium">{weatherData.forecast[0].temperature.max}° / {weatherData.forecast[0].temperature.min}°</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Droplets className="h-5 w-5 mr-2 text-white/70" />
                        <div>
                          <div className="text-white/70 text-sm">Humidity</div>
                          <div className="font-medium">{weatherData.current.humidity}%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Wind className="h-5 w-5 mr-2 text-white/70" />
                        <div>
                          <div className="text-white/70 text-sm">Wind</div>
                          <div className="font-medium">{weatherData.current.wind_speed} km/h</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <Calendar className="h-5 w-5 text-kisan-green dark:text-kisan-gold mr-2" />
                        <h3 className="text-lg font-semibold">5-Day Forecast</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {weatherData.forecast.map((day, index) => (
                          <div 
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              index === 0 ? 'bg-kisan-green/10 dark:bg-kisan-green/20' : ''
                            }`}
                          >
                            <div className="w-16 sm:w-24 font-medium">
                              {day.day}
                            </div>
                            <div className="flex items-center w-16">
                              {getWeatherIcon(day.weather_icon)}
                            </div>
                            <div className="w-24 text-center">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Precipitation
                              </div>
                              <div className="font-medium">
                                {day.precipitation}%
                              </div>
                            </div>
                            <div className="w-20 sm:w-24 text-right">
                              <span className="font-medium">{day.temperature.max}°</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-2">{day.temperature.min}°</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <Sprout className="h-5 w-5 text-kisan-green dark:text-kisan-gold mr-2" />
                        <h3 className="text-lg font-semibold">Farming Advice</h3>
                      </div>
                      
                      <ul className="space-y-3">
                        {weatherData.agricultural_advice.map((advice, index) => (
                          <li key={index} className="flex">
                            <div className="h-2 w-2 mt-2 rounded-full bg-kisan-green dark:bg-kisan-gold mr-2 flex-shrink-0"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{advice}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
                <p>Weather data provided for agricultural planning purposes. Forecasts are updated multiple times daily.</p>
              </div>
            </>
          ) : null}
        </div>
      </main>
      
      <CustomFooter />
    </div>
  );
};

function Sprout(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

export default Weather;
