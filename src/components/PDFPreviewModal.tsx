import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DiseaseReportData } from "@/utils/services/pdf/generatePDF";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DiseaseReportData;
  onDownload: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  onDownload,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>PDF Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 bg-white p-8 rounded-lg shadow-sm">
            {/* Header */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-green-700">
                Plant Saathi AI Report
              </h2>
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
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onDownload}>Download PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 