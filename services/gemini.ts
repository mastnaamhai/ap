import { GoogleGenAI } from "@google/genai";
import { Invoice, Product } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

export const generateInsights = async (invoices: Invoice[], products: Product[], lowStockCount: number) => {
  if (!GEMINI_API_KEY) {
    return "API Key not found. Please configure the environment variable.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // Calculate basic stats to send to context
    const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const last3Invoices = invoices.slice(0, 3).map(inv => `${inv.date}: ₹${inv.grandTotal}`).join(', ');
    const topProducts = products.filter(p => p.stock < p.minStock).map(p => p.name).join(', ');

    const prompt = `
      You are an AI assistant for a pharmacy store owner in India.
      Here is the current status:
      - Total Revenue: ₹${totalSales}
      - Total Invoices: ${invoices.length}
      - Low Stock Items Count: ${lowStockCount}
      - Low Stock Items Names: ${topProducts}
      - Recent Sales Trend: ${last3Invoices}

      Provide a concise 3-bullet point summary of business health, identifying risks (like low stock) and opportunities. 
      Keep it professional and actionable. Do not use markdown formatting like bolding, just plain text bullets.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at this moment. Please check your connection.";
  }
};