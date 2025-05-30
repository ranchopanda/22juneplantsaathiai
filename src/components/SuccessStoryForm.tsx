import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  cropType: z.string().min(1, { message: "Please enter your crop type." }),
  successStory: z.string().min(20, { message: "Your success story must be at least 20 characters." }).max(500, { message: "Your story cannot exceed 500 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal("")),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).optional().or(z.literal(""))
});

type FormValues = z.infer<typeof formSchema>;

interface SuccessStoryFormProps {
  onClose?: () => void;
}

const SuccessStoryForm = ({ onClose }: SuccessStoryFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      cropType: "",
      successStory: "",
      email: "",
      phone: ""
    }
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Submitting success story:", data);
      
      // Show success toast
      toast({
        title: "Success Story Submitted",
        description: "Thank you for sharing your success story! It will be reviewed and published soon.",
      });
      
      // Reset form
      form.reset();
      setIsSubmitting(false);
      
      // Close the form if onClose is provided
      if (onClose) {
        onClose();
      }
    }, 1500);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-kisan-green dark:text-kisan-gold">Share Your Success Story</CardTitle>
        <CardDescription>
          Tell us how प्लांट साथी एआई has helped you improve your farming. Your story could inspire other farmers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rajesh Patel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pune, Maharashtra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="cropType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crop Type*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rice, Wheat, Cotton" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="successStory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Success Story*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us how our app helped you improve your farming..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="px-0">
              <div className="flex gap-2 w-full justify-end">
                {onClose && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Your Story"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SuccessStoryForm;
