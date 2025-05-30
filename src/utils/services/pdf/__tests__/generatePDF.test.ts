import { generatePDF, PDFGenerationError } from '../generatePDF';

describe('generatePDF', () => {
  const mockData = {
    cropName: 'Tomato',
    diseaseName: 'Leaf Spot',
    confidence: 85,
    symptoms: [
      'Dark brown spots on leaf surface.',
      'Irregular shaped spots. Merging spots.'
    ],
    immediateAction: 'Remove and destroy affected leaves to prevent spread.',
    shortTermPlan: 'Monitor plants regularly for new symptoms.',
    organicTreatment: 'Neem Oil Spray every 7–10 days.',
    chemicalTreatment: 'Mancozeb: 2g/L every 10–14 days.',
    imageUrl: 'https://example.com/disease.jpg',
    reportId: '12345'
  };

  const mockStyleOptions = {
    primaryColor: [50, 150, 70],
    secondaryColor: [90, 90, 90],
    accentColor: [40, 154, 255],
    warningColor: [210, 70, 70],
    fontFamily: 'helvetica',
    showQRCode: true,
    showImages: true
  };

  beforeEach(() => {
    // Mock the jsPDF methods
    const mockSave = jest.fn();
    const mockAddImage = jest.fn();
    const mockSetFont = jest.fn();
    const mockSetFontSize = jest.fn();
    const mockSetTextColor = jest.fn();
    const mockText = jest.fn();
    const mockLastAutoTable = { finalY: 0 };

    jest.spyOn(global, 'jsPDF').mockImplementation(() => ({
      setFont: mockSetFont,
      setFontSize: mockSetFontSize,
      setTextColor: mockSetTextColor,
      text: mockText,
      save: mockSave,
      addImage: mockAddImage,
      lastAutoTable: mockLastAutoTable
    }));

    // Mock QRCode
    jest.mock('qrcode', () => ({
      toDataURL: jest.fn().mockResolvedValue('mock-qr-data-url')
    }));
  });

  it('should generate a PDF with the correct data', async () => {
    const mockSave = jest.fn();
    jest.spyOn(global, 'jsPDF').mockImplementation(() => ({
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      setTextColor: jest.fn(),
      text: jest.fn(),
      save: mockSave,
      addImage: jest.fn(),
      lastAutoTable: { finalY: 0 }
    }));

    await generatePDF(mockData);
    expect(mockSave).toHaveBeenCalledWith('Tomato_Leaf Spot_Report.pdf');
  });

  it('should apply custom styles when provided', async () => {
    const mockSetTextColor = jest.fn();
    jest.spyOn(global, 'jsPDF').mockImplementation(() => ({
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      setTextColor: mockSetTextColor,
      text: jest.fn(),
      save: jest.fn(),
      addImage: jest.fn(),
      lastAutoTable: { finalY: 0 }
    }));

    await generatePDF(mockData, mockStyleOptions);
    expect(mockSetTextColor).toHaveBeenCalledWith(...mockStyleOptions.primaryColor!);
  });

  it('should handle image loading errors gracefully', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    const mockDataWithInvalidImage = {
      ...mockData,
      imageUrl: 'invalid-url'
    };

    await generatePDF(mockDataWithInvalidImage);
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('should throw PDFGenerationError on critical errors', async () => {
    jest.spyOn(global, 'jsPDF').mockImplementation(() => {
      throw new Error('PDF generation failed');
    });

    await expect(generatePDF(mockData)).rejects.toThrow(PDFGenerationError);
  });

  it('should handle missing optional fields', async () => {
    const mockDataWithoutOptionals = {
      cropName: 'Tomato',
      diseaseName: 'Leaf Spot',
      confidence: 85,
      symptoms: ['Symptom 1'],
      immediateAction: 'Action 1',
      shortTermPlan: 'Plan 1',
      organicTreatment: 'Treatment 1',
      chemicalTreatment: 'Treatment 2'
    };

    const mockSave = jest.fn();
    jest.spyOn(global, 'jsPDF').mockImplementation(() => ({
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      setTextColor: jest.fn(),
      text: jest.fn(),
      save: mockSave,
      addImage: jest.fn(),
      lastAutoTable: { finalY: 0 }
    }));

    await generatePDF(mockDataWithoutOptionals);
    expect(mockSave).toHaveBeenCalled();
  });
}); 