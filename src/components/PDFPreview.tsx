import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiseaseReportData, PDFStyleOptions, generatePDF } from "@/utils/services/pdf/generatePDF";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { Text } from "@/components/ui/text";

interface PDFPreviewProps {
  data: DiseaseReportData;
  styleOptions?: PDFStyleOptions;
  onGenerate?: () => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  data,
  styleOptions,
  onGenerate,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [showPreview, setShowPreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validateData = (data: DiseaseReportData): string | null => {
    if (!data.cropName) return "Crop name is required";
    if (!data.diseaseName) return "Disease name is required";
    if (!data.confidence) return "Confidence score is required";
    if (!data.symptoms?.length) return "At least one symptom is required";
    if (!data.immediateAction) return "Immediate action is required";
    if (!data.shortTermPlan) return "Short-term plan is required";
    if (!data.organicTreatment) return "Organic treatment is required";
    if (!data.chemicalTreatment) return "Chemical treatment is required";
    return null;
  };

  const handleGenerate = async () => {
    try {
      // Validate data
      const validationError = validateData(data);
      if (validationError) {
        setError(validationError);
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      setError(null);
      setIsGenerating(true);
      setProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await generatePDF(data, styleOptions);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      toast({
        title: "Success!",
        description: "PDF has been generated successfully.",
      });
      onGenerate?.();
    } catch (error) {
      console.error("PDF Generation Error:", error);
      setError(error instanceof Error ? error.message : "Failed to generate PDF");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🧠</span> PDF Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Header Preview */}
            <div className="border-b pb-4">
              <Text style={styles.title}>Plant Saathi AI Report</Text>
              <div className="text-gray-600 mt-2">
                <p>📅 Date: {new Date().toLocaleDateString("en-IN")}</p>
                <p>🌱 Crop: {data.cropName}</p>
              </div>
            </div>

            {/* Disease Summary */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-green-700 text-white">
                  <tr>
                    <th className="p-2">Disease</th>
                    <th className="p-2">Confidence</th>
                    <th className="p-2">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center">
                    <td className="p-2">{data.diseaseName}</td>
                    <td className="p-2">{data.confidence}%</td>
                    <td className="p-2">Moderate</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disease Image */}
            {data.imageUrl && (
              <div className="border rounded-lg p-4">
                <img
                  src={data.imageUrl}
                  alt="Disease"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* Symptoms */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">🧬 Symptoms</h3>
              <ul className="list-disc pl-5 space-y-1">
                {data.symptoms.map((symptom, index) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            </div>

            {/* Action Plan */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-red-600">
                  🚨 Immediate Action
                </h3>
                <p className="mt-1">{data.immediateAction}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-500">
                  📆 Short-Term Plan
                </h3>
                <p className="mt-1">{data.shortTermPlan}</p>
              </div>
            </div>

            {/* Treatment Options */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  🌿 Organic Treatment
                </h3>
                <p className="mt-1">{data.organicTreatment}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-600">
                  🧪 Chemical Treatment
                </h3>
                <p className="mt-1">{data.chemicalTreatment}</p>
              </div>
            </div>

            {/* QR Code Preview */}
            {data.reportId && (
              <div className="border rounded-lg p-4 flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR Code</span>
                </div>
                <p className="text-sm text-gray-600">
                  Scan for digital report access
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-500 text-center">
                  Generating PDF... {progress}%
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Download PDF"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <PDFPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        data={data}
        onDownload={handleGenerate}
      />
    </>
  );
}; 