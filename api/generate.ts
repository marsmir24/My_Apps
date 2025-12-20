import { GoogleGenerativeAI } from "@google/generativeai";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const { prompt } = await req.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  return new Response(JSON.stringify({ text: response.text() }), {
    headers: { "Content-Type": "application/json" },
  });
}
