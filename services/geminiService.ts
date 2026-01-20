
import { GoogleGenAI, Type } from "@google/genai";

// Standardizing AI instance creation
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudyPlan = async (topics: string, availableHours: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um cronograma de estudos detalhado para os seguintes temas: "${topics}". 
    Eu tenho ${availableHours} horas disponíveis. Retorne um array JSON de itens de cronograma.
    Cada item deve ter "time" (HH:MM), "subject" (string) e "duration" (número de minutos).`,
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

  const text = response.text || '[]';
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    return [];
  }
};

export const getStudyMotivation = async () => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Dê uma frase motivacional poderosa e curta em português brasileiro para um estudante cansado. Máximo 20 palavras.",
    });
    return response.text || "O sucesso é a soma de pequenos esforços repetidos dia após dia.";
  } catch (e) {
    return "O sucesso é a soma de pequenos esforços repetidos dia após dia.";
  }
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

  const text = response.text || "Não foi possível gerar um resumo para este tema.";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Fonte externa',
    uri: chunk.web?.uri
  })).filter((s: any) => s.uri) || [];

  return { text, sources };
};

export const findStudySpots = async (query: string, latitude?: number, longitude?: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-01-2025",
    contents: `Encontre os melhores lugares para estudar (bibliotecas, cafés, coworkings) relacionados a: "${query}".`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: (latitude !== undefined && longitude !== undefined) ? { latitude, longitude } : undefined
        }
      }
    },
  });

  const text = response.text || "Não foram encontrados locais específicos.";
  const mapChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((chunk: any) => chunk.maps) || [];
  
  const places = mapChunks.map((chunk: any) => ({
    title: chunk.maps.title || "Local de Estudo",
    uri: chunk.maps.uri,
    snippets: chunk.maps.placeAnswerSources?.reviewSnippets || []
  }));

  return { text, places };
};
