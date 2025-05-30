import { DetectionResult } from "@/types/DetectionResult";
import { 
  AlertTriangle, 
  ExternalLink, 
  Leaf, 
  Activity, 
  Calendar, 
  Droplet, 
  Flame, 
  Download, 
  Share2, 
  Clock, 
  FlaskConical,
  VolumeX,
  Volume2,
  Redo,
  CheckCircle,
  Info,
  Shield,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { generatePDF, DiseaseReportData } from "@/utils/services/pdf/generatePDF";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResultsProps {
  result: DetectionResult;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  // Get confidence color based on percentage
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get severity color based on level
  const getSeverityColor = (severity: string): string => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('advanced') || severityLower.includes('high') || severityLower.includes('severe')) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    if (severityLower.includes('moderate') || severityLower.includes('medium')) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    }
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  };

  // Download as PDF
  const downloadPDF = async () => {
    try {
      const reportData: DiseaseReportData = {
        cropName: result.crop_name || "Unknown Crop",
        diseaseName: result.disease_name || "Unknown Disease",
        confidence: result.confidence || 0,
        symptoms: result.symptoms || [],
        immediateAction: result.immediate_action || "No immediate action specified",
        shortTermPlan: result.short_term_plan || "No short-term plan specified",
        organicTreatment: result.organic_treatment || "No organic treatment specified",
        chemicalTreatment: result.chemical_treatment || "No chemical treatment specified",
        imageUrl: result.image_url,
        reportId: result.id
      };

      await generatePDF(reportData);
      
      toast({
        title: "Success!",
        description: "PDF has been generated successfully.",
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const message = `Plant Disease Detection Result: ${result.disease_name} - ${result.confidence}% confidence. `;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Text to speech function for summary
  const speakSummary = () => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis not supported in your browser");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const summary = `Disease detected: ${result.disease_name} with ${result.confidence}% confidence. 
                     Symptoms include ${result.symptoms[0]}. 
                     For immediate action, ${result.action_plan[1]}`;

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      {/* Language Toggle and Download/Share Options */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <CheckCircle className="text-green-600 dark:text-green-400 mr-2 h-5 w-5" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">AI Verified Results</span>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          >
            {language === 'en' ? 'हिंदी' : 'English'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={speakSummary}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isSpeaking ? 'Stop' : 'Listen'}
          </Button>
        </div>
      </div>

      {/* Disease Information Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-kisan-green dark:text-kisan-gold">
            <Activity className="mr-2 h-5 w-5" />
            {language === 'en' ? 'Disease Information' : 'रोग जानकारी'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{result.disease_name}</h3>
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    {language === 'en' ? 'Confidence' : 'विश्वास स्तर'}: {result.confidence}%
                  </span>
                  <span className="text-sm font-medium">
                    {result.confidence >= 80 ? 'High' : result.confidence >= 60 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <Progress 
                  value={result.confidence} 
                  className={`h-2 ${getConfidenceColor(result.confidence)}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={getSeverityColor(result.disease_stage)}>
                {language === 'en' ? 'Stage' : 'अवस्था'}: {result.disease_stage}
              </Badge>

              {result.yield_impact && (
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {language === 'en' ? 'Yield Impact' : 'उपज प्रभाव'}: {result.yield_impact}
                </Badge>
              )}
              
              {result.spread_risk && (
                <Badge variant="outline" className={getSeverityColor(result.spread_risk)}>
                  {language === 'en' ? 'Spread Risk' : 'फैलने का खतरा'}: {result.spread_risk}
                </Badge>
              )}
              
              {result.recovery_chance && (
                <Badge variant="outline" className={getSeverityColor(result.recovery_chance)}>
                  {language === 'en' ? 'Recovery' : 'रिकवरी'}: {result.recovery_chance}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptoms Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-kisan-green dark:text-kisan-gold">
            <Leaf className="mr-2 h-5 w-5" />
            {language === 'en' ? 'Symptoms' : 'लक्षण'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1">
            {result.symptoms && result.symptoms.map((symptom, index) => (
              <li key={index} className="text-sm">{symptom}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Plan Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-kisan-green dark:text-kisan-gold">
            <Calendar className="mr-2 h-5 w-5" />
            {language === 'en' ? 'Action Plan' : 'कार्य योजना'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.action_plan && result.action_plan.map((action, index) => {
              // Skip section headers
              if (action.includes("IMMEDIATE ACTIONS") || action.includes("SHORT-TERM") || action.includes("LONG-TERM")) {
                return (
                  <h4 key={index} className="font-semibold text-sm mt-4 text-gray-700 dark:text-gray-300">
                    {action}
                  </h4>
                );
              }
              
              let actionBadge = null;
              let iconComponent = null;
              
              // Determine the badge and icon based on context
              if (index > 0 && result.action_plan[index-1].includes("IMMEDIATE")) {
                actionBadge = <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Urgent</Badge>;
                iconComponent = <Flame className="h-4 w-4 mr-2 text-red-600 dark:text-red-400 flex-shrink-0" />;
              } else if (index > 0 && result.action_plan[index-1].includes("SHORT-TERM")) {
                actionBadge = <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Soon</Badge>;
                iconComponent = <Clock className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />;
              } else if (index > 0 && result.action_plan[index-1].includes("LONG-TERM")) {
                actionBadge = <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Future</Badge>;
                iconComponent = <Calendar className="h-4 w-4 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />;
              }
              
              if (!actionBadge) return null;
              
              return (
                <div key={index} className="flex items-start">
                  {iconComponent}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {actionBadge}
                    </div>
                    <p className="text-sm ml-0.5">{action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Treatments Card */}
      {result.treatments && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-kisan-green dark:text-kisan-gold">
              <FlaskConical className="mr-2 h-5 w-5" />
              {language === 'en' ? 'Treatments' : 'उपचार'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Organic Treatments */}
              {result.treatments.organic && result.treatments.organic.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center">
                    <Leaf className="h-4 w-4 mr-1" />
                    {language === 'en' ? 'Organic Treatment' : 'जैविक उपचार'}
                  </h4>
                  <ul className="mt-2 space-y-1">
                    {result.treatments.organic.map((treatment, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="mr-2">•</span>
                        <span>{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Chemical Treatments with Safety Alert */}
              {result.treatments.chemical && result.treatments.chemical.length > 0 && (
                <div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center">
                      <Droplet className="h-4 w-4 mr-1" />
                      {language === 'en' ? 'Chemical Treatment' : 'रासायनिक उपचार'}
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {result.treatments.chemical.map((treatment, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="mr-2">•</span>
                          <span>{treatment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Safety Alert Box */}
                  <Alert className="mt-2 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-800 dark:text-amber-300" />
                    <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 ml-2">
                      {language === 'en' 
                        ? 'Use gloves and mask when applying chemicals. Apply in early morning or evening for best results. Keep children and pets away from treated areas.'
                        : 'रसायन लगाते समय दस्ताने और मास्क का प्रयोग करें। सुबह या शाम को लगाएं। बच्चों और पालतू जानवरों को उपचारित क्षेत्रों से दूर रखें।'}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* YouTube Video Recommendations */}
      {result.recommended_videos && result.recommended_videos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-kisan-green dark:text-kisan-gold">
              <span className="mr-2">🎥</span>
              {language === 'en' ? 'YouTube Videos in Hindi' : 'हिंदी में यूट्यूब वीडियो'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.recommended_videos.map((video, index) => (
                <div key={index} className="bg-red-50 dark:bg-red-900/20 rounded-lg overflow-hidden border border-red-100 dark:border-red-900/50">
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{video}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <a 
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                      >
                        Watch on YouTube <ExternalLink size={12} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Download and Share Buttons */}
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-1 text-sm"
          onClick={downloadPDF}
        >
          <Download className="h-4 w-4" />
          {language === 'en' ? 'Download PDF' : 'पीडीएफ डाउनलोड करें'}
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-1 text-sm text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-900/20"
          onClick={shareViaWhatsApp}
        >
          <Share2 className="h-4 w-4" />
          {language === 'en' ? 'Share on WhatsApp' : 'व्हाट्सएप पर शेयर करें'}
        </Button>
      </div>
      
      {/* Re-analyze Button */}
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-1 text-sm mt-2 border-dashed"
        onClick={() => {
          // This would reset the analysis state in the parent component
          // Since we can't directly access that state from here, this is a placeholder
          alert("This would trigger re-analysis with a new image");
        }}
      >
        <Redo className="h-4 w-4" />
        {language === 'en' ? 'Re-analyze with different image' : 'अलग छवि के साथ फिर से विश्लेषण करें'}
      </Button>
    </div>
  );
};
