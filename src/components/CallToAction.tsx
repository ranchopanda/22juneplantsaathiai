
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-gradient-to-r from-kisan-green-light to-kisan-green text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Transform Your Farming?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of farmers using AI to improve crop yields and increase profits.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-white text-kisan-green hover:bg-gray-100"
            onClick={() => navigate("/disease-detection")}
          >
            Start Using Now
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white/10"
            onClick={() => navigate("/about")}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
