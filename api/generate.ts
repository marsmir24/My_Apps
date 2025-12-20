import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request) {
  try {
    const { prompt, modelName, generationConfig } = await req.json();
    
    // Берем ключ из настроек Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    
    // Используем модель, которую прислал фронтенд (или стандартную)
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = await result.response;
    
    // Возвращаем результат фронтенду
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
