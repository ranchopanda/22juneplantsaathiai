import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TextSkeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, X, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgriAIChatbotProps {
  language: string;
  isOpen: boolean;
  onClose: () => void;
  crop?: string;
  location?: string;
}

const SYSTEM_PROMPT = `You are AgriAdvisor AI, a friendly and knowledgeable farming assistant designed for Indian farmers. You speak in simple, clear language and can switch between English and Hindi based on the user's preference or input. You help farmers by answering questions about crop diseases, weather, fertilizers, soil health, pest control, government schemes, and sustainable practices.

Always be respectful, concise, and empathetic. Provide farmer-friendly advice in bullet points or short paragraphs. If you are unsure, encourage the farmer to consult a local expert.

Use clear headers and emojis to make answers more engaging (if the user prefers a casual tone). Use Hinglish (Hindi + English) when the user mixes both languages.`;

const AgriAIChatbot = ({ language, isOpen, onClose, crop, location }: AgriAIChatbotProps) => {
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
    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    try {
      // Prepare payload for backend
      const payload = {
        systemPrompt: SYSTEM_PROMPT,
        language,
        crop,
        location,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
          userMessage
        ]
      };
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('AI backend error');
      const data = await res.json();
      const botResponse = {
        role: 'assistant' as const,
        content: data.reply || 'Sorry, I could not process your request.'
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I could not reach the AI assistant. Please try again later.' }]);
      toast({ title: 'AI Error', description: err.message || 'Could not reach backend', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
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
                  <ReactMarkdown>{message.content}</ReactMarkdown>
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

export default AgriAIChatbot; 