import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export interface DiseaseReportData {
  cropName: string;
  diseaseName: string;
  confidence: number;
  symptoms: string[];
  immediateAction: string;
  shortTermPlan: string;
  organicTreatment: string;
  chemicalTreatment: string;
  imageUrl?: string;
  reportId?: string;
  stage?: string;
  severity?: string;
  spreadRisk?: string;
  recoveryChance?: string;
}

export interface PDFStyleOptions {
  primaryColor?: [number, number, number];
  secondaryColor?: [number, number, number];
  accentColor?: [number, number, number];
  warningColor?: [number, number, number];
  fontFamily?: string;
  showQRCode?: boolean;
  showImages?: boolean;
  language?: 'en' | 'hi';
}

const DEFAULT_STYLES: PDFStyleOptions = {
  primaryColor: [40, 120, 60],
  secondaryColor: [80, 80, 80],
  accentColor: [30, 144, 255],
  warningColor: [200, 60, 60],
  fontFamily: "helvetica",
  showQRCode: true,
  showImages: true,
  language: 'en'
};

export class PDFGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PDFGenerationError";
  }
}

const TRANSLATIONS = {
  en: {
    title: "Plant Saathi AI Report",
    date: "Date",
    crop: "Crop",
    disease: "Disease",
    confidence: "Confidence",
    stage: "Stage",
    symptoms: "Symptoms",
    immediateAction: "Immediate Action",
    shortTermPlan: "Short-Term Plan",
    organicTreatment: "Organic Treatment",
    chemicalTreatment: "Chemical Treatment",
    severity: "Severity",
    spreadRisk: "Spread Risk",
    recoveryChance: "Recovery Chance",
    disclaimer: "This report is generated by Plant Saathi AI engine for informational purposes only.",
    scanQR: "Scan for digital report access"
  },
  hi: {
    title: "प्लांट साथी एआई रिपोर्ट",
    date: "तारीख",
    crop: "फसल",
    disease: "रोग",
    confidence: "विश्वास",
    stage: "अवस्था",
    symptoms: "लक्षण",
    immediateAction: "तत्काल कार्रवाई",
    shortTermPlan: "अल्पकालिक योजना",
    organicTreatment: "जैविक उपचार",
    chemicalTreatment: "रासायनिक उपचार",
    severity: "गंभीरता",
    spreadRisk: "फैलने का खतरा",
    recoveryChance: "पुनर्प्राप्ति की संभावना",
    disclaimer: "यह रिपोर्ट केवल सूचनात्मक उद्देश्यों के लिए प्लांट साथी एआई इंजन द्वारा तैयार की गई है।",
    scanQR: "डिजिटल रिपोर्ट के लिए स्कैन करें"
  }
};

const LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGc+PHBhdGggZD0iTTYwLDE2MCBDNjAsODAgMTgwLDgwIDE4MCwxNjAgQzE4MCwyNDAgMzAwLDI0MCAzMDAsMTYwIEMzMDAsODAgMTgwLDgwIDE4MCwxNjAgQzE4MCwyNDAgNjAsMjQwIDYwLDE2MCBaIiBzdHJva2U9IiMyMTkxNTAiIHN0cm9rZS13aWR0aD0iMTYiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNjAsMTYwIEM2MCw4MCAxODAsODAgMTgwLDE2MCIgc3Ryb2tlPSIjNkZDRjk3IiBzdHJva2Utd2lkdGg9IjE2IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTE4MCwxNjAgQzE4MCwyNDAgMzAwLDI0MCAzMDAsMTYwIiBzdHJva2U9IiM2RkNGOTciIHN0cm9rZS13aWR0aD0iMTYiIGZpbGw9Im5vbmUiLz48ZWxsaXBzZSBjeD0iNjAiIGN5PSIxNjAiIHJ4PSIxMiIgcnk9IjYiIGZpbGw9IiMyMTkxNTAiIHRyYW5zZm9ybT0icm90YXRlKC0yMCA2MCAxNjApIi8+PGVsbGlwc2UgY3g9IjE4MCIgY3k9IjgwIiByeD0iMTAiIHJ5PSI1IiBmaWxsPSIjMjE5MTUwIiB0cmFuc2Zvcm09InJvdGF0ZSgxMCAxODAgODApIi8+PGVsbGlwc2UgY3g9IjMwMCIgY3k9IjE2MCIgcng9IjEyIiByeT0iNiIgZmlsbD0iIzIxOTE1MCIgdHJhbnNmb3JtPSJyb3RhdGUoMjAgMzAwIDE2MCkiLz48ZWxsaXBzZSBjeD0iMTgwIiBjeT0iMjQwIiByeD0iMTAiIHJ5PSI1IiBmaWxsPSIjMjE5MTUwIiB0cmFuc2Zvcm09InJvdGF0ZSgtMTAgMTgwIDI0MCkiLz48ZWxsaXBzZSBjeD0iMTIwIiBjeT0iMTIwIiByeD0iNyIgcnk9IjMuNSIgZmlsbD0iIzZGQ0Y5NyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE1IDEyMCAxMjApIi8+PGVsbGlwc2UgY3g9IjI0MCIgY3k9IjIwMCIgcng9IjciIHJ5PSIzLjUiIGZpbGw9IiM2RkNGOTciIHRyYW5zZm9ybT0icm90YXRlKDE1IDI0MCAyMDApIi8+PHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmaWxsPSIjMjE5MTUwIiBmb250LXdlaWdodD0iYm9sZCI+QUk8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSIyOTAiIGZvbnQtc2l6ZT0iMzYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmaWxsPSIjMjE5MTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGFudCBTYWF0aGk8L3RleHQ+PC9nPjwvc3ZnPg==`;

export const generatePDF = async (
  data: DiseaseReportData,
  styleOptions: PDFStyleOptions = {}
) => {
  try {
    const styles = { ...DEFAULT_STYLES, ...styleOptions };
    const t = TRANSLATIONS[styles.language || 'en'];
    
    const {
      cropName,
      diseaseName,
      confidence,
      symptoms,
      immediateAction,
      shortTermPlan,
      organicTreatment,
      chemicalTreatment,
      imageUrl,
      reportId,
      stage = "Moderate",
      severity,
      spreadRisk,
      recoveryChance
    } = data;

    const doc = new jsPDF();
    doc.setFont(styles.fontFamily!);

    // Add logo at the top left
    doc.addImage(LOGO_BASE64, 'SVG', 10, 8, 28, 28);

    const today = new Date().toLocaleDateString("en-IN");

    // 🌿 Header
    doc.setFontSize(20);
    doc.setTextColor(...styles.primaryColor!);
    doc.text(t.title, 15, 20);

    doc.setFontSize(12);
    doc.setTextColor(...styles.secondaryColor!);
    doc.text(`${t.date}: ${today}`, 15, 28);
    doc.text(`${t.crop}: ${cropName}`, 15, 34);

    // 📊 Disease Summary
    autoTable(doc, {
      startY: 40,
      head: [[t.disease, t.confidence, t.stage]],
      body: [[diseaseName, `${confidence}%`, stage]],
      headStyles: { fillColor: styles.primaryColor },
      styles: { fontStyle: "bold", halign: "center" },
    });

    // Additional Metrics
    if (severity || spreadRisk || recoveryChance) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        body: [
          severity ? [t.severity, severity] : [],
          spreadRisk ? [t.spreadRisk, spreadRisk] : [],
          recoveryChance ? [t.recoveryChance, recoveryChance] : []
        ].filter(row => row.length > 0),
        styles: { fontSize: 10 },
        theme: 'grid'
      });
    }

    // 🖼️ Disease Image (if available)
    if (imageUrl && styles.showImages) {
      try {
        const img = await loadImage(imageUrl);
        const imgWidth = 100;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, "JPEG", 15, doc.lastAutoTable.finalY + 10, imgWidth, imgHeight);
        doc.lastAutoTable.finalY += imgHeight + 10;
      } catch (error) {
        console.warn("Failed to load image:", error);
      }
    }

    // 🧪 Symptoms
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(t.symptoms, 15, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(11);
    symptoms.forEach((symptom, i) => {
      doc.text(`• ${symptom}`, 20, doc.lastAutoTable.finalY + 18 + i * 6);
    });

    // 🛠️ Action Plan
    const actionStartY = doc.lastAutoTable.finalY + 18 + symptoms.length * 6 + 10;
    doc.setFontSize(14);
    doc.setTextColor(...styles.warningColor!);
    doc.text(t.immediateAction, 15, actionStartY);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(immediateAction, 20, actionStartY + 8);

    doc.setFontSize(14);
    doc.setTextColor(255, 165, 0);
    doc.text(t.shortTermPlan, 15, actionStartY + 22);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(shortTermPlan, 20, actionStartY + 30);

    // 🌿 Treatment Options
    const treatmentStartY = actionStartY + 45;
    doc.setFontSize(14);
    doc.setTextColor(34, 139, 34);
    doc.text(t.organicTreatment, 15, treatmentStartY);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(organicTreatment, 20, treatmentStartY + 8);

    doc.setFontSize(14);
    doc.setTextColor(...styles.accentColor!);
    doc.text(t.chemicalTreatment, 15, treatmentStartY + 22);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(chemicalTreatment, 20, treatmentStartY + 30);

    // 📱 QR Code (if enabled)
    if (styles.showQRCode && reportId) {
      try {
        const qrData = await QRCode.toDataURL(`https://plantsaathi.ai/reports/${reportId}`);
        doc.addImage(qrData, "PNG", 15, 250, 30, 30);
        doc.setFontSize(8);
        doc.setTextColor(...styles.secondaryColor!);
        doc.text(t.scanQR, 50, 265);
      } catch (error) {
        console.warn("Failed to generate QR code:", error);
      }
    }

    // ⚠️ Footer
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(t.disclaimer, 15, 285);

    // Save with a sanitized filename
    const sanitizedCropName = cropName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedDiseaseName = diseaseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${sanitizedCropName}_${sanitizedDiseaseName}_report.pdf`);
  } catch (error) {
    throw new PDFGenerationError(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// Helper function to load images
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}; 