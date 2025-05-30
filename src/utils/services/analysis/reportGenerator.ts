import { SoilAnalysisResult } from './soilAnalysis';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export type ReportFormat = 'pdf' | 'csv' | 'text';

interface ReportOptions {
  format: ReportFormat;
  language: 'en' | 'hi';
  includeImage?: boolean;
  imageData?: string;
}

const translations = {
  en: {
    title: 'Soil Analysis Report',
    soilType: 'Soil Type',
    phLevel: 'pH Level',
    organicMatter: 'Organic Matter',
    nutrients: 'Nutrients',
    recommendations: 'Recommendations',
    confidence: 'Confidence',
    level: 'Level',
    source: 'Source',
    generated: 'Generated',
    location: 'Location',
    noData: 'No data available'
  },
  hi: {
    title: 'मिट्टी विश्लेषण रिपोर्ट',
    soilType: 'मिट्टी का प्रकार',
    phLevel: 'पीएच स्तर',
    organicMatter: 'कार्बनिक पदार्थ',
    nutrients: 'पोषक तत्व',
    recommendations: 'सिफारिशें',
    confidence: 'विश्वसनीयता',
    level: 'स्तर',
    source: 'स्रोत',
    generated: 'तैयार किया गया',
    location: 'स्थान',
    noData: 'कोई डेटा उपलब्ध नहीं'
  }
};

const LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGc+PHBhdGggZD0iTTYwLDE2MCBDNjAsODAgMTgwLDgwIDE4MCwxNjAgQzE4MCwyNDAgMzAwLDI0MCAzMDAsMTYwIEMzMDAsODAgMTgwLDgwIDE4MCwxNjAgQzE4MCwyNDAgNjAsMjQwIDYwLDE2MCBaIiBzdHJva2U9IiMyMTkxNTAiIHN0cm9rZS13aWR0aD0iMTYiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNjAsMTYwIEM2MCw4MCAxODAsODAgMTgwLDE2MCIgc3Ryb2tlPSIjNkZDRjk3IiBzdHJva2Utd2lkdGg9IjE2IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTE4MCwxNjAgQzE4MCwyNDAgMzAwLDI0MCAzMDAsMTYwIiBzdHJva2U9IiM2RkNGOTciIHN0cm9rZS13aWR0aD0iMTYiIGZpbGw9Im5vbmUiLz48ZWxsaXBzZSBjeD0iNjAiIGN5PSIxNjAiIHJ4PSIxMiIgcnk9IjYiIGZpbGw9IiMyMTkxNTAiIHRyYW5zZm9ybT0icm90YXRlKC0yMCA2MCAxNjApIi8+PGVsbGlwc2UgY3g9IjE4MCIgY3k9IjgwIiByeD0iMTAiIHJ5PSI1IiBmaWxsPSIjMjE5MTUwIiB0cmFuc2Zvcm09InJvdGF0ZSgxMCAxODAgODApIi8+PGVsbGlwc2UgY3g9IjMwMCIgY3k9IjE2MCIgcng9IjEyIiByeT0iNiIgZmlsbD0iIzIxOTE1MCIgdHJhbnNmb3JtPSJyb3RhdGUoMjAgMzAwIDE2MCkiLz48ZWxsaXBzZSBjeD0iMTgwIiBjeT0iMjQwIiByeD0iMTAiIHJ5PSI1IiBmaWxsPSIjMjE5MTUwIiB0cmFuc2Zvcm09InJvdGF0ZSgtMTAgMTgwIDI0MCkiLz48ZWxsaXBzZSBjeD0iMTIwIiBjeT0iMTIwIiByeD0iNyIgcnk9IjMuNSIgZmlsbD0iIzZGQ0Y5NyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE1IDEyMCAxMjApIi8+PGVsbGlwc2UgY3g9IjI0MCIgY3k9IjIwMCIgcng9IjciIHJ5PSIzLjUiIGZpbGw9IiM2RkNGOTciIHRyYW5zZm9ybT0icm90YXRlKDE1IDI0MCAyMDApIi8+PHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmaWxsPSIjMjE5MTUwIiBmb250LXdlaWdodD0iYm9sZCI+QUk8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSIyOTAiIGZvbnQtc2l6ZT0iMzYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmaWxsPSIjMjE5MTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGFudCBTYWF0aGk8L3RleHQ+PC9nPjwvc3ZnPg==`;

export const generateReport = async (
  data: SoilAnalysisResult,
  options: ReportOptions
): Promise<Blob> => {
  const t = translations[options.language];

  switch (options.format) {
    case 'pdf':
      return generatePDF(data, options);
    case 'csv':
      return generateCSV(data, options);
    case 'text':
      return generateText(data, options);
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
};

const generatePDF = async (data: SoilAnalysisResult, options: ReportOptions): Promise<Blob> => {
  const doc = new jsPDF();
  const t = translations[options.language];

  // Add logo at the top left
  doc.addImage(LOGO_BASE64, 'SVG', 10, 8, 28, 28);

  // Add title
  doc.setFontSize(20);
  doc.text(t.title, 14, 20);

  // Add generation info
  doc.setFontSize(10);
  doc.text(`${t.generated}: ${new Date().toLocaleString()}`, 14, 30);
  if (data.location_context) {
    doc.text(`${t.location}: ${data.location_context}`, 14, 35);
  }

  // Add soil type and pH
  doc.setFontSize(12);
  doc.text(`${t.soilType}: ${data.soil_type}`, 14, 45);
  doc.text(`${t.phLevel}: ${data.ph_level}`, 14, 50);
  if (data.estimated_organic_matter) {
    doc.text(`${t.organicMatter}: ${data.estimated_organic_matter}`, 14, 55);
  }

  // Add nutrients table
  const nutrientsData = data.nutrients.map(n => [
    n.name,
    n.level,
    `${n.confidence}%`,
    n.recommendation
  ]);

  doc.autoTable({
    startY: 60,
    head: [[t.nutrients, t.level, t.confidence, t.recommendations]],
    body: nutrientsData,
    theme: 'grid'
  });

  // Add recommendations
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(t.recommendations, 14, finalY);
  
  data.recommendations.forEach((rec, index) => {
    doc.setFontSize(10);
    doc.text(`• ${rec}`, 20, finalY + 10 + (index * 7));
  });

  // Add image if provided
  if (options.includeImage && options.imageData) {
    const imgY = (doc as any).lastAutoTable.finalY + 10 + (data.recommendations.length * 7) + 10;
    doc.addImage(options.imageData, 'JPEG', 14, imgY, 100, 75);
  }

  return doc.output('blob');
};

const generateCSV = (data: SoilAnalysisResult, options: ReportOptions): Blob => {
  const t = translations[options.language];
  
  const rows = [
    [t.title, 'Soil Analysis Report'],
    [t.generated, new Date().toLocaleString()],
    [t.location, data.location_context || ''],
    [t.soilType, data.soil_type],
    [t.phLevel, data.ph_level],
    [t.organicMatter, data.estimated_organic_matter || ''],
    [],
    [t.nutrients, t.level, t.confidence, t.recommendations],
    ...data.nutrients.map(n => [n.name, n.level, `${n.confidence}%`, n.recommendation]),
    [],
    [t.recommendations],
    ...data.recommendations.map(rec => [rec])
  ];

  const csvContent = rows.map(row => row.join(',')).join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

const generateText = (data: SoilAnalysisResult, options: ReportOptions): Blob => {
  const t = translations[options.language];
  
  const text = `
${t.title}
${'='.repeat(50)}

${t.generated}: ${new Date().toLocaleString()}
${t.location}: ${data.location_context || t.noData}

${t.soilType}: ${data.soil_type}
${t.phLevel}: ${data.ph_level}
${t.organicMatter}: ${data.estimated_organic_matter || t.noData}

${t.nutrients}:
${data.nutrients.map(n => 
  `- ${n.name}: ${n.level} (${n.confidence}%)
   ${t.recommendations}: ${n.recommendation}`
).join('\n')}

${t.recommendations}:
${data.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}; 