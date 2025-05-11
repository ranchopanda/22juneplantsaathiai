import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TextSkeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, X, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiChatbotProps {
  language: string;
  isOpen: boolean;
  onClose: () => void;
}

const GeminiChatbot = ({ language, isOpen, onClose }: GeminiChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: language === 'हिंदी' 
        ? 'नमस्ते! मैं आपका कृषि सहायक हूँ। मैं आपकी फसलों, मौसम या खेती के बारे में किसी भी प्रश्न का उत्तर दे सकता हूँ।'
        : 'Hello! I\'m your farming assistant. I can answer any questions about crops, weather, or farming practices.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // In a real implementation, this would call the Gemini API
    // For now, we'll simulate a response
    setTimeout(() => {
      const farmingResponses = {
        'हिंदी': [
          'फसलों की देखभाल के लिए नियमित रूप से सिंचाई महत्वपूर्ण है।',
          'मिट्टी की जांच करके आप सही उर्वरक का चयन कर सकते हैं।',
          'जैविक खेती पर्यावरण के लिए अच्छी है और आपकी फसल की गुणवत्ता बढ़ाती है।',
          'आपके क्षेत्र में इस मौसम में गेहूं की बुवाई उपयुक्त रहेगी।',
          'कीटों से बचाव के लिए नीम का तेल एक प्राकृतिक विकल्प है।',
        ],
        'English': [
          'Regular irrigation is important for crop care.',
          'By testing your soil, you can choose the right fertilizer.',
          'Organic farming is good for the environment and improves crop quality.',
          'Wheat planting would be suitable in your region this season.',
          'Neem oil is a natural alternative for pest control.',
        ]
      };
      
      const languageKey = language === 'हिंदी' ? 'हिंदी' : 'English';
      const randomIndex = Math.floor(Math.random() * farmingResponses[languageKey].length);
      const botResponse = {
        role: 'assistant' as const,
        content: farmingResponses[languageKey][randomIndex]
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleVoiceInput = () => {
    toast({
      title: language === 'हिंदी' ? 'आवाज़ इनपुट' : 'Voice Input',
      description: language === 'हिंदी' ? 'आवाज़ इनपुट सुनना शुरू...' : 'Listening for voice input...'
    });
    
    // Simulate voice input (in a real app, use Web Speech API)
    setTimeout(() => {
      const voiceTexts = {
        'हिंदी': [
          'मेरी फसल की सिंचाई कब करनी चाहिए?',
          'टमाटर में लगने वाले रोग क्या हैं?',
          'इस मौसम में कौन सी फसल अच्छी होगी?'
        ],
        'English': [
          'When should I irrigate my crops?',
          'What are common tomato diseases?',
          'Which crop is good for this season?'
        ]
      };
      
      const languageKey = language === 'हिंदी' ? 'हिंदी' : 'English';
      const randomIndex = Math.floor(Math.random() * voiceTexts[languageKey].length);
      setInputValue(voiceTexts[languageKey][randomIndex]);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 right-4 md:bottom-4 md:right-4 z-50">
      <Card className="w-full sm:w-96 h-[450px] flex flex-col shadow-2xl border-none rounded-2xl overflow-hidden">
        <div className="bg-kisan-green text-white p-3 flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            <h3 className="font-medium">
              {language === 'हिंदी' ? 'कृषि सहायक' : 'Farming Assistant'}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-kisan-green-dark">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <CardContent className="flex-grow p-3 overflow-y-auto bg-slate-50 dark:bg-gray-900">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-kisan-green text-white' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <TextSkeleton lines={2} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleVoiceInput}
            className="shrink-0"
          >
            <Mic className="h-5 w-5 text-kisan-green" />
          </Button>
          <Input
            placeholder={language === 'हिंदी' ? 'अपना प्रश्न यहां टाइप करें...' : 'Type your question here...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-grow"
          />
          <Button 
            onClick={handleSend}
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className="bg-kisan-green hover:bg-kisan-green-dark shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default GeminiChatbot; 