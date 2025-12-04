import { GoogleGenAI } from "@google/genai";
import { OD2_KNOWLEDGE_BASE } from '../constants';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const askGameMasterAI = async (query: string, context: string = ''): Promise<string> => {
  if (!apiKey) return "Configuração de IA ausente (API Key).";

  try {
    const model = 'gemini-2.5-flash';
    const systemPrompt = `
      Você é o "Oráculo", um assistente de Mestre de RPG (Game Master) experiente e útil para o sistema Old Dragon 2e.
      Use o seguinte conhecimento base para responder dúvidas de regras:
      ${OD2_KNOWLEDGE_BASE}
      
      Contexto da mesa atual: ${context}
      
      Se a pergunta for sobre regras, seja direto e cite a regra.
      Se for uma solicitação criativa (gerar nome, descrever sala), seja evocativo e "old school" (foco em exploração e perigo).
      Responda em Português do Brasil. Mantenha as respostas concisas para um formato de chat.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    return response.text || "O Oráculo permanece em silêncio (Erro na resposta).";
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "O Oráculo não conseguiu consultar os planos superiores agora.";
  }
};