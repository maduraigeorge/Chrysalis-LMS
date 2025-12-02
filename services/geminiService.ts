import { GoogleGenAI } from "@google/genai";

// Ensure API key is present; in a real app, handle missing key gracefully in UI
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const askLMSAssistant = async (
  prompt: string, 
  context: string
): Promise<string> => {
  if (!apiKey) return "API Key is missing. Please configure the environment.";

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a helpful AI learning assistant embedded in an LMS (Learning Management System). 
    Your goal is to help students understand the content they are currently viewing. 
    Keep answers concise, encouraging, and educational.
    The user is currently navigating: ${context}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};
