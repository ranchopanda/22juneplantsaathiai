import { useState } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "Rajesh Patel",
    location: "Gujarat",
    quote: "प्लांट साथी एआई ने मेरी फसल को बीमारियों से बचाने में मदद की। मैं अपने मोबाइल से ही फसल की बीमारी का पता लगा लेता हूं।",
    crop: "Cotton",
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: 2,
    name: "Lakshmi Devi",
    location: "Tamil Nadu",
    quote: "I was able to identify a disease early in my rice crop that I had never seen before. The app gave me exact treatment steps, saving my entire harvest.",
    crop: "Rice",
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    id: 3,
    name: "Gurpreet Singh",
    location: "Punjab",
    quote: "The weather alerts helped me plan my wheat harvesting perfectly this season. I avoided losses that many other farmers in my village faced.",
    crop: "Wheat",
    image: "https://randomuser.me/api/portraits/men/68.jpg"
  }
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
  
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-kisan-green dark:text-kisan-gold">
            Farmers' Success Stories
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Hear from farmers across India who have transformed their farming with our AI assistant.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="md:flex items-stretch">
            <div className="md:w-1/3 bg-kisan-green">
              <div className="h-full p-6 flex flex-col justify-center items-center text-white">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-white">
                  <img 
                    src={testimonials[currentIndex].image} 
                    alt={testimonials[currentIndex].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1">{testimonials[currentIndex].name}</h3>
                <p className="text-kisan-gold text-sm mb-2">{testimonials[currentIndex].location}</p>
                <p className="text-white/80 text-sm">{testimonials[currentIndex].crop} Farmer</p>
              </div>
            </div>
            
            <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <Quote className="h-8 w-8 text-kisan-green/20 dark:text-kisan-gold/20 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 italic mb-6">
                  "{testimonials[currentIndex].quote}"
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentIndex + 1} of {testimonials.length}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={prevTestimonial}
                    className="rounded-full border-kisan-green dark:border-kisan-gold"
                  >
                    <ArrowLeft className="h-4 w-4 text-kisan-green dark:text-kisan-gold" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextTestimonial}
                    className="rounded-full border-kisan-green dark:border-kisan-gold"
                  >
                    <ArrowRight className="h-4 w-4 text-kisan-green dark:text-kisan-gold" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
