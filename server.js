import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

const getGeminiReply = async ({ systemPrompt, messages }) => {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not set');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // Prepare chat history for Gemini
  const chatHistory = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));

  // Add system prompt as the first message if not already present
  if (!chatHistory.length || chatHistory[0].role !== 'system') {
    chatHistory.unshift({ role: 'system', parts: [{ text: systemPrompt }] });
  }

  const result = await model.generateContent({ contents: chatHistory });
  const response = result.response;
  const text = response.text();
  return text;
};

app.post('/api/chat', async (req, res) => {
  const { systemPrompt, language, crop, location, messages } = req.body;
  try {
    const aiReply = await getGeminiReply({ systemPrompt, messages });
    res.json({ reply: aiReply });
  } catch (err) {
    res.status(500).json({ reply: 'AI backend error: ' + err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`)); 