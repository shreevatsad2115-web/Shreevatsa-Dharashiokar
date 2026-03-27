import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in the environment.");
}

const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

export const getGeminiResponse = async (prompt: string, history: any[] = []) => {
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are the NoiseMap AI Assistant, an expert in urban acoustics and environmental health. Provide data-driven insights about noise pollution, its health impacts, and urban planning solutions. Use a professional, technical, yet accessible tone.",
    },
    contents: [
      ...history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: prompt }] }
    ],
  });

  return response.text;
};

export const searchUrbanZones = async (query: string, location?: { lat: number; lng: number }) => {
  const result = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: `Search for urban noise data or zones related to: ${query}` }] }],
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: location ? { latitude: location.lat, longitude: location.lng } : undefined,
        },
      },
    },
  });

  return {
    text: result.text,
    grounding: result.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
};

export const generateSonicImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  const result = await genAI.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size,
      },
    },
  });

  const part = result.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};
