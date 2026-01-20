
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly as per the coding guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudyPlan = async (topics: string, availableHours: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a detailed study schedule for the following topics: "${topics}". 
    I have ${availableHours} hours available. Return a JSON array of schedule items.
    Each item must have "time" (HH:MM), "subject" (string), and "duration" (minutes).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            subject: { type: Type.STRING },
            duration: { type: Type.NUMBER }
          },
          required: ["time", "subject", "duration"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};

export const getStudyMotivation = async () => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Give me a short, powerful Brazilian Portuguese motivational quote for a student who is tired but wants to reach their goals. Max 20 words.",
  });
  return response.text;
};

export const searchStudyTopic = async (topic: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça um resumo educativo e atualizado sobre o tema: "${topic}". Explique os conceitos principais de forma didática para um estudante.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Fonte',
    uri: chunk.web?.uri
  })).filter((s: any) => s.uri) || [];

  return { text, sources };
};

export const findStudySpots = async (query: string, latitude?: number, longitude?: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Encontre os melhores lugares para estudar perto de mim que combinem com: "${query}". Pode ser bibliotecas, cafés silenciosos ou espaços de coworking. Liste as opções com breves detalhes.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: latitude && longitude ? { latitude, longitude } : undefined
        }
      }
    },
  });

  const text = response.text;
  const mapChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((chunk: any) => chunk.maps) || [];
  
  const places = mapChunks.map((chunk: any) => ({
    title: chunk.maps.title || "Local",
    uri: chunk.maps.uri,
    snippets: chunk.maps.placeAnswerSources?.reviewSnippets || []
  }));

  return { text, places };
};
